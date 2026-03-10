import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { UserRepository } from '../repositories/user.repository';
import { UserEntity } from '../entities/user.entity';
import { AccountService } from './account.service';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, QueryRunner } from 'typeorm';
import {
  ACCOUNT_CURRENCY,
  JWT_USER_EXPIRE_TIME,
  RESPONSE_CODE,
} from '../constant';
import { UserDto } from '../dto/user.dto';
import { AuthService } from '../common/auth/auth.service';
import { ApiHttpException } from '../common/response/response-exception.filter';
import { UsageHistoryEntity } from '../entities/usage-history.entity';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly userRepository: UserRepository,
    private readonly accountService: AccountService,
    private readonly authService: AuthService,
  ) {}

  async signup(data: UserDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 비밀 번호 해싱
      const randomInt = this.authService.randomInt(2, 16);
      const hashedPassword = this.authService.roundPassword(
        data.hashPassword,
        randomInt,
      );

      // jwt 토큰 생성
      const jwt = this.authService.generateJWTToken(
        {
          id: data.id,
        },
        JWT_USER_EXPIRE_TIME,
      );

      // TODO: 생성되는 엔티티 추가
      const newEntity = new UserEntity();
      newEntity.realName = data.realName;
      newEntity.loginId = data.email;
      newEntity.loginPw = hashedPassword;
      newEntity.pwRound = randomInt;
      newEntity.phoneNo = data.phoneNo;
      newEntity.email = data.email;
      newEntity.role = data.role || 'USER';
      newEntity.birthDate = data.birthDate;
      newEntity.jwt = jwt;
      newEntity.bankCode = data.bankCode;
      newEntity.bankAccountNumber = data.bankAccountNumber;
      newEntity.bankName = data.bankName;
      newEntity.isConsentUsed = data.isConsentUse;
      newEntity.isConsentMarketingInfo = data.isConsentMarketingInfo;
      newEntity.isConsentPersonalInfo = data.isConsentPersonalInfo;

      const entity = await queryRunner.manager.save(newEntity);

      // mc_account 생성
      await this.accountService.create(
        ACCOUNT_CURRENCY.CL,
        entity,
        queryRunner,
      );
      await this.accountService.create(
        ACCOUNT_CURRENCY.OS,
        entity,
        queryRunner,
      );

      await queryRunner.commitTransaction();

      return true;
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      if (!queryRunner.isReleased) {
        await queryRunner.release();
      }
    }
  }

  async signin(userEntity: UserEntity, data: UserDto) {
    // 로그인 시도 횟수 증가
    userEntity.signInRetrialCount += 1;
    await this.userRepository.update(userEntity.id, {
      signInRetrialCount: userEntity.signInRetrialCount,
    });

    // 비밀 번호 검증
    const securePassRound = (data.nonce % 15) + 2;
    const verified = this.authService.verifySecurePassword(
      data.hashPassword,
      securePassRound,
      userEntity.loginPw,
      userEntity.pwRound,
    );
    if (!verified) {
      throw new ApiHttpException(
        RESPONSE_CODE.USER_INVALID_PASSWORD,
        HttpStatus.BAD_REQUEST,
      );
    }

    // 로그인 성공 시 jwt 토큰 생성
    const jwt = this.authService.generateJWTToken(
      {
        id: userEntity.id,
      },
      JWT_USER_EXPIRE_TIME,
    );

    // 로그인 시간 업데이트
    await this.userRepository.update(userEntity.id, {
      jwt,
      signInRetrialCount: 0,
      lastActivitedAt: () => 'CURRENT_TIMESTAMP',
    });

    return {
      jwt,
      id: userEntity.id,
      realName: userEntity.realName,
      email: userEntity.email,
      role: userEntity.role,
    };
  }

  async updatePassword(id: number, hashPassword: string) {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      return false;
    }

    const randomInt = this.authService.randomInt(2, 16);
    const loginPw = this.authService.roundPassword(hashPassword, randomInt);

    await this.userRepository.update(user.id, {
      loginPw,
      pwRound: randomInt,
      signInRetrialCount: 0,
    });

    return true;
  }

  async updateToken(id: number) {
    const jwt = this.authService.generateJWTToken(
      {
        id,
      },
      JWT_USER_EXPIRE_TIME,
    );

    await this.userRepository.update(id, {
      jwt,
    });

    return {
      jwt,
    };
  }

  async update(id: number, data: UserDto) {
    await this.userRepository.update(id, {
      phoneNo: data.phoneNo,
      bankAccountNumber: data.bankAccountNumber,
      bankCode: data.bankCode,
      bankName: data.bankName,
    });

    return true;
  }

  async updateBanckInfo(
    user: UserEntity,
    bankCode: string,
    bankName: string,
    bankAccountNumber: string,
  ) {
    await this.userRepository.update(user.id, {
      bankCode,
      bankAccountNumber,
      bankName,
    });
    return true;
  }

  async updateWorkspaceHashtag(id: number, keyword: string) {
    await this.userRepository.update(id, {
      workspaceHashtag: keyword,
    });

    return true;
  }

  async delete(id: number) {
    await this.userRepository.update(id, {
      deletedAt: () => 'CURRENT_TIMESTAMP',
      isDeleted: true,
    });

    return true;
  }

  async logout(id: number) {
    await this.userRepository.update(id, {
      jwt: null,
      lastActivitedAt: () => 'CURRENT_TIMESTAMP',
    });

    return true;
  }

  async verifyPassword(id: number, nonce: number, hashPassword: string) {
    const user = await this.getEntityById(id);

    if (!user) {
      return false;
    }

    const securePassRound = (nonce % 15) + 2;
    const verified = this.authService.verifySecurePassword(
      hashPassword,
      securePassRound,
      user.loginPw,
      user.pwRound,
    );

    return verified;
  }

  async createUsageHistory(
    type: string,
    refId: number,
    userId: number,
    currency: string,
    amount: number,
    queryRunner: QueryRunner,
  ) {
    return queryRunner.manager.insert(UsageHistoryEntity, {
      type,
      refId,
      currency,
      amount,
      user: {
        id: userId,
      },
    });
  }

  async verifyJWTToken(jwt: string, id: number) {
    return this.userRepository.findOne({
      where: { jwt, id },
    });
  }

  async getEntityById(id: number) {
    return this.userRepository.findOne({
      where: { id },
    });
  }

  async getEntityByEmail(email: string) {
    return this.userRepository.findOne({
      where: { email },
    });
  }

  async getEntityByPhoneNo(phoneNo: string) {
    return this.userRepository.findOne({
      where: { phoneNo },
    });
  }

  async getEntityByRealNameAndPhoneNo(realName: string, phoneNo: string) {
    return this.userRepository.findOne({
      where: { realName, phoneNo },
    });
  }
}
