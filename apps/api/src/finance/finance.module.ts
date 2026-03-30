import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';
import { FeeAccountController } from './fee-account.controller';
import { FeeStructure } from './entities/fee-structure.entity';
import { FeePayment } from './entities/fee-payment.entity';
import { StudentFeeAccount } from './entities/student-fee-account.entity';
import { Student } from '../students/entities/student.entity';
import { StudentFeeAccountService } from './student-fee-account.service';

@Module({
  imports: [TypeOrmModule.forFeature([FeeStructure, FeePayment, StudentFeeAccount, Student])],
  controllers: [FinanceController, FeeAccountController],
  providers: [FinanceService, StudentFeeAccountService],
  exports: [FinanceService, StudentFeeAccountService],
})
export class FinanceModule {}
