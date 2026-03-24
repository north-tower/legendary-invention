import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';
import { FeeStructure } from './entities/fee-structure.entity';
import { FeePayment } from './entities/fee-payment.entity';
import { FeeBalance } from './entities/fee-balance.entity';
import { Student } from '../students/entities/student.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FeeStructure, FeePayment, FeeBalance, Student])],
  controllers: [FinanceController],
  providers: [FinanceService],
  exports: [FinanceService],
})
export class FinanceModule {}
