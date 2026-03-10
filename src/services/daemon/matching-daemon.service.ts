import { Injectable, Logger } from '@nestjs/common';
import { SqsConsumerService } from '../../common/aws/sqs/sqs-consumer.service';
import {
  AWS_SQS_GROUP_ID,
  RESPONSE_CODE,
  STOCK_EVENT,
  STOCK_MESSAGE_TYPE,
  STOCK_ORDER_TYPE,
} from '../../constant';
import { DaemonOrderDto, StockMatchDto } from '../../dto/stock.dto';
import { SqsProducerService } from '../../common/aws/sqs/sqs-producer.service';
import { StockActionService } from '../stock/stock-action.service';
import { UserService } from '../user.service';
import { StockMatchService } from '../stock/stock-match.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MatchingDaemonService {
  private readonly logger = new Logger(MatchingDaemonService.name);
  private readonly stockMatchingInQueueUrl: string;
  private readonly stockMatchingOutQueueUrl: string;
  private readonly stockGatewayQueueUrl: string;

  constructor(
    private readonly sqsConsumerService: SqsConsumerService,
    private readonly sqsProducerService: SqsProducerService,
    private readonly stockMatchService: StockMatchService,
    private readonly stockActionService: StockActionService,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {
    this.stockMatchingInQueueUrl = this.configService.get<string>(
      'AWS_SQS_STOCK_MATCHING_IN_FIFO_QUEUE_URL',
    );
    this.stockMatchingOutQueueUrl = this.configService.get<string>(
      'AWS_SQS_STOCK_MATCHING_OUT_FIFO_QUEUE_URL',
    );
    this.stockGatewayQueueUrl = this.configService.get<string>(
      'AWS_SQS_STOCK_GATEWAY_QUEUE_URL',
    );
    this.init();
    this.flush();
  }

  init() {
    try {
      this.logger.log('Matching daemon initialized');

      // DI를 통해 주입받은 SqsConsumerService를 통해 메시지 큐를 구독합니다.
      this.execute();
    } catch (error) {
      this.logger.error('Failed to initialize Matching daemon');
      console.log(error);
    }
  }

  flush() {
    setTimeout(async () => {
      this.logger.log('Flush MATCHING OUT QUEUE');
      await this.sqsConsumerService.flush(this.stockMatchingOutQueueUrl, 10);

      const isNotEmptyOutQueue = await this.sqsConsumerService.consume(
        this.stockMatchingOutQueueUrl,
        () => {},
        true,
      );

      if (isNotEmptyOutQueue) {
        this.logger.warn('MATCHING OUT QUEUE is not empty');
        this.logger.warn('Retry to flush MATCHING OUT QUEUE');
        this.flush();
      } else {
        this.logger.log('MATCHING OUT QUEUE is empty');
      }
    }, 1000);
  }

  execute() {
    try {
      this.logger.log(
        'Matching daemon is running. Waiting for message from queue...',
      );

      this.sqsConsumerService.batchConsume(
        this.stockMatchingInQueueUrl,
        async (messageList: DaemonOrderDto[]) => {
          for (const message of messageList) {
            const { commandUUID, type, userId } = message;
            let result = null;

            const user = await this.userService.getEntityById(userId);
            if (!user) {
              this.logger.error(
                `MATCHING DAEMON: User not found: userId ${userId}`,
              );
              // TODO: 에러 처리
              result = {
                ...message,
                retCode: RESPONSE_CODE.USER_NOT_FOUND,
              };
            }

            if (message.volume) {
              message.volume = Number(message.volume);
            }
            if (message.amount) {
              message.amount = Number(message.amount);
            }

            this.logger.log(
              `MATCHING DAEMON:received message : commandUUID: ${commandUUID} | type: ${type} | userId: ${userId}`,
            );

            if (!result) {
              switch (type) {
                // [START] 매수 주문 ------------------------------------------
                case STOCK_MESSAGE_TYPE.BUY:
                  result = await this.stockMatchService.matchingOrder(
                    message,
                    STOCK_ORDER_TYPE.SELL,
                    STOCK_ORDER_TYPE.BUY,
                  );
                  break;
                // [END] 매수 주문
                // [START] 매도 주문 ------------------------------------------
                case STOCK_MESSAGE_TYPE.SELL:
                  result = await this.stockMatchService.matchingOrder(
                    message,
                    STOCK_ORDER_TYPE.BUY,
                    STOCK_ORDER_TYPE.SELL,
                  );
                  break;
                // [END] 매도 주문
                // [START] 매수 주문 수정 ------------------------------------------
                case STOCK_MESSAGE_TYPE.MODIFY_BUY:
                  // 기존 주문 취소 및 수정
                  result = await this.stockMatchService.modifyOrder(
                    message,
                    STOCK_ORDER_TYPE.BUY,
                  );

                  // 주문이 생성 또는 수정되었을 경우 매칭
                  if (result.isOpenOrder) {
                    result = await this.stockMatchService.matchingOrder(
                      message,
                      STOCK_ORDER_TYPE.SELL,
                      STOCK_ORDER_TYPE.BUY,
                      true,
                    );
                  }
                  break;
                // [END] 매수 주문 수정
                // [START] 매도 주문 수정 ------------------------------------------
                case STOCK_MESSAGE_TYPE.MODIFY_SELL:
                  // 기존 주문 취소 및 수정
                  result = await this.stockMatchService.modifyOrder(
                    message,
                    STOCK_ORDER_TYPE.SELL,
                  );

                  // 주문이 생성 또는 수정되었을 경우 매칭
                  if (result.isOpenOrder) {
                    result = await this.stockMatchService.matchingOrder(
                      message,
                      STOCK_ORDER_TYPE.BUY,
                      STOCK_ORDER_TYPE.SELL,
                      true,
                    );
                  }

                  break;
                // [END] 매도 주문 수정
                // [START] 주문 취소 ------------------------------------------
                case STOCK_MESSAGE_TYPE.CANCEL:
                  result = await this.stockMatchService.cancelOrder(message);
                  break;
                // [END] 주문 취소
                // [START] 주문 삭제 ------------------------------------------
                case STOCK_MESSAGE_TYPE.DELETE:
                  result = await this.stockMatchService.delete(message as any);
                  break;
                // [END] 주문 삭제
                // [START] 지분 마켓 아이템 숨길 처리로 인한 주문 삭제 ------------------------------------------
                case STOCK_MESSAGE_TYPE.HIDE_ITEM:
                  result = await this.stockMatchService.hideItem(
                    message as any,
                  );
                  break;
                // [END] 지분 마켓 아이템 숨길 처리로 인한 주문 삭제
                default:
                  this.logger.error(`Invalid order type: ${type}`);
                  result = {
                    ...message,
                    retCode: RESPONSE_CODE.STOCK_MATCHING_INVAILD_PARAMETER,
                  };
                  break;
              }
            }

            // 체결 정보 전송
            await this.sqsProducerService.produce(
              this.stockMatchingOutQueueUrl,
              result,
              AWS_SQS_GROUP_ID.STOCK_MATCH,
            );

            // 체결 완료시 개개인 메시지 전송
            if (result.matchHistory && result.matchHistory.length > 0) {
              const matchList = result.matchHistory as StockMatchDto[];

              const aggregated =
                this.stockActionService.filteringMathcingOrder(matchList);

              await this.sqsProducerService.produce(
                this.stockGatewayQueueUrl,
                {
                  eventName: STOCK_EVENT.MATCH,
                  data: {
                    stockId: Number(message.id),
                    matchList: aggregated,
                  },
                },
                null,
              );
            }
          }
        },
      );
    } catch (error) {
      this.logger.error('Failed to execute Matching daemon');
      console.log(error);
      // TODO: 에러 처리
    } finally {
      this.logger.log("Matching daemon's next execution scheduled");
      // setTimeout(() => {
      //   this.execute();
      // }, 1000);
    }
  }
}
