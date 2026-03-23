import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DisciplineService } from './discipline.service';
import { DisciplineController } from './discipline.controller';
import { DisciplineIncident } from './entities/discipline-incident.entity';
import { DisciplineScore } from './entities/discipline-score.entity';
import { Student } from '../students/entities/student.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DisciplineIncident, DisciplineScore, Student])],
  controllers: [DisciplineController],
  providers: [DisciplineService],
  exports: [DisciplineService],
})
export class DisciplineModule {}
