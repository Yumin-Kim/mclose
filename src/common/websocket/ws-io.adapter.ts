/**
 * Description: WS adapter for socket.io
 * 아래 코드는 Socket을 커스텀 하기 위해 사용한다.
 * 현 프로젝트는 HTTP 서버와 WS 서버를 분리하여 사용하지 않기 때문에 Adapter를 사용하지 않아도 된다.(동작하지 않는다.)
 * [Nest] 89728  - 08/03/2024, 5:49:27 PM   ERROR [NestApplication] Error: listen EADDRINUSE: address already in use :::3000 +0ms
 * HTTP 서버에서 오류를 발생한다(DI 순서상 WS 서버가 먼저 생성되어야 하는데 HTTP 서버가 먼저 생성되어서 발생하는 오류)
 * 별도 포트를 사용하여 Socket 개발시 아래 코드를 사용한다.
 */
import { IoAdapter } from '@nestjs/platform-socket.io';
import { INestApplicationContext, Logger } from '@nestjs/common';
import { ServerOptions } from 'socket.io';
import { Server } from 'http';
import { ConfigService } from '@nestjs/config';

export class WsAdapter extends IoAdapter {
  private readonly logger = new Logger(WsAdapter.name);

  constructor(
    private app: INestApplicationContext,
    private configService: ConfigService,
  ) {
    super(app);
  }

  createIOServer(port: number, options?: ServerOptions): any {
    port = this.configService.get<number>('PORT') || 3000;
    const path =
      this.configService.get<string>('SOCKETIO.SERVER.PATH') || '/stream';
    // const origins = this.configService.get<string>(
    //   'SOCKETIO.SERVER.CORS.ORIGIN',
    // );
    // const origin = origins.split(',');
    options.path = path;
    // options.cors = { origin };

    this.logger.log(
      '========================Creating WS server========================',
    );
    this.logger.log('Port: ' + port);
    this.logger.log('Options: ' + JSON.stringify(options));
    this.logger.log(
      '===============================================================',
    );
    const server = super.createIOServer(port, options);
    return server;
  }

  bindClientConnect(server: any, callback: (...args: any[]) => void) {
    server.on('connection', callback);
  }

  bindClientDisconnect(client: any, callback: (...args: any[]) => void) {
    client.on('disconnect', callback);
  }

  bindMessageHandler(client: any, handler: (...args: any[]) => void) {
    client.on('message', handler);
  }

  bindMessageHandlerWithAck(client: any, handler: (...args: any[]) => void) {
    client.on('message', handler);
  }

  bindErrorHandler(client: any, handler: (...args: any[]) => void) {
    client.on('error', handler);
  }

  bindPacketHandler(client: any, handler: (...args: any[]) => void) {
    client.on('packet', handler);
  }

  bindDisconnect(client: any, handler: (...args: any[]) => void) {
    client.on('disconnect', handler);
  }

  bindClose(client: any, handler: (...args: any[]) => void) {
    client.on('close', handler);
  }
}
