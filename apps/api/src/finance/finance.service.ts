import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeeStructure } from './entities/fee-structure.entity';
import { FeePayment } from './entities/fee-payment.entity';
import { FeeBalance } from './entities/fee-balance.entity';
import { CreateFeeStructureDto, RecordPaymentDto } from './dto/finance.dto';
import { Student } from '../students/entities/student.entity';
import { User } from '../users/entities/user.entity';
import { Form, Stream } from '../users/enums/user-role.enum';
import { Term, PaymentStatus } from './enums/finance.enum';

export interface DeficitTrajectory {
  form: Form;
  term: Term;
  year: string;
  total_billed: number;
  total_collected: number;
  collection_rate: number;
  daily_velocity: number;
  days_elapsed: number;
  days_remaining: number;
  projected_collection: number;
  projected_deficit: number;
  risk_level: 'low' | 'medium' | 'high';
}

@Injectable()
export class FinanceService {
  constructor(
    @InjectRepository(FeeStructure)
    private readonly feeStructureRepository: Repository<FeeStructure>,
    @InjectRepository(FeePayment)
    private readonly feePaymentRepository: Repository<FeePayment>,
    @InjectRepository(FeeBalance)
    private readonly feeBalanceRepository: Repository<FeeBalance>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
  ) {}

  async createFeeStructure(dto: CreateFeeStructureDto, creator: User): Promise<FeeStructure> {
    try {
      const existing = await this.feeStructureRepository.findOne({
        where: { form: dto.form, academic_year: dto.academic_year, term: dto.term },
      });
      if (existing) throw new ConflictException('Fee structure already exists for this term');

      const structure = this.feeStructureRepository.create({
        ...dto,
        created_by: creator,
      });
      const saved = await this.feeStructureRepository.save(structure);

      // Initialize balances for all students in this form
      const students = await this.studentRepository.find({ where: { form: dto.form } });
      for (const student of students) {
        let balance = await this.feeBalanceRepository.findOne({ where: { student: { id: student.id } } });
        if (!balance) {
          balance = this.feeBalanceRepository.create({
            student,
            fee_structure: saved,
            total_billed: saved.total_amount,
            total_paid: 0,
            balance: saved.total_amount,
          });
        } else {
          balance.fee_structure = saved;
          balance.total_billed = Number(balance.total_billed) + Number(saved.total_amount);
          balance.balance = Number(balance.total_billed) - Number(balance.total_paid);
        }
        await this.feeBalanceRepository.save(balance);
      }

      return saved;
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      throw new InternalServerErrorException('Error creating fee structure');
    }
  }

  async getFeeStructures(form?: Form, term?: Term, year?: string): Promise<FeeStructure[]> {
    try {
      const where: any = {};
      if (form) where.form = form;
      if (term) where.term = term;
      if (year) where.academic_year = year;
      return await this.feeStructureRepository.find({ where, order: { created_at: 'DESC' } });
    } catch (error) {
      throw new InternalServerErrorException('Error fetching fee structures');
    }
  }

  async recordManualPayment(dto: RecordPaymentDto, recorder: User): Promise<FeePayment> {
    try {
      const student = await this.studentRepository.findOneBy({ id: dto.studentId });
      if (!student) throw new NotFoundException('Student not found');

      const feeStructure = await this.feeStructureRepository.findOneBy({ id: dto.feeStructureId });
      if (!feeStructure) throw new NotFoundException('Fee structure not found');

      const payment = this.feePaymentRepository.create({
        ...dto,
        student,
        fee_structure: feeStructure,
        recorded_by: recorder,
        status: PaymentStatus.COMPLETED,
      });

      const savedPayment = await this.feePaymentRepository.save(payment);
      await this.updateBalance(student.id, feeStructure.id);
      return savedPayment;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Error recording payment');
    }
  }

  async getPaymentsByStudent(studentId: string): Promise<FeePayment[]> {
    try {
      return await this.feePaymentRepository.find({
        where: { student: { id: studentId } },
        order: { transaction_date: 'DESC' },
        relations: ['fee_structure', 'recorded_by'],
      });
    } catch (error) {
      throw new InternalServerErrorException('Error fetching payments');
    }
  }

  async getBalanceByStudent(studentId: string): Promise<FeeBalance> {
    try {
      const balance = await this.feeBalanceRepository.findOne({
        where: { student: { id: studentId } },
        relations: ['fee_structure'],
      });
      if (!balance) throw new NotFoundException('Balance not found for student');
      return balance;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Error fetching balance');
    }
  }

  async getClassBalances(form: Form, stream: Stream): Promise<FeeBalance[]> {
    try {
      return await this.feeBalanceRepository.createQueryBuilder('fb')
        .leftJoinAndSelect('fb.student', 'student')
        .where('student.form = :form', { form })
        .andWhere('student.stream = :stream', { stream })
        .andWhere('fb.balance > 0')
        .orderBy('fb.balance', 'DESC')
        .getMany();
    } catch (error) {
      throw new InternalServerErrorException('Error fetching class balances');
    }
  }

  async updateBalance(studentId: string, feeStructureId: string): Promise<FeeBalance> {
    try {
      const balance = await this.feeBalanceRepository.findOne({
        where: { student: { id: studentId } },
      });
      if (!balance) throw new NotFoundException('Balance record not found');

      const payments = await this.feePaymentRepository.find({
        where: { student: { id: studentId }, status: PaymentStatus.COMPLETED },
      });

      const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
      balance.total_paid = totalPaid;
      balance.balance = Number(balance.total_billed) - totalPaid;
      
      if (payments.length > 0) {
        balance.last_payment_at = payments[0].transaction_date; // Assuming ordered or just taking latest
      }

      return await this.feeBalanceRepository.save(balance);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Error updating balance');
    }
  }

  async getTermDeficitTrajectory(form: Form, term: Term, year: string): Promise<DeficitTrajectory> {
    try {
      const structure = await this.feeStructureRepository.findOne({
        where: { form, term, academic_year: year },
      });
      if (!structure) throw new NotFoundException('Fee structure not found');

      const balances = await this.feeBalanceRepository.createQueryBuilder('fb')
        .leftJoin('fb.student', 'student')
        .where('student.form = :form', { form })
        .getMany();

      const total_billed = balances.reduce((sum, b) => sum + Number(b.total_billed), 0);
      const total_collected = balances.reduce((sum, b) => sum + Number(b.total_paid), 0);
      
      // Simplified trajectory logic
      const days_elapsed = 30; // Mock value, should be calculated from term start date
      const days_remaining = 60; // Mock value
      const daily_velocity = days_elapsed > 0 ? total_collected / days_elapsed : 0;
      const projected_collection = total_collected + (daily_velocity * days_remaining);
      const projected_deficit = total_billed - projected_collection;
      const collection_rate = total_billed > 0 ? (total_collected / total_billed) * 100 : 0;
      
      const deficit_percentage = total_billed > 0 ? (projected_deficit / total_billed) * 100 : 0;
      let risk_level: 'low' | 'medium' | 'high' = 'low';
      if (deficit_percentage > 30) risk_level = 'high';
      else if (deficit_percentage >= 10) risk_level = 'medium';

      return {
        form,
        term,
        year,
        total_billed,
        total_collected,
        collection_rate,
        daily_velocity,
        days_elapsed,
        days_remaining,
        projected_collection,
        projected_deficit,
        risk_level,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Error calculating trajectory');
    }
  }
}
