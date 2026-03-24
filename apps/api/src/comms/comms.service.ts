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
      const { recipientId, ...messageData } = dto;

      const message = this.messageRepository.create({
        ...messageData,
        sender,
        triage_label: triageResult.label,
        triage_confidence: triageResult.confidence,
      });

      if (recipientId) {
        message.recipient = await this.messageRepository.manager.findOne(User, { where: { id: recipientId } });
      }

      return await this.messageRepository.save(message);
    } catch (error) {
      throw new InternalServerErrorException('Error sending message');
    }
  }

  async getInbox(user: User, label?: TriageLabel): Promise<Message[]> {
    try {
      const query = this.messageRepository.createQueryBuilder('message')
        .leftJoinAndSelect('message.sender', 'sender')
        .leftJoinAndSelect('message.recipient', 'recipient')
        .orderBy('message.created_at', 'DESC');

      if (user.role === 'parent') {
        // Parents see messages they sent or received
        query.where('sender.id = :userId OR recipient.id = :userId', { userId: user.id });
      } else {
        // Staff see all messages sent to school (no recipient) or explicitly to them
        query.where('message.recipient_id IS NULL OR recipient.id = :userId', { userId: user.id });
      }

      if (label) {
        query.andWhere('message.triage_label = :label', { label });
      }
      
      return await query.getMany();
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

  async findOne(id: string): Promise<Message> {
    try {
      const message = await this.messageRepository.findOne({
        where: { id },
        relations: ['sender'],
      });
      if (!message) throw new NotFoundException('Message not found');
      return message;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Error fetching message');
    }
  }
}
