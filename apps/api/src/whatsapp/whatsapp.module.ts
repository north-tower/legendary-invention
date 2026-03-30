import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WhatsAppSession } from './entities/whatsapp-session.entity';
import { UsersModule } from '../users/users.module';
import { StudentsModule } from '../students/students.module';
import { FinanceModule } from '../finance/finance.module';
import { AttendanceModule } from '../attendance/attendance.module';
import { DisciplineModule } from '../discipline/discipline.module';
import { CommsModule } from '../comms/comms.module';
import { MpesaModule } from '../mpesa/mpesa.module';
import { WhatsAppController } from './whatsapp.controller';
import { WhatsAppBotService } from './whatsapp-bot.service';
import { TwilioService } from './twilio.service';
import { ConversationStateService } from './conversation-state.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([WhatsAppSession]),
    UsersModule,
    StudentsModule,
    FinanceModule,
    AttendanceModule,
    DisciplineModule,
    CommsModule,
    MpesaModule,
  ],
  providers: [WhatsAppBotService, TwilioService, ConversationStateService],
  controllers: [WhatsAppController],
})
export class WhatsAppModule {}
