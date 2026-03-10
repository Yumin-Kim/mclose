import { Injectable, Logger } from '@nestjs/common';
import { PexelService } from '../pexel-service';
import { UserEntity } from '../../entities/user.entity';
import { ACCOUNT_CURRENCY, USAGE_HISTORY_TYPE } from '../../constant';
import { PromptHistoryService } from './prompt-history.service';
import { AccountActionService } from '../account-action.service';
import { VideoActionService } from '../video/video-action.service';
import { PromptDto } from '../../dto/prompt.dto';
import { AccountService } from '../account.service';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { UserService } from '../user.service';

@Injectable()
export class PromptActionService {
  private readonly logger = new Logger(PromptActionService.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly pexelService: PexelService,
    private readonly accountActionService: AccountActionService,
    private readonly accountService: AccountService,
    private readonly userService: UserService,
    private readonly promptHistoryService: PromptHistoryService,
  ) {}

  async prepare(user: UserEntity) {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      // Prompt 사용될 Token 조회
      const tmpCalcPoint = await this.pexelService.calculatePoint();

      // CL 검증
      const isInsufficientBalance =
        await this.accountService.isInSufficientBalance(
          tmpCalcPoint,
          ACCOUNT_CURRENCY.CL,
          user.id,
          queryRunner,
        );
      if (isInsufficientBalance) {
        this.logger.error('Insufficient CL');
        return false;
      }

      // CL 차감
      const isExist = await this.accountActionService.widthdrawFromPoint(
        queryRunner,
        tmpCalcPoint,
        ACCOUNT_CURRENCY.CL,
        user.id,
      );
      if (!isExist) {
        this.logger.error('Insufficient CL');
        return false;
      }

      await this.userService.createUsageHistory(
        USAGE_HISTORY_TYPE.PROMPT,
        null,
        user.id,
        ACCOUNT_CURRENCY.CL,
        tmpCalcPoint,
        queryRunner,
      );

      return true;
    } catch (e) {
      await queryRunner.rollbackTransaction();
      this.logger.error(e);
    } finally {
      if (!queryRunner.isReleased) {
        await queryRunner.release();
      }
    }
  }

  // async execute(createPromptDto: PromptDto, user: UserEntity) {
  //   const queryRunner = this.dataSource.createQueryRunner();

  //   await queryRunner.connect();
  //   await queryRunner.startTransaction();
  //   try {
  //     // Prompt 사용될 Token 조회
  //     const tmpCalcPoint = await this.pexelService.calculatePoint();

  //     // CL 검증
  //     const isInsufficientBalance =
  //       await this.accountService.isInsufficientBalance(
  //         tmpCalcPoint,
  //         ACCOUNT_CURRENCY.CL,
  //         user,
  //         queryRunner,
  //       );
  //     if (isInsufficientBalance) {
  //       this.logger.error('Insufficient CL');
  //       return false;
  //     }

  //     // CL 차감
  //     const isExist = await this.accountActionService.widthdrawFromPoint(
  //       queryRunner,
  //       tmpCalcPoint,
  //       ACCOUNT_CURRENCY.CL,
  //       user,
  //     );
  //     if (!isExist) {
  //       this.logger.error('Insufficient CL');
  //       return false;
  //     }

  //     // tmp video url 생성
  //     // TDOO: 추후 Sora Service로 변경
  //     const tmpVideoUrl = await this.pexelService.getVideoUrl(
  //       createPromptDto.width,
  //       createPromptDto.height,
  //     );
  //     createPromptDto.apiResponseBody = "{'videoUrl': '" + tmpVideoUrl + "'}";

  //     // Prompt History 생성
  //     const newPromptHistory = await this.promptHistoryService.create(
  //       createPromptDto,
  //       user,
  //     );

  //     // 영상 저장 및 Watermark 적용
  //     const convertVideo = await this.videoActionService.create(
  //       tmpVideoUrl,
  //       user,
  //     );

  //     this.logger.log('Success to execute prompt');

  //     return {
  //       question: newPromptHistory.question,
  //       answer: newPromptHistory.answer,
  //       ...convertVideo,
  //     };
  //   } catch (e) {
  //     await queryRunner.rollbackTransaction();
  //     this.logger.error(e);
  //   } finally {
  //     if (!queryRunner.isReleased) {
  //       await queryRunner.release();
  //     }
  //   }
  // }

  list(marketSearchDto: any, page, limit) {
    // Prompt History 조회
  }
}
