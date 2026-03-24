import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicalCard } from './entities/medical-card.entity';
import { MedicalService } from './medical.service';
import { MedicalController } from './medical.controller';
import { Student } from '../students/entities/student.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MedicalCard, Student])],
  controllers: [MedicalController],
  providers: [MedicalService],
  exports: [MedicalService, TypeOrmModule],
})
export class MedicalModule {}
