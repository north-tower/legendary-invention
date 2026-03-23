import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Attendance } from './entities/attendance.entity';
import { AttendanceStatus } from './enums/attendance-status.enum';
import { MarkAttendanceDto, BulkMarkAttendanceDto } from './dto/attendance.dto';
import { Student } from '../students/entities/student.entity';
import { User } from '../users/entities/user.entity';
import { Form, Stream, Gender } from '../users/enums/user-role.enum';

export interface AttendanceSummary {
  student: {
    id: string;
    full_name: string;
    admission_number: string;
    gender: Gender;
  };
  present: number;
  absent: number;
  late: number;
  excused: number;
  total_days: number;
  attendance_rate: number;
}

export interface GenderAttendanceSummary {
  male: GenderBreakdown;
  female: GenderBreakdown;
}

interface GenderBreakdown {
  present: number;
  absent: number;
  late: number;
  excused: number;
  total: number;
  rate: number;
}

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
  ) {}

  async markAttendance(dto: MarkAttendanceDto, recorder: User): Promise<Attendance> {
    try {
      const student = await this.studentRepository.findOneBy({ id: dto.studentId });
      if (!student) throw new NotFoundException('Student not found');

      // Check if attendance already exists for this student and date
      let attendance = await this.attendanceRepository.findOne({
        where: { student: { id: dto.studentId }, date: dto.date },
      });

      if (attendance) {
        attendance.status = dto.status;
        attendance.remarks = dto.remarks || attendance.remarks;
        attendance.recorded_by = recorder;
      } else {
        attendance = this.attendanceRepository.create({
          student,
          date: dto.date,
          status: dto.status,
          remarks: dto.remarks,
          recorded_by: recorder,
        });
      }

      return await this.attendanceRepository.save(attendance);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Error marking attendance');
    }
  }

  async bulkMarkAttendance(dto: BulkMarkAttendanceDto, recorder: User): Promise<Attendance[]> {
    try {
      const results: Attendance[] = [];
      for (const entry of dto.entries) {
        const result = await this.markAttendance(
          {
            studentId: entry.studentId,
            date: dto.date,
            status: entry.status,
            remarks: entry.remarks,
          },
          recorder,
        );
        results.push(result);
      }
      return results;
    } catch (error) {
      throw new InternalServerErrorException('Error bulk marking attendance');
    }
  }

  async getByClass(form: Form, stream: Stream, date: string): Promise<Attendance[]> {
    try {
      return await this.attendanceRepository.find({
        where: {
          date,
          student: { form, stream },
        },
        relations: ['student'],
      });
    } catch (error) {
      throw new InternalServerErrorException('Error fetching class attendance');
    }
  }

  async getByStudent(studentId: string, from?: string, to?: string): Promise<Attendance[]> {
    try {
      const where: any = { student: { id: studentId } };
      if (from && to) {
        where.date = Between(from, to);
      }
      return await this.attendanceRepository.find({
        where,
        order: { date: 'DESC' },
      });
    } catch (error) {
      throw new InternalServerErrorException('Error fetching student attendance');
    }
  }

  async getSummary(form: Form, stream: Stream, from: string, to: string): Promise<AttendanceSummary[]> {
    try {
      const students = await this.studentRepository.find({ where: { form, stream } });
      const summary: AttendanceSummary[] = [];

      for (const student of students) {
        const records = await this.attendanceRepository.find({
          where: { student: { id: student.id }, date: Between(from, to) },
        });

        const counts = {
          present: records.filter((r) => r.status === AttendanceStatus.PRESENT).length,
          absent: records.filter((r) => r.status === AttendanceStatus.ABSENT).length,
          late: records.filter((r) => r.status === AttendanceStatus.LATE).length,
          excused: records.filter((r) => r.status === AttendanceStatus.EXCUSED).length,
        };

        const total_days = records.length;
        summary.push({
          student: {
            id: student.id,
            full_name: student.full_name,
            admission_number: student.admission_number,
            gender: student.gender,
          },
          ...counts,
          total_days,
          attendance_rate: total_days > 0 ? (counts.present / total_days) * 100 : 0,
        });
      }

      return summary;
    } catch (error) {
      throw new InternalServerErrorException('Error calculating attendance summary');
    }
  }

  async getGenderBreakdown(form: Form, stream: Stream, from: string, to: string): Promise<GenderAttendanceSummary> {
    try {
      const summaries = await this.getSummary(form, stream, from, to);
      const initial = { present: 0, absent: 0, late: 0, excused: 0, total: 0, rate: 0 };

      const maleData = summaries
        .filter((s) => s.student.gender === Gender.MALE)
        .reduce((acc, curr) => ({
          present: acc.present + curr.present,
          absent: acc.absent + curr.absent,
          late: acc.late + curr.late,
          excused: acc.excused + curr.excused,
          total: acc.total + curr.total_days,
          rate: 0,
        }), { ...initial });

      const femaleData = summaries
        .filter((s) => s.student.gender === Gender.FEMALE)
        .reduce((acc, curr) => ({
          present: acc.present + curr.present,
          absent: acc.absent + curr.absent,
          late: acc.late + curr.late,
          excused: acc.excused + curr.excused,
          total: acc.total + curr.total_days,
          rate: 0,
        }), { ...initial });

      maleData.rate = maleData.total > 0 ? (maleData.present / maleData.total) * 100 : 0;
      femaleData.rate = femaleData.total > 0 ? (femaleData.present / femaleData.total) * 100 : 0;

      return { male: maleData, female: femaleData };
    } catch (error) {
      throw new InternalServerErrorException('Error calculating gender breakdown');
    }
  }
}
