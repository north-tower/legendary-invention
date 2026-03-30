import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WhatsAppSession } from './entities/whatsapp-session.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ConversationStateService {
  constructor(
    @InjectRepository(WhatsAppSession)
    private readonly sessionRepo: Repository<WhatsAppSession>,
  ) {}

  async getOrCreate(phoneNumber: string, parent: User | null): Promise<WhatsAppSession> {
    try {
      let session = await this.sessionRepo.findOne({
        where: { phone_number: phoneNumber },
        relations: ['parent'],
      });

      if (!session) {
        session = this.sessionRepo.create({
          phone_number: phoneNumber,
          parent,
          state: 'idle',
          context: [],
          selected_child_id: null,
          pending_action: null,
        });
      } else if (parent && (!session.parent || session.parent.id !== parent.id)) {
        session.parent = parent;
      }

      session.last_active_at = new Date();
      return await this.sessionRepo.save(session);
    } catch (error) {
      throw new InternalServerErrorException('Failed to load WhatsApp session');
    }
  }

  async updateState(sessionId: string, state: string): Promise<void> {
    await this.sessionRepo.update({ id: sessionId }, { state, last_active_at: new Date() });
  }

  async updateContext(
    sessionId: string,
    role: 'user' | 'assistant',
    content: string,
  ): Promise<void> {
    const session = await this.sessionRepo.findOne({ where: { id: sessionId } });
    if (!session) return;
    session.context = [...(session.context || []), { role, content }].slice(-10);
    session.last_active_at = new Date();
    await this.sessionRepo.save(session);
  }

  async setSelectedChild(sessionId: string, childId: string): Promise<void> {
    await this.sessionRepo.update(
      { id: sessionId },
      { selected_child_id: childId, last_active_at: new Date() },
    );
  }

  async setPendingAction(sessionId: string, action: Record<string, any> | null): Promise<void> {
    await this.sessionRepo.update(
      { id: sessionId },
      { pending_action: action, last_active_at: new Date() },
    );
  }

  async resetSession(sessionId: string): Promise<void> {
    await this.sessionRepo.update(
      { id: sessionId },
      {
        state: 'idle',
        pending_action: null,
        selected_child_id: null,
        last_active_at: new Date(),
      },
    );
  }
}
