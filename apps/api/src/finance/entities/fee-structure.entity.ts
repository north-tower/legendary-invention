import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Form } from '../../users/enums/user-role.enum';
import { Term } from '../enums/finance.enum';
import { ApiProperty } from '@nestjs/swagger';

@Entity('fee_structures')
export class FeeStructure {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ enum: Form })
  @Column({ type: 'enum', enum: Form })
  form: Form;

  @ApiProperty({ example: '2025' })
  @Column()
  academic_year: string;

  @ApiProperty({ enum: Term })
  @Column({ type: 'enum', enum: Term })
  term: Term;

  @ApiProperty({ type: 'number' })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total_amount: number;

  @ApiProperty({ default: true })
  @Column({ default: true })
  is_active: boolean;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by_id' })
  created_by: User;

  @ApiProperty()
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updated_at: Date;
}
