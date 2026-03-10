/**
 * Description: Websocket gateway service for handling websocket connections.
 */
import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketServer,
  WsResponse,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

export class WsGatewayService
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  private readonly log = new Logger(WsGatewayService.name);
  @WebSocketServer() io: Server;

  constructor() {
    this.log.log('StockGatewayService created');
  }

  afterInit() {}

  handleConnection(client: any, ...args: any[]) {
    const { sockets } = this.io.sockets;
    // console.log(client.handshake);
    this.log.log('============================================');
    this.log.log('Client connected ' + client.id);
    this.log.log('Client address ' + client.handshake.address);
    this.log.log('Client url ' + client.handshake.url);
    this.log.log('Number of clients ' + sockets.size);
    this.log.log('============================================');
  }

  handleDisconnect(client: any) {
    this.log.log('Client disconnected ' + client.id);
  }

  @SubscribeMessage('ping')
  handleMessage(
    @MessageBody() data: string,
    @ConnectedSocket() socket,
  ): WsResponse<string> {
    return { event: 'pong', data: 'pong' };
  }

  close() {
    this.io.close();
  }
}
