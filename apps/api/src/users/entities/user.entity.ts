import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserRole, Form, Stream, Gender } from '../enums/user-role.enum';
import { ApiProperty } from '@nestjs/swagger';

@Entity('users')
export class User {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ uniqueItems: true })
  @Column({ unique: true })
  email: string;

  @ApiProperty()
  @Column()
  full_name: string;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  phone: string;

  @ApiProperty({ enum: UserRole })
  @Column({ type: 'enum', enum: UserRole })
  role: UserRole;

  @ApiProperty({ enum: Gender, required: false })
  @Column({ type: 'enum', enum: Gender, nullable: true })
  gender: Gender;

  @Column({ select: false })
  password_hash: string;

  @ApiProperty({ default: true })
  @Column({ default: true })
  is_active: boolean;

  @ApiProperty({ enum: Form, required: false })
  @Column({ type: 'enum', enum: Form, nullable: true })
  assigned_form: Form;

  @ApiProperty({ enum: Stream, required: false })
  @Column({ type: 'enum', enum: Stream, nullable: true })
  assigned_stream: Stream;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  department: string;

  @ApiProperty()
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updated_at: Date;
}
