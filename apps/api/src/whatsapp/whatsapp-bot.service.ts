import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { User } from '../users/entities/user.entity';
import { Student } from '../students/entities/student.entity';
import { UsersService } from '../users/users.service';
import { StudentsService } from '../students/students.service';
import { StudentFeeAccountService } from '../finance/student-fee-account.service';
import { AttendanceService } from '../attendance/attendance.service';
import { DisciplineService } from '../discipline/discipline.service';
import { CommsService } from '../comms/comms.service';
import { SendMessageDto } from '../comms/dto/comms.dto';
import { MessagePriority } from '../comms/enums/comms.enum';
import { TwilioService } from './twilio.service';
import { ConversationStateService } from './conversation-state.service';
import { WhatsAppSession } from './entities/whatsapp-session.entity';
import { MpesaService } from '../mpesa/mpesa.service';
import { AttendanceStatus } from '../attendance/enums/attendance-status.enum';
import { IncidentStatus } from '../discipline/enums/discipline.enum';
import { UserRole } from '../users/enums/user-role.enum';

const SYSTEM_PROMPT = `
You are Sychar CoPilot, a helpful school assistant for Nkoroi Mixed Secondary Day School in Rongai, Kenya. You help parents query information about their child via WhatsApp.

CHILD DATA CONTEXT:
{childContext}

INSTRUCTIONS:
- Be warm, concise, and helpful. WhatsApp messages should be short (under 150 words).
- Respond in the SAME LANGUAGE the parent used (English, Swahili, or mixed Sheng).
- Never reveal other students' data. Only answer about the child in context.
- For sensitive discipline details: give summaries only, not full descriptions.
- Format amounts as "KES X,XXX" - always include the comma separator.
- Use simple formatting: bold with *asterisks*, line breaks with newlines. No markdown headers.

WHAT YOU CAN DO:
1. Answer questions about fees, attendance, discipline scores
2. Trigger M-Pesa payment (set intent: stk_push)
3. Send a message to the Principal (set intent: send_message)
4. General school queries

RESPOND ONLY IN THIS JSON FORMAT:
{
  "text": "Your WhatsApp reply here",
  "intent": "none" | "stk_push" | "send_message",
  "intent_data": {}
}
`;

interface ClaudeResponse {
  text: string;
  intent: 'none' | 'stk_push' | 'send_message';
  intent_data: { amount?: number; feeAccountId?: string };
}

interface BotIntent {
  type: 'none' | 'stk_push' | 'send_message';
  data: { amount?: number; feeAccountId?: string };
}

@Injectable()
export class WhatsAppBotService {
  private readonly logger = new Logger(WhatsAppBotService.name);
  private readonly anthropic: Anthropic;

  constructor(
    private readonly twilioService: TwilioService,
    private readonly conversationStateService: ConversationStateService,
    private readonly usersService: UsersService,
    private readonly studentsService: StudentsService,
    private readonly financeService: StudentFeeAccountService,
    private readonly attendanceService: AttendanceService,
    private readonly disciplineService: DisciplineService,
    private readonly commsService: CommsService,
    private readonly mpesaService: MpesaService,
    private readonly config: ConfigService,
  ) {
    this.anthropic = new Anthropic({
      apiKey: this.config.get<string>('app.anthropic.apiKey') || '',
    });
  }

  async handleIncoming(from: string, body: string): Promise<void> {
    const normalizedPhone = this.normalizePhone(from);
    const parent = await this.usersService.findByPhone(normalizedPhone);
    const session = await this.conversationStateService.getOrCreate(from, parent);

    if (!parent) {
      await this.twilioService.sendMessage(
        from,
        'Hi. This number is not linked to a parent account. Please contact the school office for assistance.',
      );
      return;
    }

    await this.conversationStateService.updateContext(session.id, 'user', body);

    try {
      if (session.state === 'awaiting_child_selection') {
        await this.handleChildSelection(session, parent, body);
        return;
      }
      if (session.state === 'awaiting_message_body') {
        await this.handleMessageBody(session, parent, body);
        return;
      }
      if (session.state === 'awaiting_payment_confirm') {
        await this.handlePaymentConfirm(session, parent, body);
        return;
      }
      await this.handleIdleState(session, parent, body);
    } catch (error) {
      this.logger.error('Failed to process WhatsApp message', error);
      await this.twilioService.sendMessage(
        from,
        'Sorry, something went wrong. Please try again in a moment.',
      );
    }
  }

  private async handleIdleState(
    session: WhatsAppSession,
    parent: User,
    message: string,
  ): Promise<void> {
    const children = await this.studentsService.findByParentId(parent.id);
    if (!children.length) {
      await this.reply(session, 'I could not find linked students for your account.');
      return;
    }

    let selectedChild: Student | undefined;
    if (children.length > 1 && !session.selected_child_id) {
      const list = children.map((child, idx) => `${idx + 1}. ${child.full_name}`).join('\n');
      await this.conversationStateService.updateState(session.id, 'awaiting_child_selection');
      await this.reply(session, `Please choose your child by replying with a number:\n${list}`);
      return;
    }

    if (session.selected_child_id) {
      selectedChild = children.find((child) => child.id === session.selected_child_id);
    }
    if (!selectedChild) selectedChild = children[0];

    const childContext = await this.buildChildContext(selectedChild);
    const claude = await this.callClaude(session, childContext, message);
    const intent = this.parseIntent(claude);

    if (intent.type === 'send_message') {
      await this.conversationStateService.updateState(session.id, 'awaiting_message_body');
      await this.reply(
        session,
        'Please type the message you want me to send to the Principal.',
      );
      return;
    }

    if (intent.type === 'stk_push') {
      const history = await this.financeService.getStudentFeeHistory(selectedChild.id);
      const targetAccount = intent.data.feeAccountId
        ? history.find((account) => account.id === intent.data.feeAccountId)
        : history.find((account) => Number(account.balance) > 0);

      if (!targetAccount) {
        await this.reply(session, 'No payable fee account found for this student.');
        return;
      }

      const amount = intent.data.amount || Number(targetAccount.balance);
      await this.conversationStateService.setPendingAction(session.id, {
        type: 'stk_push',
        studentId: selectedChild.id,
        feeStructureId: targetAccount.fee_structure.id,
        feeAccountId: targetAccount.id,
        amount,
        phone: this.normalizePhone(parent.phone || session.phone_number),
      });
      await this.conversationStateService.updateState(session.id, 'awaiting_payment_confirm');
      await this.reply(
        session,
        `Confirm M-Pesa payment of *KES ${Math.round(amount).toLocaleString('en-KE')}* to your number ${this.normalizePhone(
          parent.phone || session.phone_number,
        )}?\nReply *yes* to confirm or *no* to cancel.`,
      );
      return;
    }

    await this.reply(session, claude.text || "Sorry, I didn't understand that.");
  }

  private async handleChildSelection(
    session: WhatsAppSession,
    parent: User,
    message: string,
  ): Promise<void> {
    const children = await this.studentsService.findByParentId(parent.id);
    const index = parseInt(message.trim(), 10) - 1;
    if (Number.isNaN(index) || index < 0 || index >= children.length) {
      const list = children.map((child, idx) => `${idx + 1}. ${child.full_name}`).join('\n');
      await this.reply(session, `Please reply with a number:\n${list}`);
      return;
    }

    await this.conversationStateService.setSelectedChild(session.id, children[index].id);
    await this.conversationStateService.updateState(session.id, 'idle');
    await this.handleIdleState(session, parent, 'Continue');
  }

  private async handleMessageBody(
    session: WhatsAppSession,
    parent: User,
    message: string,
  ): Promise<void> {
    const principals = await this.usersService.findAll(UserRole.PRINCIPAL);
    const dto: SendMessageDto = {
      subject: 'WhatsApp Parent Message',
      body: message,
      priority: MessagePriority.NORMAL,
      recipientId: principals[0]?.id,
    };
    await this.commsService.sendMessage(dto, parent);
    await this.conversationStateService.resetSession(session.id);
    await this.reply(session, 'Your message has been sent to the Principal.');
  }

  private async handlePaymentConfirm(
    session: WhatsAppSession,
    _parent: User,
    message: string,
  ): Promise<void> {
    const normalized = message.trim().toLowerCase();
    const action = session.pending_action;

    if (!action || action.type !== 'stk_push') {
      await this.conversationStateService.resetSession(session.id);
      await this.reply(session, 'No pending payment found.');
      return;
    }

    if (['yes', 'ndio', 'confirm'].includes(normalized)) {
      await this.mpesaService.initiateSTKPush({
        studentId: action.studentId,
        feeStructureId: action.feeStructureId,
        amount: action.amount,
        phone_number: action.phone,
      });
      await this.conversationStateService.resetSession(session.id);
      await this.reply(
        session,
        'STK Push sent to your number. Enter your M-Pesa PIN to complete.',
      );
      return;
    }

    if (['no', 'hapana', 'cancel'].includes(normalized)) {
      await this.conversationStateService.resetSession(session.id);
      await this.reply(session, 'Payment cancelled.');
      return;
    }

    await this.reply(session, 'Please reply *yes* to confirm or *no* to cancel.');
  }

  private async buildChildContext(child: Student): Promise<string> {
    const history = await this.financeService.getStudentFeeHistory(child.id);
    const fee = history[0];
    const today = new Date().toISOString().slice(0, 10);
    const from = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const attendance = await this.attendanceService.getByStudent(child.id, from, today);
    const disciplineIncidents = await this.disciplineService.getIncidentsByStudent(child.id);

    let score = 100;
    try {
      score = (await this.disciplineService.getScoreByStudent(child.id)).score;
    } catch (_e) {
      score = 100;
    }

    const counts = {
      present: attendance.filter((a) => a.status === AttendanceStatus.PRESENT).length,
      absent: attendance.filter((a) => a.status === AttendanceStatus.ABSENT).length,
      late: attendance.filter((a) => a.status === AttendanceStatus.LATE).length,
      excused: attendance.filter((a) => a.status === AttendanceStatus.EXCUSED).length,
    };
    const todayRecord = attendance.find((a) => a.date === today);
    const openIncidents = disciplineIncidents.filter((i) => i.status === IncidentStatus.OPEN).length;
    const lastIncident = disciplineIncidents[0];

    return [
      `STUDENT: ${child.full_name} | ${child.form.replace('form_', 'Form ')}${child.stream} | ADM: ${child.admission_number}`,
      fee
        ? `FEES (${fee.fee_structure.term.replace('_', ' ')} ${fee.fee_structure.academic_year}): Billed KES ${Math.round(
            Number(fee.billed_amount),
          ).toLocaleString('en-KE')} | Paid KES ${Math.round(Number(fee.total_paid)).toLocaleString(
            'en-KE',
          )} | Balance KES ${Math.round(Number(fee.balance)).toLocaleString('en-KE')} | ${fee.status}`
        : 'FEES: No fee account found',
      `ATTENDANCE (last 7 days): Present ${counts.present} | Absent ${counts.absent} | Late ${counts.late} | Excused ${counts.excused} | Today: ${todayRecord?.status || 'NO_RECORD'}`,
      `DISCIPLINE: Score ${score}/100 | Open incidents: ${openIncidents}${lastIncident ? ` | Last incident: ${lastIncident.incident_type}` : ''}`,
    ].join('\n');
  }

  private async callClaude(
    session: WhatsAppSession,
    childContext: string,
    userMessage: string,
  ): Promise<ClaudeResponse> {
    const prompt = SYSTEM_PROMPT.replace('{childContext}', childContext);
    const history = (session.context || []).slice(-8).map((item) => ({
      role: item.role,
      content: item.content,
    }));

    try {
      const completion = await this.anthropic.messages.create({
        model: this.config.get<string>('app.anthropic.model') || 'claude-sonnet-4-20250514',
        max_tokens: 400,
        system: prompt,
        messages: [...history, { role: 'user', content: userMessage }],
      });

      const text = completion.content
        .map((block) => ('text' in block ? block.text : ''))
        .join('')
        .trim();

      return this.safeParseClaude(text);
    } catch (error) {
      this.logger.error('Claude request failed', error);
      return { text: "Sorry, I didn't understand that.", intent: 'none', intent_data: {} };
    }
  }

  private parseIntent(response: ClaudeResponse): BotIntent {
    const type =
      response.intent === 'stk_push' || response.intent === 'send_message'
        ? response.intent
        : 'none';
    return { type, data: response.intent_data || {} };
  }

  private safeParseClaude(raw: string): ClaudeResponse {
    try {
      const parsed = JSON.parse(raw) as ClaudeResponse;
      return {
        text: parsed.text || "Sorry, I didn't understand that.",
        intent: parsed.intent || 'none',
        intent_data: parsed.intent_data || {},
      };
    } catch (_err) {
      return { text: "Sorry, I didn't understand that.", intent: 'none', intent_data: {} };
    }
  }

  private async reply(session: WhatsAppSession, text: string): Promise<void> {
    await this.twilioService.sendMessage(session.phone_number, text.slice(0, 1600));
    await this.conversationStateService.updateContext(session.id, 'assistant', text);
  }

  private normalizePhone(phone: string): string {
    let normalized = phone.trim().replace(/^whatsapp:/i, '').replace(/\s+/g, '');
    if (normalized.startsWith('07')) normalized = `+254${normalized.slice(1)}`;
    if (normalized.startsWith('2547')) normalized = `+${normalized}`;
    return normalized;
  }
}
