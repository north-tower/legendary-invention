import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MpesaService } from './mpesa.service';
import { MpesaController } from './mpesa.controller';
import { MpesaTransaction } from './entities/mpesa-transaction.entity';
import { Student } from '../students/entities/student.entity';
import { FinanceModule } from '../finance/finance.module';
import { FeePayment } from '../finance/entities/fee-payment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([MpesaTransaction, Student, FeePayment]),
    FinanceModule,
  ],
  controllers: [MpesaController],
  providers: [MpesaService],
  exports: [MpesaService],
})
export class MpesaModule {}
