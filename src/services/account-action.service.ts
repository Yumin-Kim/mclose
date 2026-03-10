/**
 * @description: 실질적인 USERCASE에 해당하는 메소드를 정의한 서비스
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, QueryRunner } from 'typeorm';
import { AccountService } from './account.service';
import { AccountHistoryService } from './account-history.service';
import { UserEntity } from '../entities/user.entity';

@Injectable()
export class AccountActionService {
  private readonly logger = new Logger(AccountActionService.name);

  constructor(
    private readonly accountService: AccountService,
    private readonly accountHistoryService: AccountHistoryService,
  ) {}

  async widthdrawFromPoint(
    queryRunner: QueryRunner,
    amount: number,
    currency: string,
    userId: number,
  ) {
    try {
      // CL 조회
      const account = await this.accountService.getEntityByUserAndCurrency(
        userId,
        currency,
        queryRunner,
      );
      if (!account) {
        this.logger.error('Account not found');
        return false;
      }

      // CL 검증
      const isInsufficientBalance =
        await this.accountService.isInSufficientBalance(
          amount,
          currency,
          userId,
          queryRunner,
        );
      if (isInsufficientBalance) {
        this.logger.error('Insufficient CL');
        return false;
      }

      // CL 차감 / 히스토리
      await this.accountService.decreaseBalance(
        account.id,
        amount,
        currency,
        userId,
        queryRunner,
      );
      await this.accountHistoryService.createWithdrawPointHistory(
        -amount,
        currency,
        account,
        queryRunner,
      );

      this.logger.log(
        `Successfully widthdrew from point: userId=${userId}, amount=${amount}, currency=${currency}`,
      );

      return true;
    } catch (e) {
      this.logger.error(
        `Failed to widthdraw from point: userId=${userId}, amount=${amount}, currency=${currency}`,
      );
      console.log(e);
      this.logger.error(e);
      return false;
    }
  }

  async depositToPoint(
    queryRunner: QueryRunner,
    amount: number,
    currency: string,
    userId: number,
  ) {
    try {
      // CL 조회
      const account = await this.accountService.getEntityByUserAndCurrency(
        userId,
        currency,
        queryRunner,
      );
      if (!account) {
        this.logger.error('Account not found');
        return false;
      }

      // CL 입금 / 히스토리
      await this.accountService.increaseBalance(
        account.id,
        amount,
        currency,
        userId,
        queryRunner,
      );
      await this.accountHistoryService.createDepositPointHistory(
        amount,
        currency,
        account,
        queryRunner,
      );

      this.logger.log(
        `Successfully deposited to point: userId=${userId}, amount=${amount}, currency=${currency}`,
      );

      return true;
    } catch (e) {
      this.logger.error(
        `Failed to deposit to point: userId=${userId}, amount=${amount}, currency=${currency}`,
      );
      console.log(e);
      this.logger.error(e);
      return false;
    }
  }
}
