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
import { User } from '../../users/entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('medical_cards')
export class MedicalCard {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  blood_type: string;

  @ApiProperty({ type: [String] })
  @Column({ type: 'simple-array', default: '' })
  allergies: string[];

  @ApiProperty({ type: [String] })
  @Column({ type: 'simple-array', default: '' })
  chronic_conditions: string[];

  @ApiProperty({ type: [String] })
  @Column({ type: 'simple-array', default: '' })
  current_medications: string[];

  @ApiProperty()
  @Column()
  emergency_contact_name: string;

  @ApiProperty()
  @Column()
  emergency_contact_phone: string;

  @ApiProperty()
  @Column()
  emergency_contact_relation: string;

  @ApiProperty({ required: false })
  @Column({ type: 'text', nullable: true })
  medical_notes: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'last_updated_by_id' })
  last_updated_by: User;

  @ApiProperty()
  @UpdateDateColumn()
  updated_at: Date;
}
