import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UsersService } from './users/users.service';
import { UserRole, Form, Stream, Gender } from './users/enums/user-role.enum';
import { StudentsService } from './students/students.service';
import { AttendanceService } from './attendance/attendance.service';
import { AttendanceStatus } from './attendance/enums/attendance-status.enum';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Student } from './students/entities/student.entity';
import { MedicalCard } from './medical/entities/medical-card.entity';
import { User } from './users/entities/user.entity';
import { DisciplineService } from './discipline/discipline.service';
import { IncidentType, Severity, IncidentStatus } from './discipline/enums/discipline.enum';
import { FinanceService } from './finance/finance.service';
import { Term, PaymentMethod } from './finance/enums/finance.enum';
import { CommsService } from './comms/comms.service';
import { MessagePriority, TriageLabel } from './comms/enums/comms.enum';
import { Repository } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);
  const studentsService = app.get(StudentsService);
  const attendanceService = app.get(AttendanceService);
  const disciplineService = app.get(DisciplineService);
  const financeService = app.get(FinanceService);
  const commsService = app.get(CommsService);
  const studentRepo = app.get<Repository<Student>>(getRepositoryToken(Student));
  const medicalRepo = app.get<Repository<MedicalCard>>(getRepositoryToken(MedicalCard));

  console.log('--- Robust Seeding Started ---');

  try {
    // 1. Create Comprehensive Staff Accounts
    console.log('Creating staff accounts...');
    
    const principal = await usersService.findByEmail('principal@sychar.ac.ke').catch(() => 
      usersService.create({ email: 'principal@sychar.ac.ke', full_name: 'Dr. James Njuguna', password: 'password123', role: UserRole.PRINCIPAL })
    );

    const deputy = await usersService.findByEmail('deputy@sychar.ac.ke').catch(() => 
      usersService.create({ email: 'deputy@sychar.ac.ke', full_name: 'Mrs. Sarah Kemunto', password: 'password123', role: UserRole.DEPUTY_PRINCIPAL })
    );

    const hod = await usersService.findByEmail('hod.science@sychar.ac.ke').catch(() => 
      usersService.create({ email: 'hod.science@sychar.ac.ke', full_name: 'Mr. Peter Otieno', password: 'password123', role: UserRole.HOD, department: 'Sciences' } as any)
    );

    const teacher1 = await usersService.findByEmail('teacher1@sychar.ac.ke').catch(() => 
      usersService.create({ email: 'teacher1@sychar.ac.ke', full_name: 'Ms. Alice Wambui', password: 'password123', role: UserRole.CLASS_TEACHER, assigned_form: Form.FORM_1, assigned_stream: Stream.A } as any)
    );

    const teacher2 = await usersService.findByEmail('teacher2@sychar.ac.ke').catch(() => 
      usersService.create({ email: 'teacher2@sychar.ac.ke', full_name: 'Mr. Benson Mutua', password: 'password123', role: UserRole.CLASS_TEACHER, assigned_form: Form.FORM_2, assigned_stream: Stream.B } as any)
    );

    const accountant = await usersService.findByEmail('accountant@sychar.ac.ke').catch(() => 
      usersService.create({ email: 'accountant@sychar.ac.ke', full_name: 'Mr. David Mpesa', password: 'password123', role: UserRole.ACCOUNTANT })
    );

    const nurse = await usersService.findByEmail('nurse@sychar.ac.ke').catch(() => 
      usersService.create({ email: 'nurse@sychar.ac.ke', full_name: 'Sister Mary Anne', password: 'password123', role: UserRole.NURSE })
    );

    const parentUser = await usersService.findByEmail('parent@sychar.ac.ke').catch(() => 
      usersService.create({ email: 'parent@sychar.ac.ke', full_name: 'Mr. Robert Kariuki', password: 'password123', role: UserRole.PARENT })
    );

    // 2. Create Students across different forms
    console.log('Creating students...');
    const studentsData = [
      { name: 'John Doe', adm: 'ADM001', form: Form.FORM_1, stream: Stream.A, gender: Gender.MALE },
      { name: 'Jane Smith', adm: 'ADM002', form: Form.FORM_1, stream: Stream.A, gender: Gender.FEMALE },
      { name: 'Peter Pan', adm: 'ADM003', form: Form.FORM_1, stream: Stream.A, gender: Gender.MALE },
      { name: 'Wendy Darling', adm: 'ADM004', form: Form.FORM_1, stream: Stream.A, gender: Gender.FEMALE },
      { name: 'Michael Jordan', adm: 'ADM005', form: Form.FORM_1, stream: Stream.A, gender: Gender.MALE },
      { name: 'LeBron James', adm: 'ADM006', form: Form.FORM_2, stream: Stream.B, gender: Gender.MALE },
      { name: 'Serena Williams', adm: 'ADM007', form: Form.FORM_2, stream: Stream.B, gender: Gender.FEMALE },
      { name: 'Tiger Woods', adm: 'ADM008', form: Form.FORM_2, stream: Stream.B, gender: Gender.MALE },
      { name: 'Marta Vieira', adm: 'ADM009', form: Form.FORM_2, stream: Stream.B, gender: Gender.FEMALE },
      { name: 'Lewis Hamilton', adm: 'ADM010', form: Form.FORM_2, stream: Stream.B, gender: Gender.MALE },
      { name: 'Elon Musk', adm: 'ADM011', form: Form.FORM_3, stream: Stream.C, gender: Gender.MALE },
      { name: 'Oprah Winfrey', adm: 'ADM012', form: Form.FORM_3, stream: Stream.C, gender: Gender.FEMALE },
      { name: 'Bill Gates', adm: 'ADM013', form: Form.FORM_4, stream: Stream.D, gender: Gender.MALE },
      { name: 'Michelle Obama', adm: 'ADM014', form: Form.FORM_4, stream: Stream.D, gender: Gender.FEMALE },
    ];

    const students: Student[] = [];
    for (const data of studentsData) {
      let student = await studentRepo.findOneBy({ admission_number: data.adm });
      if (!student) {
        student = await studentsService.create({
          full_name: data.name,
          admission_number: data.adm,
          form: data.form,
          stream: data.stream,
          gender: data.gender,
          date_of_birth: '2010-01-01',
        });
        
        await medicalRepo.save({
          student_id: student.id,
          blood_type: data.adm === 'ADM001' ? 'O+' : data.adm === 'ADM002' ? 'A-' : 'B+',
          allergies: data.adm === 'ADM002' ? ['Peanuts', 'Dust'] : [],
          chronic_conditions: data.adm === 'ADM006' ? ['Asthma'] : [],
          current_medications: data.adm === 'ADM006' ? ['Salbutamol Inhaler'] : [],
          emergency_contact_name: 'Guardian for ' + data.name,
          emergency_contact_phone: '07' + Math.floor(10000000 + Math.random() * 90000000),
          emergency_contact_relation: 'Parent',
          medical_notes: data.adm === 'ADM006' ? 'Carry inhaler at all times.' : undefined,
        });
      }
      students.push(student);
    }

    // 3. Link Parent to 2 Students
    console.log('Linking parent to students...');
    await studentsService.linkParent(students[0].admission_number, parentUser!.id);
    await studentsService.linkParent(students[5].admission_number, parentUser!.id);

    // 4. Create Historical Attendance (Last 5 Days)
    console.log('Seeding historical attendance...');
    const days = 5;
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      // Form 1A
      await attendanceService.bulkMarkAttendance({
        date: dateStr,
        form: Form.FORM_1,
        stream: Stream.A,
        entries: students.filter(s => s.form === Form.FORM_1).map(s => ({
          studentId: s.id,
          status: Math.random() > 0.1 ? AttendanceStatus.PRESENT : AttendanceStatus.ABSENT,
          remarks: '',
        })),
      }, teacher1!);

      // Form 2B
      await attendanceService.bulkMarkAttendance({
        date: dateStr,
        form: Form.FORM_2,
        stream: Stream.B,
        entries: students.filter(s => s.form === Form.FORM_2).map(s => ({
          studentId: s.id,
          status: Math.random() > 0.1 ? AttendanceStatus.PRESENT : AttendanceStatus.ABSENT,
          remarks: '',
        })),
      }, teacher2!);
    }

    // 5. Create Diverse Discipline Incidents
    console.log('Seeding discipline incidents...');
    const today = new Date().toISOString().split('T')[0];
    const incidents = [
      { s: students[0], type: IncidentType.ABSENTEEISM, sev: Severity.LOW, status: IncidentStatus.RESOLVED, desc: 'Late for morning assembly.' },
      { s: students[2], type: IncidentType.MISCONDUCT, sev: Severity.MEDIUM, status: IncidentStatus.OPEN, desc: 'Using mobile phone in class.' },
      { s: students[4], type: IncidentType.VIOLENCE, sev: Severity.HIGH, status: IncidentStatus.ESCALATED, desc: 'Fighting during lunch break.' },
      { s: students[6], type: IncidentType.SUBSTANCE_ABUSE, sev: Severity.CRITICAL, status: IncidentStatus.OPEN, desc: 'Possession of prohibited items.' },
      { s: students[1], type: IncidentType.ACADEMIC_DISHONESTY, sev: Severity.HIGH, status: IncidentStatus.UNDER_REVIEW, desc: 'Caught with notes during math test.' },
      { s: students[10], type: IncidentType.BULLYING, sev: Severity.MEDIUM, status: IncidentStatus.RESOLVED, desc: 'Teasing junior students.' },
    ];

    for (const inc of incidents) {
      const incident = await disciplineService.reportIncident({
        studentId: inc.s.id,
        incident_type: inc.type,
        severity: inc.sev,
        description: inc.desc,
        incident_date: today,
      }, teacher1!);

      if (inc.status !== IncidentStatus.OPEN) {
        await disciplineService.updateIncident(incident.id, {
          status: inc.status,
          action_taken: 'Parent notified and session conducted.',
        }, deputy!);
      }
    }

    // 6. Create Robust Finance Data
    console.log('Seeding finance data...');
    const structures = [];
    for (const f of Object.values(Form)) {
      const fs = await financeService.createFeeStructure({
        form: f,
        academic_year: '2026',
        term: Term.TERM_1,
        total_amount: f === Form.FORM_1 ? 45000 : 38000,
        is_active: true,
      }, principal!);
      structures.push(fs);
    }

    // Diverse Payments
    // Student 0: Partial Bank Transfer
    await financeService.recordManualPayment({
      studentId: students[0].id, feeStructureId: structures[0].id, amount: 20000,
      payment_method: PaymentMethod.BANK_TRANSFER, transaction_date: today, notes: 'Part 1'
    }, accountant!);

    // Student 1: Full M-Pesa
    await financeService.recordManualPayment({
      studentId: students[1].id, feeStructureId: structures[0].id, amount: 45000,
      payment_method: PaymentMethod.MPESA, mpesa_receipt: 'QHX4KL2M3N', transaction_date: today
    }, accountant!);

    // Student 5: Small Cash Payment (High Deficit)
    await financeService.recordManualPayment({
      studentId: students[5].id, feeStructureId: structures[1].id, amount: 5000,
      payment_method: PaymentMethod.CASH, transaction_date: today
    }, accountant!);

    // 7. Create Communications Data
    console.log('Seeding communication messages...');
    const parentMsgs = [
      { subject: 'Urgent: Medical condition', body: 'My child has developed a fever and might be sick.', priority: MessagePriority.URGENT },
      { subject: 'Question about Term 1 fees', body: 'Can I pay the remaining fee balance in installments?', priority: MessagePriority.FINANCIAL },
      { subject: 'Academic performance', body: 'I would like to discuss my child\'s recent math grades.', priority: MessagePriority.ACADEMIC },
      { subject: 'General Inquiry', body: 'When is the next parent-teacher meeting?', priority: MessagePriority.NORMAL },
    ];

    for (const msg of parentMsgs) {
      const sent = await commsService.sendMessage(msg, parentUser!);
      
      // Reply to one message
      if (msg.priority === MessagePriority.ACADEMIC) {
        await commsService.sendMessage({
          subject: `Re: ${msg.subject}`,
          body: 'We can schedule a meeting this Friday at 4 PM. Please confirm.',
          priority: MessagePriority.ACADEMIC,
          recipientId: parentUser!.id
        }, principal!);
      }
    }

    console.log('--- Robust Seeding Completed Successfully! ---');
  } catch (error) {
    console.error('Error during seeding:', error);
  } finally {
    await app.close();
  }
}

bootstrap();
