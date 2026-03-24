import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { MessagePriority, TriageLabel } from '../enums/comms.enum';
import { ApiProperty } from '@nestjs/swagger';

@Entity('messages')
export class Message {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'sender_id' })
  sender: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'recipient_id' })
  recipient: User | null;

  @ApiProperty()
  @Column()
  subject: string;

  @ApiProperty()
  @Column({ type: 'text' })
  body: string;

  @ApiProperty({ enum: MessagePriority })
  @Column({ type: 'enum', enum: MessagePriority, default: MessagePriority.NORMAL })
  priority: MessagePriority;

  @ApiProperty({ enum: TriageLabel, required: false })
  @Column({ type: 'enum', enum: TriageLabel, nullable: true })
  triage_label: TriageLabel;

  @ApiProperty({ type: 'number', required: false })
  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  triage_confidence: number;

  @ApiProperty({ default: false })
  @Column({ default: false })
  is_read: boolean;

  @ApiProperty({ required: false })
  @Column({ type: 'timestamp', nullable: true })
  read_at: Date;

  @ApiProperty()
  @CreateDateColumn()
  created_at: Date;
}
