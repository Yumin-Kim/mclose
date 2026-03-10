import { Injectable } from '@nestjs/common';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

@Injectable()
export class TypeOrmOptiosSerivce {
  constructor(private readonly configService: ConfigService) {}

  createOptions(entityDir: string): TypeOrmModuleOptions {
    const env = process.env.NODE_ENV || 'development';

    let databaseSync: boolean, logging: boolean;

    const host = this.configService.get<string>('DB_HOST');
    const port = this.configService.get<string>('DB_PORT');
    const username = this.configService.get<string>('DB_USER');
    const password = this.configService.get<string>('DB_PASSWORD');
    const database = this.configService.get<string>('DB_NAME');
    // production 환경에서는 synchronize를 false로 해야 함
    if (env !== 'production') {
      databaseSync = true;
      logging = true;
    }

    // spec : https://github.com/mysqljs/mysql#connection-options
    const typeOrmOptions: TypeOrmModuleOptions = {
      type: 'mysql',
      host,
      port: Number.parseInt(port, 10),
      username,
      password,
      database,
      // timezone Aisa/Seoul -> mysql 8.0 이상일 경우 추가
      timezone: 'Asia/Seoul',
      logging,
      entities: [entityDir],
      extra: {
        connectionLimit: 10,
        authPlugins: 'mysql_clear_password', // mysql 8.0 이상일 경우 추가
        // options: '-c timezone=Aisa/Seoul',
      },
      synchronize: databaseSync, // entity -> table sync
      namingStrategy: new SnakeNamingStrategy(), // snake_case
    };

    return typeOrmOptions;
  }
}
