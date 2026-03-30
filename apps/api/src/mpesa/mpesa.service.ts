import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MpesaTransaction } from './entities/mpesa-transaction.entity';
import { InitiateSTKPushDto } from './dto/mpesa.dto';
import { MpesaStatus } from './enums/mpesa.enum';
import { Student } from '../students/entities/student.entity';
import { FinanceService } from '../finance/finance.service';
import { PaymentMethod, PaymentStatus } from '../finance/enums/finance.enum';
import { FeePayment } from '../finance/entities/fee-payment.entity';
import { StudentFeeAccountService } from '../finance/student-fee-account.service';

@Injectable()
export class MpesaService {
  private readonly logger = new Logger(MpesaService.name);
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(MpesaTransaction)
    private readonly mpesaRepository: Repository<MpesaTransaction>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(FeePayment)
    private readonly feePaymentRepository: Repository<FeePayment>,
    private readonly financeService: FinanceService,
    private readonly studentFeeAccountService: StudentFeeAccountService,
  ) {}

  private formatPhoneNumber(phone: string): string {
    let formatted = phone.replace(/\s+/g, '');
    if (formatted.startsWith('0')) {
      formatted = '254' + formatted.substring(1);
    } else if (formatted.startsWith('+254')) {
      formatted = formatted.substring(1);
    }
    return formatted;
  }

  async getAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.accessToken;
    }

    const consumerKey = this.configService.get<string>('app.mpesa.consumerKey');
    const consumerSecret = this.configService.get<string>('app.mpesa.consumerSecret');
    const env = this.configService.get<string>('app.mpesa.env');
    
    const baseUrl = env === 'production' 
      ? 'https://api.safaricom.co.ke' 
      : 'https://sandbox.safaricom.co.ke';

    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

    try {
      const response = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get M-Pesa token: ${response.statusText}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token || '';
      // Set expiry 10 seconds before actual expiry to be safe
      this.tokenExpiry = new Date(Date.now() + (data.expires_in - 10) * 1000);
      
      return this.accessToken || '';
    } catch (error) {
      this.logger.error('Error getting M-Pesa access token', error);
      throw new InternalServerErrorException('Failed to authenticate with M-Pesa');
    }
  }

  async initiateSTKPush(dto: InitiateSTKPushDto): Promise<MpesaTransaction> {
    try {
      const student = await this.studentRepository.findOneBy({ id: dto.studentId });
      if (!student) throw new NotFoundException('Student not found');

      const token = await this.getAccessToken();
      const env = this.configService.get<string>('app.mpesa.env');
      const baseUrl = env === 'production' 
        ? 'https://api.safaricom.co.ke' 
        : 'https://sandbox.safaricom.co.ke';

      const shortcode = this.configService.get<string>('app.mpesa.shortcode');
      const passkey = this.configService.get<string>('app.mpesa.passkey');
      const callbackUrl = this.configService.get<string>('app.mpesa.callbackUrl');
      
      const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
      const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
      const formattedPhone = this.formatPhoneNumber(dto.phone_number);

      const payload = {
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: dto.amount,
        PartyA: formattedPhone,
        PartyB: shortcode,
        PhoneNumber: formattedPhone,
        CallBackURL: callbackUrl,
        AccountReference: student.admission_number,
        TransactionDesc: 'School Fees Payment',
      };

      const response = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.ResponseCode !== '0') {
        throw new Error(`STK Push failed: ${data.ResponseDescription}`);
      }

      const transaction = this.mpesaRepository.create({
        checkout_request_id: data.CheckoutRequestID,
        merchant_request_id: data.MerchantRequestID,
        phone_number: formattedPhone,
        amount: dto.amount,
        student,
        status: MpesaStatus.INITIATED,
      });

      return await this.mpesaRepository.save(transaction);
    } catch (error) {
      this.logger.error('Error initiating STK push', error);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to initiate M-Pesa payment');
    }
  }

  async handleCallback(callbackData: any): Promise<void> {
    try {
      const result = callbackData.Body.stkCallback;
      const checkoutRequestId = result.CheckoutRequestID;
      
      const transaction = await this.mpesaRepository.findOne({
        where: { checkout_request_id: checkoutRequestId },
        relations: ['student'],
      });

      if (!transaction) {
        this.logger.warn(`Transaction not found for CheckoutRequestID: ${checkoutRequestId}`);
        return;
      }

      transaction.raw_callback = callbackData;
      transaction.result_code = result.ResultCode.toString();
      transaction.result_desc = result.ResultDesc;
      transaction.completed_at = new Date();

      if (result.ResultCode === 0 || result.ResultCode === '0') {
        transaction.status = MpesaStatus.SUCCESS;
        
        const items = result.CallbackMetadata.Item;
        const receiptItem = items.find((item: any) => item.Name === 'MpesaReceiptNumber');
        if (receiptItem) {
          transaction.mpesa_receipt = receiptItem.Value;
        }

        const existingPayment = transaction.mpesa_receipt
          ? await this.feePaymentRepository.findOne({
              where: { mpesa_receipt: transaction.mpesa_receipt },
            })
          : null;

        if (!existingPayment) {
          let accountId: string | null = null;
          if (transaction.student) {
            const activeStructure = await this.financeService.getCurrentActiveFeeStructureForForm(
              transaction.student.form,
            );
            const account = await this.financeService.resolveOrFailAccount(
              transaction.student.id,
              activeStructure.id,
            );
            accountId = account.id;
          }

          const payment = this.feePaymentRepository.create({
            student: transaction.student || undefined,
            student_fee_account: accountId ? ({ id: accountId } as any) : null,
            amount: Number(transaction.amount),
            payment_method: PaymentMethod.MPESA,
            mpesa_receipt: transaction.mpesa_receipt || undefined,
            mpesa_phone: transaction.phone_number,
            transaction_date: new Date(),
            status: PaymentStatus.COMPLETED,
            notes: 'Auto-recorded from M-Pesa callback',
          });
          await this.feePaymentRepository.save(payment);

          if (accountId) {
            await this.studentFeeAccountService.recalculateAccount(accountId);
          }
        }
      } else {
        transaction.status = MpesaStatus.FAILED;
      }

      await this.mpesaRepository.save(transaction);
    } catch (error) {
      this.logger.error('Error handling M-Pesa callback', error);
      throw new InternalServerErrorException('Failed to process M-Pesa callback');
    }
  }
}
