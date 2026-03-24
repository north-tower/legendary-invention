import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MpesaService } from './mpesa.service';
import { MpesaController } from './mpesa.controller';
import { MpesaTransaction } from './entities/mpesa-transaction.entity';
import { Student } from '../students/entities/student.entity';
import { FinanceModule } from '../finance/finance.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MpesaTransaction, Student]),
    FinanceModule,
  ],
  controllers: [MpesaController],
  providers: [MpesaService],
  exports: [MpesaService],
})
export class MpesaModule {}
