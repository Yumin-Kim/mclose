import { Injectable, Logger } from '@nestjs/common';
import { SqsConsumerService } from '../../common/aws/sqs/sqs-consumer.service';
import { SqsProducerService } from '../../common/aws/sqs/sqs-producer.service';
import { PexelService } from '../pexel-service';
import { PromptHistoryService } from '../prompt/prompt-history.service';
import { UserService } from '../user.service';
import { VideoActionService } from '../video/video-action.service';
import { DaemonRawVideoDto, RawVideoDto } from '../../dto/video.dto';
import { PromptDto } from '../../dto/prompt.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class VideoDaemonService {
  private readonly logger = new Logger(VideoDaemonService.name);
  private readonly videoTransformInQueueUrl: string;
  private readonly videoTransformOutQueueUrl: string;

  constructor(
    private readonly sqsConsumerService: SqsConsumerService,
    private readonly sqsProducerService: SqsProducerService,
    private readonly pexelService: PexelService,
    private readonly promptHistoryService: PromptHistoryService,
    private readonly userService: UserService,
    private readonly videoActionService: VideoActionService,
    private readonly configService: ConfigService,
  ) {
    this.videoTransformInQueueUrl = this.configService.get<string>(
      'AWS_SQS_VIDEO_TRANSFORM_IN_QUEUE_URL',
    );
    this.videoTransformOutQueueUrl = this.configService.get<string>(
      'AWS_SQS_VIDEO_TRANSFORM_OUT_QUEUE_URL',
    );

    this.init();
  }

  init() {
    try {
      this.logger.log('Video daemon initialized');

      // DI를 통해 주입받은 SqsConsumerService를 통해 메시지 큐를 구독합니다.
      setTimeout(() => {
        this.execute();
      }, 1000);
    } catch (error) {
      this.logger.error('Failed to initialize Vieo daemon');
      console.log(error);
    }
  }

  close() {
    this.logger.log('Vieo daemon closed');
  }

  /**
   * Execute Vieo daemon
   * description: 메시지 큐를 통해 전달 받은 데이터를 기반으로 SORA API를 호출하여 영상을 생성 및 변환 과정을 진행합니다.
   * @returns void
   */
  execute() {
    try {
      this.logger.log(
        'Video daemon is running. Waiting for message from queue...',
      );

      this.sqsConsumerService.consume(
        this.videoTransformInQueueUrl,
        (message: DaemonRawVideoDto) => {
          this.logger.log(
            `Received message from queue: commandUUID ${message.commandUUID}`,
          );

          //아래와 같이 비디오 생성 및 변환을 위한 비즈니스 로직을 작성히였고 비동기 처리를 하지 않았습니다.
          // User 정보 조회
          this.userService.getEntityById(message.userId).then(async (user) => {
            const { commandUUID } = message;
            this.logger.log(
              `Start to execute Vieo daemon for commandUUID : ${commandUUID}`,
            );
            // prepare for prompt history
            const newPrePromptyHistory =
              await this.promptHistoryService.prepare(message, user);

            // raw vidoe 데이터 생성
            const newPreRawVideo = await this.videoActionService.prepare(
              commandUUID,
              user,
              newPrePromptyHistory,
            );

            this.logger.log(
              `Prepared prompt history & Raw video | commandUUID : ${commandUUID}`,
            );

            // TODO: Sora API 호출
            const promptDto: PromptDto = {};
            const videoDto: RawVideoDto = {};
            const tmpVideoUrl = await this.pexelService.getVideoUrl(
              message.width,
              message.height,
            );
            this.logger.log(
              `Get video url from Pexel API | commandUUID : ${commandUUID}`,
            );

            promptDto.answer = message.answer;
            promptDto.apiResponseBody = "{'videoUrl': '" + tmpVideoUrl + "'}";
            promptDto.id = newPrePromptyHistory.id;

            // Prompt History complete
            await this.promptHistoryService.complete(promptDto);
            this.logger.log(
              `Completed prompt history | commandUUID ${commandUUID}`,
            );

            // 영상 저장 및 Watermark 적용
            videoDto.originVideoUrl = tmpVideoUrl;
            videoDto.id = newPreRawVideo.id;
            this.logger.log(
              `Start to transform video | commandUUID ${commandUUID}`,
            );
            await this.videoActionService.transform(videoDto, user);
            this.logger.log(
              `Completed to transform video | commandUUID ${commandUUID}`,
            );

            this.logger.log(
              `Success to execute Vieo daemon for commandUUID : ${commandUUID}`,
            );

            // 결과 메시지 전송
            await this.sqsProducerService.produce(
              this.videoTransformOutQueueUrl,
              {
                commandUUID,
                userId: user.id,
                status: 'success',
              },
            );
            this.logger.log(
              `Send message to queue: commandUUID ${commandUUID} | status: success`,
            );
          });
        },
      );
    } catch (error) {
      this.logger.error('Failed to execute Vieo daemon');
      console.log(error);
    }
  }
}
