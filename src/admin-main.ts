import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { Logger, ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import * as session from 'express-session';
import * as path from 'path';
import * as hbs from 'hbs';
import { GlobalExceptionFilter } from './common/response/response-exception.filter';
import { AdminModule } from './admin/admin.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AdminModule);
  const configService = app.get(ConfigService);
  const env: string =
    (configService.get('NODE_ENV') as string) ?? 'development';
  const port: string = (configService.get('ADMIN_PORT') as string) ?? '3000';
  const appName: string =
    (configService.get('ADMIN_NAME') as string) ?? 'APP-API';

  // response limit json size
  app.useBodyParser('json', { limit: '100mb' });
  app.useBodyParser('urlencoded', {
    extended: true,
    limit: '100mb',
  });

  // enable cors
  app.enableCors({
    origin: true,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  });

  // global option
  app.useGlobalPipes(
    new ValidationPipe({
      disableErrorMessages: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());

  // setup the view engine(hbs) and views/partials directory
  // app.setViewEngine('hbs');
  // app.setBaseViewsDir(path.join(__dirname, './views'));
  // hbs.registerPartials(path.join(__dirname, './views/partials'));

  // setup session
  app.use(
    session({
      secret: configService.get<string>('SESSION_SECRET'),
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: env === 'production',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    }),
  );

  // setup cookie
  app.use(cookieParser());

  // setup passport session
  // app.use(passport.initialize());
  // app.use(passport.session());

  app.setGlobalPrefix('/admapi/v1');

  await app.listen(port);

  const logger = new Logger(appName);
  logger.log(`==========================================================`);
  logger.log(`Environment Variable - ${env}`);
  logger.log(`==========================================================`);
  logger.log(`Http Server running on ${await app.getUrl()}`);
  logger.log(`==========================================================`);
}
bootstrap();
