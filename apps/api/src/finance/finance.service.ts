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
import { CreateFeeStructureDto, RecordPaymentDto } from './dto/finance.dto';
import { Student } from '../students/entities/student.entity';
import { User } from '../users/entities/user.entity';
import { Form } from '../users/enums/user-role.enum';
import { Term, PaymentStatus } from './enums/finance.enum';
import { StudentFeeAccount } from './entities/student-fee-account.entity';
import { StudentFeeAccountService } from './student-fee-account.service';

@Injectable()
export class FinanceService {
  constructor(
    @InjectRepository(FeeStructure)
    private readonly feeStructureRepository: Repository<FeeStructure>,
    @InjectRepository(FeePayment)
    private readonly feePaymentRepository: Repository<FeePayment>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(StudentFeeAccount)
    private readonly studentFeeAccountRepository: Repository<StudentFeeAccount>,
    private readonly studentFeeAccountService: StudentFeeAccountService,
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

      const account = await this.resolveOrFailAccount(dto.studentId, dto.feeStructureId);

      const payment = this.feePaymentRepository.create({
        ...dto,
        student,
        student_fee_account: account,
        recorded_by: recorder,
        status: PaymentStatus.COMPLETED,
      });

      const savedPayment = await this.feePaymentRepository.save(payment);
      await this.studentFeeAccountService.recalculateAccount(account.id);
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
        relations: ['student_fee_account', 'recorded_by'],
      });
    } catch (error) {
      throw new InternalServerErrorException('Error fetching payments');
    }
  }

  async resolveOrFailAccount(
    studentId: string,
    feeStructureId: string,
  ): Promise<StudentFeeAccount> {
    try {
      const account = await this.studentFeeAccountRepository.findOne({
        where: {
          student: { id: studentId },
          fee_structure: { id: feeStructureId },
        },
        relations: ['student', 'fee_structure'],
      });
      if (!account) {
        throw new NotFoundException(
          'No fee account found for this student and term. Run bulk assignment first.',
        );
      }
      return account;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Error resolving student fee account');
    }
  }

  async getCurrentActiveFeeStructureForForm(form: Form): Promise<FeeStructure> {
    try {
      const structure = await this.feeStructureRepository.findOne({
        where: { form, is_active: true },
        order: { created_at: 'DESC' },
      });
      if (!structure) {
        throw new NotFoundException('No active fee structure found for this student form');
      }
      return structure;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Error resolving active fee structure');
    }
  }
}
