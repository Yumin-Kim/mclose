import { Module, ValidationPipe } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { HealthCheckController } from '../common/health-check/health-check.controller';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { DatabaseOptionsModule } from '../common/database/database.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmOptiosSerivce } from '../common/database/typeorm.options.service';
import { TypeOrmDynamicModule } from '../common/database/typeorm-dynamic.module';
import { AdminEntity } from '../entities/admin.entity';
import { AdminRepository } from '../repositories/admin.repository';
import { ApiAdminController } from './api/api-admin.controller';
import { AdminService } from '../services/admin/admin.service';
import { AdminUserService } from '../services/admin/admin-user.service';
import { AdminPaymentService } from '../services/admin/admin-payment.service';
import { AdminStockService } from '../services/admin/admin-stock.service';
import { AdminSupportService } from '../services/admin/admin-support.service';
import { AdminMarketService } from '../services/admin/admin-market.service';
import { AuthModule } from '../common/auth/auth.module';
import { CommonService } from '../services/common.service';
import { LoggingInterceptor } from '../common/logger/logger.interceptor';
import { ResponseApiInteceptor } from '../common/response/response.interceptor';

import { BaseService } from '../services/admin/base.service';
import { AwsS3Module } from '../common/aws/s3/aws-s3.module';
import { AdminScheduleService } from '../services/admin/admin-schedule.service';
import { AwsSesModule } from '../common/aws/ses/aws-ses.module';
import { ScheduleModule } from '@nestjs/schedule';

import { AccountEntity } from '../entities/account.entity';
import { AccountHistoryEntity } from '../entities/account-history.entity';
import { UserEntity } from '../entities/user.entity';
import { MarketItemEntity } from '../entities/market-item.entity';
import { PromptHistoryEntity } from '../entities/prompt-history.entity';
import { RawVideoEntity } from '../entities/raw-video.entity';
import { MarketCartEntity } from '../entities/market-cart.entity';
import { MarketHistoryEntity } from '../entities/market-history.entity';
import { OutflowHistoryEntity } from '../entities/outflow-history.entity';
import { PaymentHistoryEntity } from '../entities/payment-history.entity';
import { StockAccountEntity } from '../entities/stock-account.entity';
import { StockItemEntity } from '../entities/stock-item.entity';
import { StockMatchEntity } from '../entities/stock-match.entity';
import { StockOrderEntity } from '../entities/stock-order.entity';
import { StockOrderLiveEntity } from '../entities/stock-order-live.entity';
import { SupportBussinessEntity } from '../entities/support-bussiness.entity';
import { SupportCustomerEntity } from '../entities/support-customer.entity';
import { UserMemoEntity } from '../entities/user-memo.entity';
import { MarketLikeEntity } from '../entities/market-like.entity';
import { MarketProfitPayoutHistoryEntity } from '../entities/market-profit-payout-history.entity';

import { UserRepository } from '../repositories/user.repository';
import { AccountRepository } from '../repositories/account.repository';
import { AccountHistoryRepository } from '../repositories/account-history.repository';
import { MarketItemRepository } from '../repositories/market-item.repository';
import { PromptHistoryRepository } from '../repositories/prompt-history.repository';
import { RawVideoRepository } from '../repositories/raw-video.repository';
import { PaymentHistoryRepository } from '../repositories/payment-history.repository';
import { MarketCartRepository } from '../repositories/market-cart.repository';
import { MarketLikeRepository } from '../repositories/market-like.repository';
import { StockAccountRepository } from '../repositories/stock-account.repository';
import { StockItemRepository } from '../repositories/stock-item.repository';
import { StockOrderLiveRepository } from '../repositories/stock-order-live.repository';
import { StockOrderRepository } from '../repositories/stock-order.repository';
import { MarketHistoryRepository } from '../repositories/market-history.repository';
import { StockMatchRepository } from '../repositories/stock-match.repository';
import { UsageHistoryRepository } from '../repositories/usage-history.repository';
import { OutflowHistoryEntityRepository } from '../repositories/outflow-history.repository';
import { SupportFaqRepository } from '../repositories/support-faq.repository';
import { SupportBussinessRepository } from '../repositories/support-business.repository';
import { SupportCustomerRepository } from '../repositories/support-customer.repository';
import { MarketProfitPayoutHistoryRespository } from '../repositories/market-profit-payout-history.repository';
import { AwsSesService } from '../common/aws/ses/aws-ses.service';
import { ApiAdminUserController } from './api/api-admin-user.controller';
import { ApiAdminMarketController } from './api/api-admin-market.controller';
import { ApiAdminPaymentController } from './api/api-admin-payment.controller';
import { ApiAdminStockController } from './api/api-admin-stock.controller';
import { ApiAdminSupportController } from './api/api-admin-support.controller';
import { ApiAdminPromptController } from './api/api-admin-prompt.controller';
import { UserMemoRepository } from '../repositories/user-memo.repository';
import { AdminDaemonService } from '../services/daemon/admin-daemon.service';
import { AwsSqsModule } from '../common/aws/sqs/aws-sqs.module';
import { AccountService } from '../services/account.service';
import { AccountHistoryService } from '../services/account-history.service';

const injectCommonModuleList = [AuthModule, AwsS3Module, AwsSesModule, AwsSqsModule];
const injectControllerList = [
  ApiAdminController,
  ApiAdminUserController,
  ApiAdminMarketController,
  ApiAdminPaymentController,
  ApiAdminStockController,
  ApiAdminSupportController,
  ApiAdminPromptController,
];
const injectServiceList = [
  AdminDaemonService,
  AdminUserService,
  AdminService,
  CommonService,
  BaseService,
  AdminScheduleService,
  AdminPaymentService,
  AdminStockService,
  AdminSupportService,
  AdminMarketService,
  AccountService,
  AccountHistoryService
];
const injectEntityList = [
  AdminEntity,
  AccountEntity,
  AccountHistoryEntity,
  MarketCartEntity,
  PromptHistoryEntity,
  RawVideoEntity,
  UserEntity,
  MarketHistoryEntity,
  MarketItemEntity,
  OutflowHistoryEntity,
  PaymentHistoryEntity,
  StockAccountEntity,
  StockItemEntity,
  StockMatchEntity,
  StockOrderEntity,
  StockOrderLiveEntity,
  SupportBussinessEntity,
  SupportCustomerEntity,
  UserMemoEntity,
  MarketLikeEntity,
  MarketProfitPayoutHistoryEntity,
];
const inejctRepositoryList = [
  AdminRepository,
  SupportCustomerRepository,
  SupportBussinessRepository,
  SupportFaqRepository,
  OutflowHistoryEntityRepository,
  UsageHistoryRepository,
  StockMatchRepository,
  MarketHistoryRepository,
  StockOrderRepository,
  StockOrderLiveRepository,
  StockItemRepository,
  StockAccountRepository,
  AccountRepository,
  AccountHistoryRepository,
  UserRepository,
  MarketItemRepository,
  MarketCartRepository,
  MarketLikeRepository,
  PromptHistoryRepository,
  RawVideoRepository,
  PaymentHistoryRepository,
  MarketProfitPayoutHistoryRespository,
  UserMemoRepository,
];
const commonServiceList = [
  {
    provide: APP_INTERCEPTOR,
    useClass: ResponseApiInteceptor,
  },
  {
    provide: APP_INTERCEPTOR,
    useClass: LoggingInterceptor,
  },
  {
    provide: APP_PIPE,
    useClass: ValidationPipe,
  },
  CommonService,
  AwsSesService,
];

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, './public'),
      renderPath: '/', // render match path
    }),
    // Global configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.' + process.env.NODE_ENV, '.env'], // If a variable is found in multiple files, the first one takes precedence.
    }),
    // Database configuration
    DatabaseOptionsModule,
    // spec: forRoot 하드 코딩하는 경우 vs forRootAsync() Injection인 경우
    TypeOrmModule.forRootAsync({
      imports: [DatabaseOptionsModule],
      inject: [TypeOrmOptiosSerivce],
      useFactory: (typeOrmOptionsService: TypeOrmOptiosSerivce) =>
        typeOrmOptionsService.createOptions(
          join(__dirname, '../entities/*.entity{.ts,.js}'),
        ),
    }),
    // Task scheduling
    ScheduleModule.forRoot(),
    // Inject entity
    TypeOrmModule.forFeature(injectEntityList),
    // Inject entity repository
    TypeOrmDynamicModule.forCustomRepository(inejctRepositoryList),
    ...injectCommonModuleList,
  ],
  controllers: [HealthCheckController, ...injectControllerList],
  providers: [
    ...injectServiceList,
    ...commonServiceList,
    {
      // global option for validation pipe
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
  ],
})
export class AdminModule { }
