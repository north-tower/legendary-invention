import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { StudentFeeAccountService } from './student-fee-account.service';
import {
  ApplyExemptionDto,
  BulkAssignFeesDto,
  GetTermAccountsDto,
} from './dto/fee-account.dto';

@ApiTags('Fee Accounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('finance/fee-accounts')
export class FeeAccountController {
  constructor(private readonly feeAccountService: StudentFeeAccountService) {}

  @Post('bulk-assign')
  @Roles(UserRole.ACCOUNTANT, UserRole.PRINCIPAL)
  @ApiOperation({ summary: 'Bulk assign term fees to all students in a form' })
  bulkAssign(@Body() dto: BulkAssignFeesDto, @CurrentUser() user: JwtPayload) {
    return this.feeAccountService.bulkAssignFees(dto.feeStructureId, user.sub);
  }

  @Post(':id/exemption')
  @Roles(UserRole.ACCOUNTANT, UserRole.PRINCIPAL)
  @ApiOperation({ summary: 'Apply bursary or fee exemption to a student account' })
  applyExemption(@Param('id') id: string, @Body() dto: ApplyExemptionDto) {
    return this.feeAccountService.applyExemption(id, dto);
  }

  @Get()
  @Roles(UserRole.ACCOUNTANT, UserRole.PRINCIPAL, UserRole.DEPUTY_PRINCIPAL)
  @ApiOperation({ summary: 'Get all fee accounts for a term, with optional filters' })
  getTermAccounts(@Query() dto: GetTermAccountsDto) {
    return this.feeAccountService.getTermAccounts(dto);
  }

  @Get('student/:studentId')
  @Roles(
    UserRole.ACCOUNTANT,
    UserRole.PRINCIPAL,
    UserRole.DEPUTY_PRINCIPAL,
    UserRole.PARENT,
  )
  @ApiOperation({ summary: 'Get full fee history for a student across all terms' })
  getStudentFeeHistory(@Param('studentId') studentId: string) {
    return this.feeAccountService.getStudentFeeHistory(studentId);
  }

  @Get('trajectory')
  @Roles(UserRole.ACCOUNTANT, UserRole.PRINCIPAL)
  @ApiOperation({ summary: 'Get deficit trajectory for a fee structure' })
  getDeficitTrajectory(@Query('feeStructureId') feeStructureId: string) {
    return this.feeAccountService.getDeficitTrajectory(feeStructureId);
  }

  @Get(':id')
  @Roles(UserRole.ACCOUNTANT, UserRole.PRINCIPAL, UserRole.DEPUTY_PRINCIPAL)
  @ApiOperation({ summary: 'Get a single fee account by ID' })
  getAccountById(@Param('id') id: string) {
    return this.feeAccountService.getAccountById(id);
  }
}
