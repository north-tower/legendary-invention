import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { StudentFeeAccount, FeeAccountStatus } from './entities/student-fee-account.entity';
import { FeeStructure } from './entities/fee-structure.entity';
import { Student } from '../students/entities/student.entity';
import { FeePayment } from './entities/fee-payment.entity';
import { ApplyExemptionDto, GetTermAccountsDto } from './dto/fee-account.dto';
import { PaymentStatus, Term } from './enums/finance.enum';
import { DeficitTrajectory } from './types/finance.types';

@Injectable()
export class StudentFeeAccountService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(StudentFeeAccount)
    private readonly accountRepository: Repository<StudentFeeAccount>,
    @InjectRepository(FeeStructure)
    private readonly feeStructureRepository: Repository<FeeStructure>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(FeePayment)
    private readonly feePaymentRepository: Repository<FeePayment>,
  ) {}

  async bulkAssignFees(
    feeStructureId: string,
    assignedByUserId: string,
  ): Promise<{ created: number; skipped: number; total: number }> {
    const _assignedByUserId = assignedByUserId;
    void _assignedByUserId;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const feeStructure = await queryRunner.manager.findOne(FeeStructure, {
        where: { id: feeStructureId },
      });

      if (!feeStructure || !feeStructure.is_active) {
        throw new NotFoundException('Fee structure not found or inactive');
      }

      const students = await queryRunner.manager.find(Student, {
        where: { form: feeStructure.form, is_active: true },
      });

      let created = 0;
      let skipped = 0;

      for (const student of students) {
        const existing = await queryRunner.manager.findOne(StudentFeeAccount, {
          where: {
            student: { id: student.id },
            fee_structure: { id: feeStructure.id },
          },
          relations: ['student', 'fee_structure'],
        });

        if (existing) {
          skipped += 1;
          continue;
        }

        const previousTerm = this.getPreviousTerm(feeStructure.term);
        let arrears = 0;

        if (previousTerm) {
          const previousAccount = await queryRunner.manager.findOne(StudentFeeAccount, {
            where: {
              student: { id: student.id },
              fee_structure: {
                term: previousTerm,
                academic_year: feeStructure.academic_year,
                form: feeStructure.form,
              },
            },
            relations: ['fee_structure', 'student'],
          });

          if (previousAccount) {
            const previousBalance = this.toNumber(previousAccount.balance);
            arrears = previousBalance > 0 ? previousBalance : 0;
          }
        }

        const totalBilled = this.toNumber(feeStructure.total_amount) + arrears;

        const account = queryRunner.manager.create(StudentFeeAccount, {
          student,
          fee_structure: feeStructure,
          billed_amount: totalBilled,
          exemption_amount: 0,
          exemption_reason: null,
          arrears_brought_forward: arrears,
          total_paid: 0,
          balance: totalBilled,
          status: FeeAccountStatus.PENDING,
        });

        await queryRunner.manager.save(account);
        created += 1;
      }

      await queryRunner.commitTransaction();
      return { created, skipped, total: created + skipped };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Error bulk-assigning fees');
    } finally {
      await queryRunner.release();
    }
  }

  async applyExemption(accountId: string, dto: ApplyExemptionDto): Promise<StudentFeeAccount> {
    try {
      const account = await this.accountRepository.findOne({
        where: { id: accountId },
        relations: ['student', 'fee_structure'],
      });
      if (!account) throw new NotFoundException('Fee account not found');

      const billedAmount = this.toNumber(account.billed_amount);
      if (dto.amount > billedAmount) {
        throw new BadRequestException('Exemption amount cannot exceed billed amount');
      }

      account.exemption_amount = dto.amount;
      account.exemption_reason = dto.reason;

      const totalPaid = this.toNumber(account.total_paid);
      account.balance = billedAmount - dto.amount - totalPaid;
      account.status = this.computeStatus(
        this.toNumber(account.balance),
        totalPaid,
        billedAmount - dto.amount,
      );

      return await this.accountRepository.save(account);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Error applying exemption');
    }
  }

  async recalculateAccount(accountId: string): Promise<StudentFeeAccount> {
    try {
      const account = await this.accountRepository.findOne({
        where: { id: accountId },
        relations: ['student', 'fee_structure'],
      });
      if (!account) throw new NotFoundException('Fee account not found');

      const payments = await this.feePaymentRepository.find({
        where: {
          student_fee_account: { id: accountId },
          status: PaymentStatus.COMPLETED,
        },
        order: { transaction_date: 'DESC' },
      });

      const totalPaid = payments.reduce((sum, p) => sum + this.toNumber(p.amount), 0);
      const billedAmount = this.toNumber(account.billed_amount);
      const exemptionAmount = this.toNumber(account.exemption_amount);
      const effectiveBill = billedAmount - exemptionAmount;
      const balance = effectiveBill - totalPaid;

      account.total_paid = totalPaid;
      account.balance = balance;
      account.status = this.computeStatus(balance, totalPaid, effectiveBill);
      account.last_payment_at = payments.length > 0 ? payments[0].transaction_date : null;

      return await this.accountRepository.save(account);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Error recalculating account');
    }
  }

  async getTermAccounts(dto: GetTermAccountsDto): Promise<StudentFeeAccount[]> {
    try {
      const query = this.accountRepository
        .createQueryBuilder('account')
        .leftJoinAndSelect('account.student', 'student')
        .leftJoinAndSelect('account.fee_structure', 'fee_structure');

      if (dto.feeStructureId) {
        query.andWhere('fee_structure.id = :feeStructureId', {
          feeStructureId: dto.feeStructureId,
        });
      }
      if (dto.status) {
        query.andWhere('account.status = :status', { status: dto.status });
      }
      if (dto.form) {
        query.andWhere('student.form = :form', { form: dto.form });
      }
      if (dto.stream) {
        query.andWhere('student.stream = :stream', { stream: dto.stream });
      }

      return await query
        .orderBy('account.balance', 'DESC')
        .addOrderBy('student.full_name', 'ASC')
        .getMany();
    } catch (error) {
      throw new InternalServerErrorException('Error fetching fee accounts');
    }
  }

  async getStudentFeeHistory(studentId: string): Promise<StudentFeeAccount[]> {
    try {
      const student = await this.studentRepository.findOne({ where: { id: studentId } });
      if (!student) throw new NotFoundException('Student not found');

      return await this.accountRepository
        .createQueryBuilder('account')
        .leftJoinAndSelect('account.fee_structure', 'fee_structure')
        .leftJoinAndSelect('account.student', 'student')
        .where('student.id = :studentId', { studentId })
        .orderBy('fee_structure.academic_year', 'DESC')
        .addOrderBy('fee_structure.term', 'ASC')
        .getMany();
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Error fetching student fee history');
    }
  }

  async getAccountById(id: string): Promise<StudentFeeAccount> {
    try {
      const account = await this.accountRepository.findOne({
        where: { id },
        relations: ['student', 'fee_structure'],
      });
      if (!account) throw new NotFoundException('Fee account not found');
      return account;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Error fetching fee account');
    }
  }

  async getDeficitTrajectory(feeStructureId: string): Promise<DeficitTrajectory> {
    try {
      const feeStructure = await this.feeStructureRepository.findOne({
        where: { id: feeStructureId },
      });
      if (!feeStructure) throw new NotFoundException('Fee structure not found');

      const accounts = await this.accountRepository.find({
        where: { fee_structure: { id: feeStructureId } },
      });

      const totalStudents = accounts.length;
      const totalBilled = accounts.reduce((sum, a) => sum + this.toNumber(a.billed_amount), 0);
      const totalExemptions = accounts.reduce(
        (sum, a) => sum + this.toNumber(a.exemption_amount),
        0,
      );
      const effectiveBilled = totalBilled - totalExemptions;
      const totalCollected = accounts.reduce((sum, a) => sum + this.toNumber(a.total_paid), 0);
      const collectionRate =
        effectiveBilled > 0 ? (totalCollected / effectiveBilled) * 100 : 0;

      const termStart = this.getTermStartDate(feeStructure.term, feeStructure.academic_year);
      const now = new Date();
      const elapsedRaw = Math.floor(
        (now.getTime() - termStart.getTime()) / (1000 * 60 * 60 * 24),
      );
      const daysElapsed = Math.max(0, Math.min(90, elapsedRaw));
      const dailyVelocity = daysElapsed > 0 ? totalCollected / daysElapsed : 0;
      const daysRemaining = Math.max(0, 90 - daysElapsed);
      const projectedCollection = totalCollected + dailyVelocity * daysRemaining;
      const projectedDeficit = effectiveBilled - projectedCollection;
      const deficitRatio = effectiveBilled > 0 ? projectedDeficit / effectiveBilled : 0;

      let riskLevel: 'low' | 'medium' | 'high' = 'low';
      if (deficitRatio >= 0.3) {
        riskLevel = 'high';
      } else if (deficitRatio >= 0.1) {
        riskLevel = 'medium';
      }

      const accountsPending = accounts.filter((a) => a.status === FeeAccountStatus.PENDING).length;
      const accountsPartial = accounts.filter((a) => a.status === FeeAccountStatus.PARTIAL).length;
      const accountsCleared = accounts.filter((a) => a.status === FeeAccountStatus.CLEARED).length;
      const accountsOverpaid = accounts.filter((a) => a.status === FeeAccountStatus.OVERPAID).length;

      return {
        fee_structure_id: feeStructure.id,
        form: feeStructure.form,
        term: feeStructure.term,
        year: feeStructure.academic_year,
        total_students: totalStudents,
        total_billed: totalBilled,
        total_exemptions: totalExemptions,
        effective_billed: effectiveBilled,
        total_collected: totalCollected,
        collection_rate: collectionRate,
        daily_velocity: dailyVelocity,
        days_elapsed: daysElapsed,
        days_remaining: daysRemaining,
        projected_collection: projectedCollection,
        projected_deficit: projectedDeficit,
        risk_level: riskLevel,
        accounts_pending: accountsPending,
        accounts_partial: accountsPartial,
        accounts_cleared: accountsCleared,
        accounts_overpaid: accountsOverpaid,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Error calculating deficit trajectory');
    }
  }

  private computeStatus(balance: number, totalPaid: number, effectiveBill: number): FeeAccountStatus {
    if (balance < 0) return FeeAccountStatus.OVERPAID;
    if (balance === 0) return FeeAccountStatus.CLEARED;
    if (balance > 0 && totalPaid > 0 && effectiveBill >= 0) return FeeAccountStatus.PARTIAL;
    return FeeAccountStatus.PENDING;
  }

  private getPreviousTerm(term: Term): Term | null {
    if (term === Term.TERM_2) return Term.TERM_1;
    if (term === Term.TERM_3) return Term.TERM_2;
    return null;
  }

  private getTermStartDate(term: Term, academicYear: string): Date {
    const year = parseInt(academicYear, 10);
    if (term === Term.TERM_1) return new Date(Date.UTC(year, 0, 1));
    if (term === Term.TERM_2) return new Date(Date.UTC(year, 4, 1));
    return new Date(Date.UTC(year, 8, 1));
  }

  private toNumber(value: unknown): number {
    return parseFloat((value ?? 0).toString());
  }
}
