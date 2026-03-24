import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Student } from '../../students/entities/student.entity';
import { MpesaStatus } from '../enums/mpesa.enum';
import { ApiProperty } from '@nestjs/swagger';

@Entity('mpesa_transactions')
export class MpesaTransaction {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ uniqueItems: true })
  @Column({ unique: true })
  checkout_request_id: string;

  @ApiProperty()
  @Column()
  merchant_request_id: string;

  @ApiProperty()
  @Column()
  phone_number: string;

  @ApiProperty({ type: 'number' })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @ManyToOne(() => Student, { nullable: true })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  result_code: string;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  result_desc: string;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  mpesa_receipt: string;

  @ApiProperty({ enum: MpesaStatus })
  @Column({ type: 'enum', enum: MpesaStatus, default: MpesaStatus.INITIATED })
  status: MpesaStatus;

  @ApiProperty()
  @CreateDateColumn()
  initiated_at: Date;

  @ApiProperty({ required: false })
  @Column({ type: 'timestamp', nullable: true })
  completed_at: Date;

  @ApiProperty({ required: false })
  @Column({ type: 'jsonb', nullable: true })
  raw_callback: any;
}
