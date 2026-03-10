import { Logger } from '@nestjs/common';
import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsResponse,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WsGatewayService } from '../../common/websocket/ws-gateway.service';
import { SqsConsumerService } from '../../common/aws/sqs/sqs-consumer.service';
import { STOCK_EVENT } from '../../constant';
import { StockActionService } from './stock-action.service';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  path: '/stream',
  transports: ['websocket'],
})
export class StockGatewayService extends WsGatewayService {
  @WebSocketServer() socketIO: Server;
  setInterval: any;
  private readonly logger = new Logger(StockGatewayService.name);
  private readonly fastBookContext = [];
  private readonly stockGatewayQueueUrl: string;

  constructor(
    private readonly sqsConsumerService: SqsConsumerService,
    private readonly stockActionService: StockActionService,
    private readonly configService: ConfigService,
  ) {
    super();
    this.stockGatewayQueueUrl = this.configService.get<string>(
      'AWS_SQS_STOCK_GATEWAY_QUEUE_URL',
    );
    setTimeout(() => {
      this.observe(this.stockGatewayQueueUrl);
    }, 1000);
  }

  observe(queueUrl) {
    try {
      this.logger.log(
        'Stock Gateway Daemon initialized. Waiting for messages from queue.',
      );

      this.sqsConsumerService.consume(queueUrl, (message) => {
        const { commandUUID, data, eventName } = message;
        if (eventName === STOCK_EVENT.FAST_BOOK) {
          // this.fastBookContext.push(data);
          // this.sendTickerStockDetailInfo(data.stockId);
          this.sendFastBook(data.stockId, data);
        } else if (eventName === STOCK_EVENT.MATCH) {
          this.sendMatch(data.stockId, data);
        } else if (eventName === STOCK_EVENT.HIDE_FAST_BOOK) {
          this.sendHideFaskBook(data.stockId);
        }
      });
    } catch (error) {
      this.logger.error('Failed to execute daemon');
      console.log(error);
    }
  }

  // event-fastbook
  sendFastBook(stockId: number, data: any): void {
    const { sockets } = this.socketIO.sockets;

    if (sockets.size > 0) {
      this.logger.log('============= Send event-fastbook =============');
      this.socketIO.sockets.sockets.forEach((socket) => {
        const query = socket.handshake.query;
        if (socket.connected && Number(query.stockId) === Number(stockId)) {
          return socket.emit(STOCK_EVENT.FAST_BOOK, data.fastBook);
        }
      });
    }
  }

  // ADMIN_TODO: 이벤트 전송 2025.03.24
  // ADMIN_TODO event-hide-fastbook(이벤트를 전송하여 이용자 페이지에선 알림을 제공한다.)
  sendHideFaskBook(stockId: number) {
    const { sockets } = this.socketIO.sockets;

    if (sockets.size > 0) {
      this.logger.log('============= Send event-hide-fastbook =============');
      this.socketIO.sockets.sockets.forEach((socket) => {
        const query = socket.handshake.query;
        if (socket.connected && Number(query.stockId) === Number(stockId)) {
          return socket.emit(STOCK_EVENT.HIDE_FAST_BOOK, {});
        }
      });
    }
  }

  // K_TODO: 현재는 fastbook 이벤트 consumer한 후에 ticker 이벤트를 보내는데
  // 데이터는 잔여 Volume만 보내도록 개발
  // 추후 확장 하길..
  async sendTickerStockDetailInfo(stockId: number) {
    const { sockets } = this.socketIO.sockets;

    const remainVolume =
      await this.stockActionService.getMatchingAfterRemainVolume(stockId);
    if (!remainVolume) {
      return;
    }

    if (sockets.size > 0) {
      this.logger.log('============= Send event-ticker =============');
      this.socketIO.sockets.sockets.forEach((socket) => {
        const query = socket.handshake.query;
        this.logger.log('query.stockId: ' + query.stockId);
        this.logger.log('socket.connected: ' + socket.connected);
        if (socket.connected && Number(query.stockId) === Number(stockId)) {
          return socket.emit('event-ticker', {
            remainVolume: remainVolume,
          });
        }
      });
    }
  }

  // event-match
  // K_TODO: 체결 되었을 경우 지분 상세 내역 조회 하여 client로 전달
  // 단 데이터는 최소한의 필요한 데이터만 전달
  sendMatch(stockId: number, data: any): void {
    const { sockets } = this.socketIO.sockets;
    const { matchList } = data;
    if (sockets.size > 0) {
      this.logger.log('============= Send event-match =============');

      this.socketIO.sockets.sockets.forEach((socket) => {
        const query = socket.handshake.query;

        // 로그인된 사용자에게만 전달
        if (
          socket.connected &&
          Number(query.stockId) === stockId &&
          query.userId
        ) {
          // 사용자 정보가 있는 경우에만 전달
          const { userId } = query;
          const matchUserInfo = matchList.find(
            (item) => Number(item.userId) === Number(userId),
          );

          // 체결된 내역과 동일한 사용자가 통신 중인 경우에만 전달
          if (matchUserInfo) {
            return socket.emit(STOCK_EVENT.MATCH, matchUserInfo);
          }
        }
      });
    }
  }

  test(itmeId: number): WsResponse<any> | void {
    const { sockets } = this.socketIO.sockets;

    if (sockets.size > 0) {
      this.socketIO.sockets.sockets.forEach((socket) => {
        const query = socket.handshake.query;
        if (socket.connected && Number(query.stockId) === itmeId) {
          const result = {
            stockId: query.stockId,
            price: Math.floor(Math.random() * 1000),
            amount: Math.floor(Math.random() * 1000),
            type: Math.floor(Math.random() * 2),
          };
          this.logger.log('Send event-orderbook');

          return socket.emit('event-orderbook', result);
        }
      });
    }
  }

  @SubscribeMessage('health-check')
  healthCheck(client: Socket, payload: any): void {
    this.logger.log('health-check');
    client.emit('health-check', 'pong');
  }
}
