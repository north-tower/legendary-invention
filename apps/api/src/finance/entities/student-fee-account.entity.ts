import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Student } from '../../students/entities/student.entity';
import { FeeStructure } from './fee-structure.entity';

export enum FeeAccountStatus {
  PENDING = 'PENDING',
  PARTIAL = 'PARTIAL',
  CLEARED = 'CLEARED',
  OVERPAID = 'OVERPAID',
}

@Entity('student_fee_accounts')
@Unique(['student', 'fee_structure'])
export class StudentFeeAccount {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @ManyToOne(() => FeeStructure)
  @JoinColumn({ name: 'fee_structure_id' })
  fee_structure: FeeStructure;

  @ApiProperty({ type: 'number' })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  billed_amount: number;

  @ApiProperty({ type: 'number', default: 0 })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  exemption_amount: number;

  @ApiProperty({ required: false })
  @Column({ type: 'text', nullable: true })
  exemption_reason: string | null;

  @ApiProperty({ type: 'number', default: 0 })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  arrears_brought_forward: number;

  @ApiProperty({ type: 'number', default: 0 })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total_paid: number;

  @ApiProperty({ type: 'number', default: 0 })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  balance: number;

  @ApiProperty({ enum: FeeAccountStatus, default: FeeAccountStatus.PENDING })
  @Column({
    type: 'enum',
    enum: FeeAccountStatus,
    default: FeeAccountStatus.PENDING,
  })
  status: FeeAccountStatus;

  @ApiProperty({ required: false })
  @Column({ type: 'timestamp', nullable: true })
  last_payment_at: Date | null;

  @ApiProperty()
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updated_at: Date;
}
