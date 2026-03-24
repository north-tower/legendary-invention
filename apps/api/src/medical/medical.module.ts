import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicalCard } from './entities/medical-card.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MedicalCard])],
  exports: [TypeOrmModule],
})
export class MedicalModule {}
