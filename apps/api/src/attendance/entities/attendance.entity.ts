import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Student } from '../../students/entities/student.entity';
import { User } from '../../users/entities/user.entity';
import { AttendanceStatus } from '../enums/attendance-status.enum';
import { ApiProperty } from '@nestjs/swagger';

@Entity('attendance')
@Index(['student', 'date'])
export class Attendance {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'recorded_by_id' })
  recorded_by: User;

  @ApiProperty()
  @Column({ type: 'date' })
  date: string;

  @ApiProperty({ enum: AttendanceStatus })
  @Column({ type: 'enum', enum: AttendanceStatus })
  status: AttendanceStatus;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  remarks: string;

  @ApiProperty()
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updated_at: Date;
}
