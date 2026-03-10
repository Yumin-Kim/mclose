import { Injectable, Logger } from '@nestjs/common';
import { PaymentHistoryRepository } from '../repositories/payment-history.repository';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { UserEntity } from '../entities/user.entity';
import { PaymentDto } from '../dto/payment.dto';
import { PaymentHistoryEntity } from '../entities/payment-history.entity';
import { PAYMENT_HISTORY_STATUS } from '../constant';
import { AccountActionService } from './account-action.service';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly PaymentHistoryRepository: PaymentHistoryRepository,
    private readonly accountActionService: AccountActionService,
  ) { }

  // 결제 요청 내역 생성
  async create(paymnetDto: PaymentDto, user: UserEntity) {
    const newEntity = new PaymentHistoryEntity();
    newEntity.amount = paymnetDto.amount;
    newEntity.chargeAmount = paymnetDto.chargeAmount;
    newEntity.merchantUid = paymnetDto.merchantUid;
    newEntity.payMethod = paymnetDto.payMethod;
    newEntity.pgProvider = paymnetDto.pgProvider;
    newEntity.currency = paymnetDto.currency;
    newEntity.status = PAYMENT_HISTORY_STATUS.READY;
    newEntity.user = user;

    const isenw = await this.PaymentHistoryRepository.save(newEntity);
    if (!isenw) {
      this.logger.error('PaymentHistory create failed');
      return false;
    }

    return true;
  }

  // 결제 완료
  async complete(impUid: string, merchantUid: string, user: UserEntity) {
    const queryRunner = this.dataSource.createQueryRunner();
    let isSucceed = false;
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 결제 내역 조회
      const paymentHistory = await queryRunner.manager.findOne(
        PaymentHistoryEntity,
        {
          where: { merchantUid },
        },
      );
      if (!paymentHistory) {
        this.logger.error('PaymentHistory not found');
        return false;
      }

      await this.accountActionService.depositToPoint(
        queryRunner,
        paymentHistory.chargeAmount,
        paymentHistory.currency,
        user.id,
      );

      // 결제 내역 업데이트
      await queryRunner.manager.update(
        PaymentHistoryEntity,
        { merchantUid },
        {
          status: PAYMENT_HISTORY_STATUS.PAID,
          paidAt: () => 'CURRENT_TIMESTAMP',
          impUid,
        },
      );

      await queryRunner.commitTransaction();
      isSucceed = true;
    } catch (e) {
      await queryRunner.rollbackTransaction();
      this.logger.error(e);
      isSucceed = false;
    } finally {
      if (!queryRunner.isReleased) {
        await queryRunner.release();
      }

      return isSucceed;
    }
  }

  // 결제 취소
  async cancel(merchantUid: string, errorCode: string, errorMsg: string) {
    const paymentHistory = await this.PaymentHistoryRepository.findOne({
      where: { merchantUid },
    });
    if (!paymentHistory) {
      this.logger.error('PaymentHistory not found');
      return false;
    }

    // 결제 취소
    await this.PaymentHistoryRepository.update(
      { merchantUid },
      {
        status: PAYMENT_HISTORY_STATUS.CANCELED,
        paidAt: () => 'CURRENT_TIMESTAMP', // TODO: 결제 취소 시간 확인
        errorCode,
        errorMsg,
      },
    );

    return true;
  }
}
