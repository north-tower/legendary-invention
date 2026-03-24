import { Controller, Get, Patch, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MedicalService } from './medical.service';
import { UpdateMedicalCardDto } from './dto/medical.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';

@ApiTags('medical')
@ApiBearerAuth()
@Controller('medical')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MedicalController {
  constructor(private readonly medicalService: MedicalService) {}

  @Get(':studentId')
  @ApiOperation({ summary: 'Get medical card for a student' })
  async findOne(@Param('studentId') studentId: string) {
    return this.medicalService.findByStudentId(studentId);
  }

  @Patch(':studentId')
  @Roles(UserRole.NURSE, UserRole.PRINCIPAL, UserRole.DEPUTY_PRINCIPAL)
  @ApiOperation({ summary: 'Update medical card for a student' })
  async update(
    @Param('studentId') studentId: string,
    @Body() dto: UpdateMedicalCardDto,
    @Request() req: any,
  ) {
    return this.medicalService.updateByStudentId(studentId, dto, req.user);
  }
}
