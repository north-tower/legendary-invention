import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  OneToOne,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Student } from '../../students/entities/student.entity';
import { FeeStructure } from './fee-structure.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('fee_balances')
export class FeeBalance {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @ManyToOne(() => FeeStructure)
  @JoinColumn({ name: 'fee_structure_id' })
  fee_structure: FeeStructure;

  @ApiProperty({ type: 'number' })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total_billed: number;

  @ApiProperty({ type: 'number' })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total_paid: number;

  @ApiProperty({ type: 'number' })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  balance: number;

  @ApiProperty({ required: false })
  @Column({ type: 'timestamp', nullable: true })
  last_payment_at: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updated_at: Date;
}
