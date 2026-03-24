import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { FinanceService } from './finance.service';
import { CreateFeeStructureDto, RecordPaymentDto } from './dto/finance.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole, Form, Stream } from '../users/enums/user-role.enum';
import { Term } from './enums/finance.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('finance')
@Controller('finance')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Post('fee-structures')
  @Roles(UserRole.PRINCIPAL, UserRole.ACCOUNTANT)
  @ApiOperation({ summary: 'Create a new fee structure' })
  createFeeStructure(@Body() dto: CreateFeeStructureDto, @CurrentUser() user: User) {
    return this.financeService.createFeeStructure(dto, user);
  }

  @Get('fee-structures')
  @Roles(UserRole.PRINCIPAL, UserRole.ACCOUNTANT, UserRole.HOD, UserRole.DEPUTY_PRINCIPAL)
  @ApiOperation({ summary: 'Get fee structures' })
  @ApiQuery({ name: 'form', enum: Form, required: false })
  @ApiQuery({ name: 'term', enum: Term, required: false })
  @ApiQuery({ name: 'year', required: false })
  getFeeStructures(
    @Query('form') form?: Form,
    @Query('term') term?: Term,
    @Query('year') year?: string,
  ) {
    return this.financeService.getFeeStructures(form, term, year);
  }

  @Post('payments')
  @Roles(UserRole.ACCOUNTANT)
  @ApiOperation({ summary: 'Record a manual payment' })
  recordManualPayment(@Body() dto: RecordPaymentDto, @CurrentUser() user: User) {
    return this.financeService.recordManualPayment(dto, user);
  }

  @Get('payments/student/:id')
  @Roles(UserRole.ACCOUNTANT, UserRole.PRINCIPAL, UserRole.DEPUTY_PRINCIPAL)
  @ApiOperation({ summary: 'Get payments by student' })
  getPaymentsByStudent(@Param('id') studentId: string) {
    return this.financeService.getPaymentsByStudent(studentId);
  }

  @Get('balance/student/:id')
  @Roles(UserRole.ACCOUNTANT, UserRole.PRINCIPAL, UserRole.DEPUTY_PRINCIPAL)
  @ApiOperation({ summary: 'Get balance by student' })
  getBalanceByStudent(@Param('id') studentId: string) {
    return this.financeService.getBalanceByStudent(studentId);
  }

  @Get('balance/class')
  @Roles(UserRole.ACCOUNTANT, UserRole.PRINCIPAL)
  @ApiOperation({ summary: 'Get class balances' })
  @ApiQuery({ name: 'form', enum: Form })
  @ApiQuery({ name: 'stream', enum: Stream })
  getClassBalances(
    @Query('form') form: Form,
    @Query('stream') stream: Stream,
  ) {
    return this.financeService.getClassBalances(form, stream);
  }

  @Get('trajectory')
  @Roles(UserRole.ACCOUNTANT, UserRole.PRINCIPAL)
  @ApiOperation({ summary: 'Get term deficit trajectory' })
  @ApiQuery({ name: 'form', enum: Form })
  @ApiQuery({ name: 'term', enum: Term })
  @ApiQuery({ name: 'year' })
  getTermDeficitTrajectory(
    @Query('form') form: Form,
    @Query('term') term: Term,
    @Query('year') year: string,
  ) {
    return this.financeService.getTermDeficitTrajectory(form, term, year);
  }
}
