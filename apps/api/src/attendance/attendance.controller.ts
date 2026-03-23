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
import { AttendanceService } from './attendance.service';
import { MarkAttendanceDto, BulkMarkAttendanceDto } from './dto/attendance.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { StreamZoneGuard } from '../common/guards/stream-zone.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole, Form, Stream } from '../users/enums/user-role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('attendance')
@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard, StreamZoneGuard)
@ApiBearerAuth()
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post()
  @Roles(UserRole.CLASS_TEACHER, UserRole.DEPUTY_PRINCIPAL)
  @ApiOperation({ summary: 'Mark attendance for a student' })
  markAttendance(@Body() dto: MarkAttendanceDto, @CurrentUser() user: User) {
    return this.attendanceService.markAttendance(dto, user);
  }

  @Post('bulk')
  @Roles(UserRole.CLASS_TEACHER)
  @ApiOperation({ summary: 'Bulk mark attendance for a class' })
  bulkMarkAttendance(@Body() dto: BulkMarkAttendanceDto, @CurrentUser() user: User) {
    return this.attendanceService.bulkMarkAttendance(dto, user);
  }

  @Get('class')
  @Roles(UserRole.CLASS_TEACHER, UserRole.HOD, UserRole.DEPUTY_PRINCIPAL, UserRole.PRINCIPAL)
  @ApiOperation({ summary: 'Get attendance by class' })
  @ApiQuery({ name: 'form', enum: Form })
  @ApiQuery({ name: 'stream', enum: Stream })
  @ApiQuery({ name: 'date', example: '2026-03-23' })
  getByClass(
    @Query('form') form: Form,
    @Query('stream') stream: Stream,
    @Query('date') date: string,
  ) {
    return this.attendanceService.getByClass(form, stream, date);
  }

  @Get('student/:id')
  @Roles(UserRole.CLASS_TEACHER, UserRole.HOD, UserRole.DEPUTY_PRINCIPAL, UserRole.PRINCIPAL)
  @ApiOperation({ summary: 'Get attendance for a student' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  getByStudent(
    @Param('id') studentId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.attendanceService.getByStudent(studentId, from, to);
  }

  @Get('summary')
  @Roles(UserRole.HOD, UserRole.DEPUTY_PRINCIPAL, UserRole.PRINCIPAL)
  @ApiOperation({ summary: 'Get attendance summary for a class' })
  @ApiQuery({ name: 'form', enum: Form })
  @ApiQuery({ name: 'stream', enum: Stream })
  @ApiQuery({ name: 'from', example: '2026-03-01' })
  @ApiQuery({ name: 'to', example: '2026-03-31' })
  getSummary(
    @Query('form') form: Form,
    @Query('stream') stream: Stream,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.attendanceService.getSummary(form, stream, from, to);
  }

  @Get('gender')
  @Roles(UserRole.HOD, UserRole.DEPUTY_PRINCIPAL, UserRole.PRINCIPAL)
  @ApiOperation({ summary: 'Get gender-based attendance breakdown for a class' })
  @ApiQuery({ name: 'form', enum: Form })
  @ApiQuery({ name: 'stream', enum: Stream })
  @ApiQuery({ name: 'from', example: '2026-03-01' })
  @ApiQuery({ name: 'to', example: '2026-03-31' })
  getGenderBreakdown(
    @Query('form') form: Form,
    @Query('stream') stream: Stream,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.attendanceService.getGenderBreakdown(form, stream, from, to);
  }
}
