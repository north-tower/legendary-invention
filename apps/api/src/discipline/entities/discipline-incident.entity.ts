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
import { IncidentType, Severity, IncidentStatus } from '../enums/discipline.enum';
import { ApiProperty } from '@nestjs/swagger';

@Entity('discipline_incidents')
export class DisciplineIncident {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reported_by_id' })
  reported_by: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'reviewed_by_id' })
  reviewed_by: User;

  @ApiProperty({ enum: IncidentType })
  @Column({ type: 'enum', enum: IncidentType })
  incident_type: IncidentType;

  @ApiProperty({ enum: Severity })
  @Column({ type: 'enum', enum: Severity })
  severity: Severity;

  @ApiProperty()
  @Column({ type: 'text' })
  description: string;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  action_taken: string;

  @ApiProperty({ enum: IncidentStatus })
  @Index()
  @Column({ type: 'enum', enum: IncidentStatus, default: IncidentStatus.OPEN })
  status: IncidentStatus;

  @ApiProperty()
  @Column({ type: 'date' })
  incident_date: string;

  @ApiProperty({ required: false })
  @Column({ type: 'timestamp', nullable: true })
  resolved_at: Date;

  @ApiProperty()
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updated_at: Date;
}
