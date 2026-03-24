import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from './entities/student.entity';
import { CreateStudentDto } from './dto/create-student.dto';
import { Form, Stream } from '../users/enums/user-role.enum';
import { UsersService } from '../users/users.service';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    private readonly usersService: UsersService,
  ) {}

  async create(createStudentDto: CreateStudentDto): Promise<Student> {
    try {
      const { parentId, date_of_birth, ...studentData } = createStudentDto;
      const student = this.studentRepository.create({
        ...studentData,
        date_of_birth: date_of_birth ? new Date(date_of_birth) : undefined,
      });

      if (parentId) {
        student.parent = await this.usersService.findById(parentId);
      }

      return await this.studentRepository.save(student);
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException('Admission number already exists');
      }
      throw new InternalServerErrorException();
    }
  }

  async findAll(form?: Form, stream?: Stream, parentId?: string): Promise<Student[]> {
    try {
      const query = this.studentRepository.createQueryBuilder('student')
        .leftJoinAndSelect('student.parent', 'parent');

      if (form) {
        query.andWhere('student.form = :form', { form });
      }

      if (stream) {
        query.andWhere('student.stream = :stream', { stream });
      }

      if (parentId) {
        query.andWhere('parent.id = :parentId', { parentId });
      }

      return await query.getMany();
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async linkParent(admission_number: string, parentId: string): Promise<Student> {
    try {
      const student = await this.studentRepository.findOne({
        where: { admission_number },
        relations: ['parent'],
      });

      if (!student) {
        throw new NotFoundException(`Student with admission number ${admission_number} not found`);
      }

      if (student.parent) {
        throw new ConflictException('This student is already linked to a parent account');
      }

      student.parent = await this.usersService.findById(parentId);
      return await this.studentRepository.save(student);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to link parent to student');
    }
  }

  async findById(id: string): Promise<Student> {
    try {
      const student = await this.studentRepository.findOne({
        where: { id },
        relations: ['parent'],
      });
      if (!student) {
        throw new NotFoundException(`Student with ID ${id} not found`);
      }
      return student;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException();
    }
  }

  async findByAdmission(admission_number: string): Promise<Student> {
    try {
      const student = await this.studentRepository.findOne({
        where: { admission_number },
        relations: ['parent'],
      });
      if (!student) {
        throw new NotFoundException(`Student with admission number ${admission_number} not found`);
      }
      return student;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException();
    }
  }

  async update(id: string, updateStudentDto: Partial<CreateStudentDto>): Promise<Student> {
    try {
      const student = await this.findById(id);
      const { parentId, date_of_birth, ...studentData } = updateStudentDto;

      if (parentId) {
        student.parent = await this.usersService.findById(parentId);
      }

      if (date_of_birth) {
        student.date_of_birth = new Date(date_of_birth);
      }

      Object.assign(student, studentData);
      return await this.studentRepository.save(student);
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const student = await this.findById(id);
      await this.studentRepository.remove(student);
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }
}
