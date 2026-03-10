// Entity를 기준으로 migration 파일을 생성한다.
// migration:create => migration 파일 생성(query 직접 작성)
// migration:generate => migration 파일 생성(query 작성됨 -entity , table 변경 반영 쿼리 작성)
// migration:run => migration 파일 실행
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';

config();

const configService = new ConfigService();

export default new DataSource({
  type: 'mysql',
  host: configService.get('DB_HOST'),
  port: configService.get<number>('DB_PORT'),
  username: configService.get('DB_USER'),
  password: configService.get('DB_PASSWORD'),
  database: configService.get('DB_NAME'),
  synchronize: false,
  entities: ['src/entities/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
  migrationsTableName: 'migrations',
});
