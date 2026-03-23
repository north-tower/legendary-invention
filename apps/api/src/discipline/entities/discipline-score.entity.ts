import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Student } from '../../students/entities/student.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('discipline_scores')
export class DisciplineScore {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @ApiProperty({ default: 100 })
  @Column({ type: 'int', default: 100 })
  score: number;

  @ApiProperty({ default: 0 })
  @Column({ type: 'int', default: 0 })
  total_incidents: number;

  @ApiProperty({ required: false })
  @Column({ type: 'timestamp', nullable: true })
  last_incident_at: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updated_at: Date;
}
