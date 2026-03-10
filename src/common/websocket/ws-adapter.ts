/**
 * ws-io.adapter.ts와 동일한 이유로 사용하지 않는다.
 */
import { IoAdapter } from '@nestjs/platform-socket.io';
import {
  INestApplicationContext,
  Logger,
  WebSocketAdapter,
} from '@nestjs/common';
import { ServerOptions } from 'socket.io';
import * as WebSocket from 'ws';
import { fromEvent, mergeMap, filter } from 'rxjs';
import { EMPTY, Observable } from 'rxjs';
import { MessageMappingProperties } from '@nestjs/websockets';

export class WsAdapter implements WebSocketAdapter {
  private readonly logger = new Logger(WsAdapter.name);

  constructor(private app: INestApplicationContext) {
    this.logger.log('WsAdapter created');
  }

  create(port: number, options: any = {}): any {
    this.logger.log('Creating server...');
    this.logger.log('Port: ' + port);
    this.logger.log('Options: ' + JSON.stringify(options));
    return new WebSocket.Server({ port, ...options });
  }

  bindClientConnect(server, callback: (...args: any[]) => void) {
    this.logger.log('Binding client connect...');
    server.on('connection', callback);
  }

  bindMessageHandlers(
    client: WebSocket,
    handlers: MessageMappingProperties[],
    process: (data: any) => Observable<any>,
  ) {
    fromEvent(client, 'message')
      .pipe(
        mergeMap((data) => this.bindMessageHandler(data, handlers, process)),
        filter((result) => result),
      )
      .subscribe((response) => client.send(JSON.stringify(response)));
  }

  bindMessageHandler(
    buffer,
    handlers: MessageMappingProperties[],
    process: (data: any) => Observable<any>,
  ): Observable<any> {
    const message = JSON.parse(buffer.data);
    const messageHandler = handlers.find(
      (handler) => handler.message === message.event,
    );
    if (!messageHandler) {
      return EMPTY;
    }
    return process(messageHandler.callback(message.data));
  }

  close(server) {
    server.close();
  }
}
