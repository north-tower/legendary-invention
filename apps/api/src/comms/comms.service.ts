import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { SendMessageDto } from './dto/comms.dto';
import { User } from '../users/entities/user.entity';
import { TriageLabel } from './enums/comms.enum';

@Injectable()
export class CommsService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
  ) {}

  // Mock AI Triage function
  private async triageMessage(body: string): Promise<{ label: TriageLabel; confidence: number }> {
    const lowerBody = body.toLowerCase();
    if (lowerBody.includes('fee') || lowerBody.includes('pay') || lowerBody.includes('money')) {
      return { label: TriageLabel.FEE_QUERY, confidence: 0.95 };
    }
    if (lowerBody.includes('grade') || lowerBody.includes('exam') || lowerBody.includes('study')) {
      return { label: TriageLabel.ACADEMIC_CONCERN, confidence: 0.88 };
    }
    if (lowerBody.includes('sick') || lowerBody.includes('hospital') || lowerBody.includes('emergency')) {
      return { label: TriageLabel.EMERGENCY, confidence: 0.99 };
    }
    return { label: TriageLabel.GENERAL_INQUIRY, confidence: 0.75 };
  }

  async sendMessage(dto: SendMessageDto, sender: User): Promise<Message> {
    try {
      const triageResult = await this.triageMessage(dto.body);

      const message = this.messageRepository.create({
        ...dto,
        sender,
        triage_label: triageResult.label,
        triage_confidence: triageResult.confidence,
      });

      return await this.messageRepository.save(message);
    } catch (error) {
      throw new InternalServerErrorException('Error sending message');
    }
  }

  async getInbox(label?: TriageLabel): Promise<Message[]> {
    try {
      const where: any = {};
      if (label) where.triage_label = label;
      
      return await this.messageRepository.find({
        where,
        order: { created_at: 'DESC' },
        relations: ['sender'],
      });
    } catch (error) {
      throw new InternalServerErrorException('Error fetching inbox');
    }
  }

  async markAsRead(id: string): Promise<Message> {
    try {
      const message = await this.messageRepository.findOneBy({ id });
      if (!message) throw new NotFoundException('Message not found');

      message.is_read = true;
      message.read_at = new Date();
      return await this.messageRepository.save(message);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Error marking message as read');
    }
  }
}
