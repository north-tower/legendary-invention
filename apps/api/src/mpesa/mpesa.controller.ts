import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MpesaService } from './mpesa.service';
import { InitiateSTKPushDto } from './dto/mpesa.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';

@ApiTags('mpesa')
@Controller('mpesa')
export class MpesaController {
  constructor(private readonly mpesaService: MpesaService) {}

  @Post('stkpush')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PARENT, UserRole.ACCOUNTANT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initiate M-Pesa STK Push' })
  initiateSTKPush(@Body() dto: InitiateSTKPushDto) {
    return this.mpesaService.initiateSTKPush(dto);
  }

  @Post('callback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'M-Pesa Daraja Callback URL' })
  async handleCallback(@Body() callbackData: any) {
    await this.mpesaService.handleCallback(callbackData);
    return { ResultCode: 0, ResultDesc: 'Success' };
  }
}
