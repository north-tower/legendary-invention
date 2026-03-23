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
import { Form, Stream, Gender } from '../../users/enums/user-role.enum';
import { ApiProperty } from '@nestjs/swagger';

@Entity('students')
export class Student {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column()
  full_name: string;

  @ApiProperty({ uniqueItems: true })
  @Column({ unique: true })
  admission_number: string;

  @ApiProperty({ enum: Form })
  @Column({ type: 'enum', enum: Form })
  form: Form;

  @ApiProperty({ enum: Stream })
  @Column({ type: 'enum', enum: Stream })
  stream: Stream;

  @ApiProperty({ enum: Gender })
  @Column({ type: 'enum', enum: Gender })
  gender: Gender;

  @ApiProperty({ required: false })
  @Column({ type: 'date', nullable: true })
  date_of_birth: Date;

  @ApiProperty({ type: () => User, required: false })
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent: User;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  blood_type: string;

  @ApiProperty({ type: [String], required: false })
  @Column({ type: 'simple-array', nullable: true })
  allergies: string[];

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  emergency_contact: string;

  @ApiProperty({ default: true })
  @Column({ default: true })
  is_active: boolean;

  @ApiProperty()
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updated_at: Date;
}
