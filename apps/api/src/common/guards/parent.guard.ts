import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { UserRole } from '../../users/enums/user-role.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from '../../students/entities/student.entity';

@Injectable()
export class ParentGuard implements CanActivate {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // If not a parent, let RolesGuard handle it
    if (user.role !== UserRole.PARENT) {
      return true;
    }

    // Extract studentId from params or body
    const studentId = request.params.id || request.params.studentId || request.body.studentId;

    if (!studentId) {
      return true; // No student specific data requested
    }

    const student = await this.studentRepository.findOne({
      where: { id: studentId },
      relations: ['parent'],
    });

    if (!student || !student.parent || student.parent.id !== user.id) {
      throw new ForbiddenException('You can only access data for your own children');
    }

    return true;
  }
}
