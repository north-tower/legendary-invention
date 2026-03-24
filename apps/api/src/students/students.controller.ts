import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { Form, Stream, UserRole } from '../users/enums/user-role.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('students')
@Controller('students')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  @Roles(UserRole.PRINCIPAL, UserRole.DEPUTY_PRINCIPAL, UserRole.HOD)
  @ApiOperation({ summary: 'Create a new student' })
  create(@Body() createStudentDto: CreateStudentDto) {
    return this.studentsService.create(createStudentDto);
  }

  @Post('link-parent')
  @Roles(UserRole.PARENT)
  @ApiOperation({ summary: 'Link parent account to student via admission number' })
  linkParent(@Body('admission_number') admissionNumber: string, @Request() req: any) {
    return this.studentsService.linkParent(admissionNumber, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get students' })
  @ApiQuery({ name: 'form', enum: Form, required: false })
  @ApiQuery({ name: 'stream', enum: Stream, required: false })
  findAll(
    @Request() req: any,
    @Query('form') form?: Form,
    @Query('stream') stream?: Stream,
  ) {
    // If user is a parent, only show their children
    const parentId = req.user.role === UserRole.PARENT ? req.user.id : undefined;
    return this.studentsService.findAll(form, stream, parentId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get student by ID' })
  findOne(@Param('id') id: string) {
    return this.studentsService.findById(id);
  }

  @Get('admission/:admission_number')
  @ApiOperation({ summary: 'Get student by admission number' })
  findByAdmission(@Param('admission_number') admissionNumber: string) {
    return this.studentsService.findByAdmission(admissionNumber);
  }

  @Patch(':id')
  @Roles(UserRole.PRINCIPAL, UserRole.DEPUTY_PRINCIPAL, UserRole.HOD)
  @ApiOperation({ summary: 'Update student' })
  update(@Param('id') id: string, @Body() updateStudentDto: Partial<CreateStudentDto>) {
    return this.studentsService.update(id, updateStudentDto);
  }

  @Delete(':id')
  @Roles(UserRole.PRINCIPAL)
  @ApiOperation({ summary: 'Delete student' })
  remove(@Param('id') id: string) {
    return this.studentsService.remove(id);
  }
}
