import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Logger,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PromptActionService } from '../../services/prompt/prompt-action.service';
import { ApiHttpException } from '../../common/response/response-exception.filter';
import { AppApiAuthGuard } from '../app.auth.guard';
import { Request } from 'express';
import { PromptDto } from '../../dto/prompt.dto';
import { UserEntity } from '../../entities/user.entity';
import { RESPONSE_CODE } from '../../constant';
import { AppDaemonService } from '../../services/daemon/app-daemon.service';
import { DaemonRawVideoDto } from '../../dto/video.dto';
import { VideoActionService } from '../../services/video/video-action.service';
import { ConfigService } from '@nestjs/config';

@Controller('/api/v1/prompt')
@UseGuards(AppApiAuthGuard)
export class ApiPromptController {
  private readonly logger = new Logger(ApiPromptController.name);
  private readonly videoTransformInQueueUrl: string;

  constructor(
    private readonly videoActionService: VideoActionService,
    private readonly promptActionService: PromptActionService,
    private readonly appDaemonService: AppDaemonService,
    private readonly configService: ConfigService,
  ) {
    this.videoTransformInQueueUrl = this.configService.get<string>(
      'AWS_SQS_VIDEO_TRANSFORM_IN_QUEUE_URL',
    );
  }

  @Get('/list')
  async list() {
    try {
      //   const promptList = await this.promptActionService.list();
      return 'promptList';
    } catch (err) {
      this.logger.error(err);
      throw new ApiHttpException(
        err.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // TODO: 수정 필요(message 값 제대로 되지도 않고 있음)
  @Post('/execute')
  async execute(@Req() @Req() req: Request, @Body() promptDto: PromptDto) {
    try {
      const user = req.user as UserEntity;

      // token 계산
      const isExist = await this.promptActionService.prepare(user);
      if (!isExist) {
        throw new ApiHttpException(
          RESPONSE_CODE.USER_INSUFFICIENT_CL,
          HttpStatus.UNAUTHORIZED,
        );
      }

      const rawVideoMeesage = {
        userId: user.id,
        ...promptDto,
      };

      // aws sqs producer.send
      const messgeId = await this.appDaemonService.send(
        this.videoTransformInQueueUrl,
        rawVideoMeesage,
      );
      if (!messgeId) {
        throw new ApiHttpException(
          RESPONSE_CODE.MESSAGE_QUEUE_VIDEO_ERROR,
          HttpStatus.UNAUTHORIZED,
        );
      }

      return {
        messageId: messgeId,
      };
    } catch (err) {
      this.logger.error(err);
      throw new ApiHttpException(
        err.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('/ready')
  async ready(@Req() req: Request, @Body() videoDto: DaemonRawVideoDto) {
    try {
      const user = req.user as UserEntity;
      const isExist = this.appDaemonService.isExist(videoDto.commandUUID);

      // 처리 완료 상태
      if (!isExist) {
        // raw video 조회
        const rawVideo =
          await this.videoActionService.getEntityByUserIdAndCommandUUID(
            user.id,
            videoDto.commandUUID,
          );

        if (!rawVideo) {
          throw new ApiHttpException(
            RESPONSE_CODE.USER_IS_EXIST_VIDEO,
            HttpStatus.UNAUTHORIZED,
          );
        }

        return {
          ...rawVideo,
          status: 'complete',
        };
      } else {
        return {
          status: 'loading',
        };
      }
    } catch (err) {
      this.logger.error(err);
      throw new ApiHttpException(
        err.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // TODO: Sora 추가시 수정 필요
  @Get('/option')
  async option() {
    try {
      //   const promptList = await this.promptActionService.list();
      return 'promptList';
    } catch (err) {
      this.logger.error(err);
      throw new ApiHttpException(
        err.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
