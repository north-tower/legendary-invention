import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { DisciplineIncident } from './entities/discipline-incident.entity';
import { DisciplineScore } from './entities/discipline-score.entity';
import { IncidentType, Severity, IncidentStatus } from './enums/discipline.enum';
import { ReportIncidentDto, UpdateIncidentDto } from './dto/discipline.dto';
import { Student } from '../students/entities/student.entity';
import { User } from '../users/entities/user.entity';
import { Form, Stream, Gender } from '../users/enums/user-role.enum';

export interface GenderDisciplineSummary {
  male: {
    incident_count: number;
    average_score: number;
  };
  female: {
    incident_count: number;
    average_score: number;
  };
}

@Injectable()
export class DisciplineService {
  constructor(
    @InjectRepository(DisciplineIncident)
    private readonly incidentRepository: Repository<DisciplineIncident>,
    @InjectRepository(DisciplineScore)
    private readonly scoreRepository: Repository<DisciplineScore>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
  ) {}

  private calculateDeduction(severity: Severity): number {
    switch (severity) {
      case Severity.CRITICAL: return -20;
      case Severity.HIGH: return -10;
      case Severity.MEDIUM: return -5;
      case Severity.LOW: return -2;
      default: return 0;
    }
  }

  async reportIncident(dto: ReportIncidentDto, reporter: User): Promise<DisciplineIncident> {
    try {
      const student = await this.studentRepository.findOneBy({ id: dto.studentId });
      if (!student) throw new NotFoundException('Student not found');

      const incident = this.incidentRepository.create({
        ...dto,
        student,
        reported_by: reporter,
        status: IncidentStatus.OPEN,
      });

      const savedIncident = await this.incidentRepository.save(incident);

      // Update DisciplineScore
      let score = await this.scoreRepository.findOne({ where: { student: { id: dto.studentId } } });
      if (!score) {
        score = this.scoreRepository.create({ student, score: 100, total_incidents: 0 });
      }

      score.score += this.calculateDeduction(dto.severity);
      score.total_incidents += 1;
      score.last_incident_at = new Date();
      await this.scoreRepository.save(score);

      return savedIncident;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Error reporting incident');
    }
  }

  async updateIncident(id: string, dto: UpdateIncidentDto, reviewer: User): Promise<DisciplineIncident> {
    try {
      const incident = await this.incidentRepository.findOne({
        where: { id },
        relations: ['student'],
      });
      if (!incident) throw new NotFoundException('Incident not found');

      const oldStatus = incident.status;
      const oldSeverity = incident.severity;

      if (dto.severity && dto.severity !== oldSeverity) {
        // Adjust score if severity changed
        const score = await this.scoreRepository.findOne({ where: { student: { id: incident.student.id } } });
        if (score) {
          score.score -= this.calculateDeduction(oldSeverity); // reverse old
          score.score += this.calculateDeduction(dto.severity); // apply new
          await this.scoreRepository.save(score);
        }
        incident.severity = dto.severity;
      }

      if (dto.status === IncidentStatus.RESOLVED && oldStatus !== IncidentStatus.RESOLVED && dto.action_taken) {
        // Bonus point for resolved with action
        const score = await this.scoreRepository.findOne({ where: { student: { id: incident.student.id } } });
        if (score && score.score < 100) {
          score.score = Math.min(100, score.score + 1);
          await this.scoreRepository.save(score);
        }
        incident.resolved_at = new Date();
      }

      Object.assign(incident, dto);
      incident.reviewed_by = reviewer;
      return await this.incidentRepository.save(incident);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Error updating incident');
    }
  }

  async getIncidentsByStudent(studentId: string): Promise<DisciplineIncident[]> {
    try {
      return await this.incidentRepository.find({
        where: { student: { id: studentId } },
        order: { incident_date: 'DESC' },
        relations: ['reported_by', 'reviewed_by'],
      });
    } catch (error) {
      throw new InternalServerErrorException('Error fetching student incidents');
    }
  }

  async getIncidentsByClass(form: Form, stream: Stream, filters?: { status?: IncidentStatus; severity?: Severity; from?: string; to?: string }): Promise<DisciplineIncident[]> {
    try {
      const query = this.incidentRepository.createQueryBuilder('incident')
        .leftJoinAndSelect('incident.student', 'student')
        .leftJoinAndSelect('incident.reported_by', 'reported_by')
        .where('student.form = :form', { form })
        .andWhere('student.stream = :stream', { stream });

      if (filters?.status) query.andWhere('incident.status = :status', { status: filters.status });
      if (filters?.severity) query.andWhere('incident.severity = :severity', { severity: filters.severity });
      if (filters?.from && filters?.to) {
        query.andWhere('incident.incident_date BETWEEN :from AND :to', { from: filters.from, to: filters.to });
      }

      return await query.getMany();
    } catch (error) {
      throw new InternalServerErrorException('Error fetching class incidents');
    }
  }

  async getAllOpenIncidents(): Promise<DisciplineIncident[]> {
    try {
      return await this.incidentRepository.find({
        where: { status: IncidentStatus.OPEN },
        relations: ['student', 'reported_by'],
      });
    } catch (error) {
      throw new InternalServerErrorException('Error fetching open incidents');
    }
  }

  async getScoreByStudent(studentId: string): Promise<DisciplineScore> {
    try {
      const score = await this.scoreRepository.findOne({
        where: { student: { id: studentId } },
        relations: ['student'],
      });
      if (!score) throw new NotFoundException('Discipline score not found for this student');
      return score;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Error fetching student score');
    }
  }

  async getClassScoreBoard(form: Form, stream: Stream): Promise<DisciplineScore[]> {
    try {
      return await this.scoreRepository.createQueryBuilder('ds')
        .leftJoinAndSelect('ds.student', 'student')
        .where('student.form = :form', { form })
        .andWhere('student.stream = :stream', { stream })
        .orderBy('ds.score', 'ASC')
        .getMany();
    } catch (error) {
      throw new InternalServerErrorException('Error fetching class scoreboard');
    }
  }

  async getGenderBreakdown(form?: Form, stream?: Stream): Promise<GenderDisciplineSummary> {
    try {
      const query = this.scoreRepository.createQueryBuilder('ds')
        .leftJoinAndSelect('ds.student', 'student');

      if (form) query.andWhere('student.form = :form', { form });
      if (stream) query.andWhere('student.stream = :stream', { stream });

      const scores = await query.getMany();
      const maleScores = scores.filter(s => s.student.gender === Gender.MALE);
      const femaleScores = scores.filter(s => s.student.gender === Gender.FEMALE);

      return {
        male: {
          incident_count: maleScores.reduce((acc, curr) => acc + curr.total_incidents, 0),
          average_score: maleScores.length > 0 ? maleScores.reduce((acc, curr) => acc + curr.score, 0) / maleScores.length : 100,
        },
        female: {
          incident_count: femaleScores.reduce((acc, curr) => acc + curr.total_incidents, 0),
          average_score: femaleScores.length > 0 ? femaleScores.reduce((acc, curr) => acc + curr.score, 0) / femaleScores.length : 100,
        },
      };
    } catch (error) {
      throw new InternalServerErrorException('Error fetching gender breakdown');
    }
  }
}
