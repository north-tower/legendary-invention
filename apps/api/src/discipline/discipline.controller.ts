import {
  Controller,
  Post,
  Patch,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DisciplineService } from './discipline.service';
import { ReportIncidentDto, UpdateIncidentDto } from './dto/discipline.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { StreamZoneGuard } from '../common/guards/stream-zone.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole, Form, Stream } from '../users/enums/user-role.enum';
import { IncidentStatus, Severity } from './enums/discipline.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('discipline')
@Controller('discipline')
@UseGuards(JwtAuthGuard, RolesGuard, StreamZoneGuard)
@ApiBearerAuth()
export class DisciplineController {
  constructor(private readonly disciplineService: DisciplineService) {}

  @Post()
  @Roles(UserRole.CLASS_TEACHER, UserRole.DEPUTY_PRINCIPAL)
  @ApiOperation({ summary: 'Report a discipline incident' })
  reportIncident(@Body() dto: ReportIncidentDto, @CurrentUser() user: User) {
    return this.disciplineService.reportIncident(dto, user);
  }

  @Patch(':id')
  @Roles(UserRole.DEPUTY_PRINCIPAL, UserRole.PRINCIPAL)
  @ApiOperation({ summary: 'Update/Review a discipline incident' })
  updateIncident(
    @Param('id') id: string,
    @Body() dto: UpdateIncidentDto,
    @CurrentUser() user: User,
  ) {
    return this.disciplineService.updateIncident(id, dto, user);
  }

  @Get('student/:id')
  @Roles(UserRole.CLASS_TEACHER, UserRole.HOD, UserRole.DEPUTY_PRINCIPAL, UserRole.PRINCIPAL)
  @ApiOperation({ summary: 'Get all incidents for a student' })
  getIncidentsByStudent(@Param('id') studentId: string) {
    return this.disciplineService.getIncidentsByStudent(studentId);
  }

  @Get('class')
  @Roles(UserRole.CLASS_TEACHER, UserRole.HOD, UserRole.DEPUTY_PRINCIPAL, UserRole.PRINCIPAL)
  @ApiOperation({ summary: 'Get incidents by class' })
  @ApiQuery({ name: 'form', enum: Form })
  @ApiQuery({ name: 'stream', enum: Stream })
  @ApiQuery({ name: 'status', enum: IncidentStatus, required: false })
  @ApiQuery({ name: 'severity', enum: Severity, required: false })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  getIncidentsByClass(
    @Query('form') form: Form,
    @Query('stream') stream: Stream,
    @Query('status') status?: any,
    @Query('severity') severity?: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.disciplineService.getIncidentsByClass(form, stream, { status, severity, from, to });
  }

  @Get('open')
  @Roles(UserRole.DEPUTY_PRINCIPAL, UserRole.PRINCIPAL)
  @ApiOperation({ summary: 'Get all open incidents' })
  getAllOpenIncidents() {
    return this.disciplineService.getAllOpenIncidents();
  }

  @Get('score/:studentId')
  @Roles(UserRole.CLASS_TEACHER, UserRole.HOD, UserRole.DEPUTY_PRINCIPAL, UserRole.PRINCIPAL)
  @ApiOperation({ summary: 'Get discipline score for a student' })
  getScoreByStudent(@Param('studentId') studentId: string) {
    return this.disciplineService.getScoreByStudent(studentId);
  }

  @Get('scoreboard')
  @Roles(UserRole.HOD, UserRole.DEPUTY_PRINCIPAL, UserRole.PRINCIPAL)
  @ApiOperation({ summary: 'Get scoreboard for a class' })
  @ApiQuery({ name: 'form', enum: Form })
  @ApiQuery({ name: 'stream', enum: Stream })
  getClassScoreBoard(
    @Query('form') form: Form,
    @Query('stream') stream: Stream,
  ) {
    return this.disciplineService.getClassScoreBoard(form, stream);
  }

  @Get('gender')
  @Roles(UserRole.HOD, UserRole.DEPUTY_PRINCIPAL, UserRole.PRINCIPAL)
  @ApiOperation({ summary: 'Get gender-based discipline summary' })
  @ApiQuery({ name: 'form', enum: Form, required: false })
  @ApiQuery({ name: 'stream', enum: Stream, required: false })
  getGenderBreakdown(
    @Query('form') form?: Form,
    @Query('stream') stream?: Stream,
  ) {
    return this.disciplineService.getGenderBreakdown(form, stream);
  }
}
