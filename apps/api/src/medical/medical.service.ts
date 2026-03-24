import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MedicalCard } from './entities/medical-card.entity';
import { UpdateMedicalCardDto } from './dto/medical.dto';
import { Student } from '../students/entities/student.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class MedicalService {
  constructor(
    @InjectRepository(MedicalCard)
    private readonly medicalCardRepository: Repository<MedicalCard>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
  ) {}

  async findByStudentId(studentId: string): Promise<MedicalCard> {
    try {
      const card = await this.medicalCardRepository.findOne({
        where: { student: { id: studentId } },
        relations: ['student'],
      });
      
      if (!card) {
        throw new NotFoundException(`Medical card for student ${studentId} not found`);
      }
      
      return card;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Error fetching medical card');
    }
  }

  async updateByStudentId(studentId: string, dto: UpdateMedicalCardDto, updater: User): Promise<MedicalCard> {
    try {
      let card = await this.medicalCardRepository.findOne({
        where: { student: { id: studentId } },
      });

      if (!card) {
        const student = await this.studentRepository.findOneBy({ id: studentId });
        if (!student) throw new NotFoundException('Student not found');
        
        card = this.medicalCardRepository.create({
          ...dto,
          student,
          last_updated_by: updater,
        });
      } else {
        Object.assign(card, dto);
        card.last_updated_by = updater;
      }

      return await this.medicalCardRepository.save(card);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Error updating medical card');
    }
  }
}
