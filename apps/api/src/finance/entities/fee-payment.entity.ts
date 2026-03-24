import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Student } from '../../students/entities/student.entity';
import { FeeStructure } from './fee-structure.entity';
import { User } from '../../users/entities/user.entity';
import { PaymentMethod, PaymentStatus } from '../enums/finance.enum';
import { ApiProperty } from '@nestjs/swagger';

@Entity('fee_payments')
export class FeePayment {
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
  amount: number;

  @ApiProperty({ enum: PaymentMethod })
  @Column({ type: 'enum', enum: PaymentMethod })
  payment_method: PaymentMethod;

  @ApiProperty({ required: false, uniqueItems: true })
  @Column({ nullable: true, unique: true })
  mpesa_receipt: string;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  mpesa_phone: string;

  @ApiProperty()
  @Column({ type: 'timestamp' })
  transaction_date: Date;

  @ApiProperty({ enum: PaymentStatus, default: PaymentStatus.COMPLETED })
  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.COMPLETED })
  status: PaymentStatus;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'recorded_by_id' })
  recorded_by: User;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  notes: string;

  @ApiProperty()
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updated_at: Date;
}
