import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('whatsapp_sessions')
export class WhatsAppSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  phone_number: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent: User | null;

  @Column({ type: 'uuid', nullable: true })
  selected_child_id: string | null;

  @Column({ type: 'jsonb', default: [] })
  context: Array<{ role: 'user' | 'assistant'; content: string }>;

  @Column({ type: 'varchar', default: 'idle' })
  state: string;

  @Column({ type: 'jsonb', nullable: true })
  pending_action: Record<string, any> | null;

  @Column({ type: 'timestamp', default: () => 'NOW()' })
  last_active_at: Date;

  @CreateDateColumn()
  created_at: Date;
}
