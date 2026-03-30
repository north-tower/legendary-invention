import {
  Injectable,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UserRole } from './enums/user-role.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      const { password, ...userData } = createUserDto;
      const password_hash = await bcrypt.hash(password, 10);

      const user = this.userRepository.create({
        ...userData,
        password_hash,
      });

      return await this.userRepository.save(user);
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException('Email already exists');
      }
      throw new InternalServerErrorException();
    }
  }

  async findAll(role?: UserRole): Promise<User[]> {
    try {
      const query = this.userRepository.createQueryBuilder('user');
      if (role) {
        query.where('user.role = :role', { role });
      }
      return await query.getMany();
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async findById(id: string): Promise<User> {
    try {
      const user = await this.userRepository.findOne({ where: { id } });
      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      return user;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException();
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      return await this.userRepository.findOne({
        where: { email },
        select: [
          'id',
          'email',
          'full_name',
          'password_hash',
          'role',
          'is_active',
          'assigned_form',
          'assigned_stream',
          'department',
        ],
      });
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async findByPhone(phone: string): Promise<User | null> {
    try {
      const normalized = this.normalizePhone(phone);
      return await this.userRepository.findOne({
        where: { phone: normalized, role: UserRole.PARENT },
      });
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  private normalizePhone(phone: string): string {
    let normalized = phone.trim();
    normalized = normalized.replace(/^whatsapp:/i, '');
    normalized = normalized.replace(/\s+/g, '');

    if (normalized.startsWith('07')) {
      return `+254${normalized.slice(1)}`;
    }
    if (normalized.startsWith('2547')) {
      return `+${normalized}`;
    }
    if (normalized.startsWith('+2547')) {
      return normalized;
    }
    return normalized;
  }

  async validatePassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }
}
