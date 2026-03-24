import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CommsService } from './comms.service';
import { SendMessageDto } from './dto/comms.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { TriageLabel } from './enums/comms.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('comms')
@Controller('comms')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CommsController {
  constructor(private readonly commsService: CommsService) {}

  @Post('send')
  @Roles(UserRole.PARENT)
  @ApiOperation({ summary: 'Send a message to the school' })
  sendMessage(@Body() dto: SendMessageDto, @CurrentUser() user: User) {
    return this.commsService.sendMessage(dto, user);
  }

  @Get('inbox')
  @Roles(UserRole.PRINCIPAL, UserRole.DEPUTY_PRINCIPAL, UserRole.HOD, UserRole.ACCOUNTANT, UserRole.PARENT)
  @ApiOperation({ summary: 'Get school inbox' })
  @ApiQuery({ name: 'label', enum: TriageLabel, required: false })
  getInbox(@CurrentUser() user: User, @Query('label') label?: TriageLabel) {
    return this.commsService.getInbox(user, label);
  }

  @Patch(':id/read')
  @Roles(UserRole.PRINCIPAL, UserRole.DEPUTY_PRINCIPAL, UserRole.HOD, UserRole.ACCOUNTANT)
  @ApiOperation({ summary: 'Mark message as read' })
  markAsRead(@Param('id') id: string) {
    return this.commsService.markAsRead(id);
  }

  @Get(':id')
  @Roles(UserRole.PRINCIPAL, UserRole.DEPUTY_PRINCIPAL, UserRole.HOD, UserRole.ACCOUNTANT, UserRole.PARENT)
  @ApiOperation({ summary: 'Get message by ID' })
  findOne(@Param('id') id: string) {
    return this.commsService.findOne(id);
  }
}
