import { Module, ValidationPipe } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { HealthCheckController } from '../common/health-check/health-check.controller';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { DatabaseOptionsModule } from '../common/database/database.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmOptiosSerivce } from '../common/database/typeorm.options.service';
import { LoggingInterceptor } from '../common/logger/logger.interceptor';
import { ResponseApiInteceptor } from '../common/response/response.interceptor';
import { TypeOrmDynamicModule } from '../common/database/typeorm-dynamic.module';
import { RenderService } from '../services/render.service';
import { FfmpegModule } from '../common/ffmpeg/ffmpeg.module';
import { AccountEntity } from '../entities/account.entity';
import { AccountHistoryEntity } from '../entities/account-history.entity';
import { UserEntity } from '../entities/user.entity';
import { AccountService } from '../services/account.service';
import { AccountHistoryService } from '../services/account-history.service';
import { MarketItemEntity } from '../entities/market-item.entity';
import { MarketActionService } from '../services/market/market-action.service';
import { MarketItemService } from '../services/market/market-item.service';
import { UserRepository } from '../repositories/user.repository';
import { AccountRepository } from '../repositories/account.repository';
import { AccountHistoryRepository } from '../repositories/account-history.repository';
import { MarketItemRepository } from '../repositories/market-item.repository';
import { PromptHistoryRepository } from '../repositories/prompt-history.repository';
import { RawVideoRepository } from '../repositories/raw-video.repository';
import { UserService } from '../services/user.service';
import { MarketHistoryService } from '../services/market/market-history.service';
import { PexelService } from '../services/pexel-service';
import { AccountActionService } from '../services/account-action.service';
import { PromptActionService } from '../services/prompt/prompt-action.service';
import { PromptHistoryService } from '../services/prompt/prompt-history.service';
import { VideoActionService } from '../services/video/video-action.service';
import { PromptHistoryEntity } from '../entities/prompt-history.entity';
import { RawVideoEntity } from '../entities/raw-video.entity';
import { AuthModule } from '../common/auth/auth.module';
import { ApiUserController } from './api/api-user.controller';
import { ApiPromptController } from './api/api-prompt.controller';
import { CommonService } from '../services/common.service';
import { ApiMarketController } from './api/api-market.controller';
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
import { AdminEntity } from '../entities/admin.entity';
import { PortoneService } from '../services/portone.service';
import { ApiPaymentController } from './api/api-payment.controller';
import { PaymentService } from '../services/payment.service';
import { StockGatewayService } from '../services/stock/stock-gateway.service';
import { AppDaemonService } from '../services/daemon/app-daemon.service';
import { AwsSqsModule } from '../common/aws/sqs/aws-sqs.module';
import { VideoDaemonService } from '../services/daemon/video-daemon.service';
import { ApiWorkspaceController } from './api/api-workspace.controller';
import { MarketLikeEntity } from '../entities/market-like.entity';
import { AwsS3Module } from '../common/aws/s3/aws-s3.module';
import { ApiStockController } from './api/api-stock.controller';
import { StockAccountService } from '../services/stock/stock-account.service';
import { StockActionService } from '../services/stock/stock-action.service';
import { StockItemService } from '../services/stock/stock-item.service';
import { MatchingDaemonService } from '../services/daemon/matching-daemon.service';
import { TransactionActionService } from '../services/transaction-action.service';
import { ApiProfileController } from './api/api-profile.controller';
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
import { ApiSupportController } from './api/api-support.controller';
import { SupportActionService } from '../services/support-action.service';
import { AppScheduleService } from '../services/schedule.service';
import { ScheduleModule } from '@nestjs/schedule';
import { MarketProfitPayoutHistoryEntity } from '../entities/market-profit-payout-history.entity';
import { MarketProfitPayoutHistoryRespository } from '../repositories/market-profit-payout-history.repository';
import { AwsSesService } from '../common/aws/ses/aws-ses.service';
import { StockMatchService } from '../services/stock/stock-match.service';
import { AdminRepository } from '../repositories/admin.repository';

const injectControllerList = [
  ApiSupportController,
  ApiProfileController,
  ApiUserController,
  ApiPromptController,
  ApiMarketController,
  ApiPaymentController,
  ApiWorkspaceController,
  ApiStockController,
];
const injectServiceList = [
  SupportActionService,
  TransactionActionService,
  StockItemService,
  StockMatchService,
  StockActionService,
  MatchingDaemonService,
  VideoDaemonService,
  AppDaemonService,
  StockGatewayService,
  RenderService,
  UserService,
  AccountService,
  AccountHistoryService,
  MarketActionService,
  MarketItemService,
  MarketHistoryService,
  PexelService,
  AccountActionService,
  PromptActionService,
  PromptHistoryService,
  VideoActionService,
  PortoneService,
  PaymentService,
  StockAccountService,
  AppScheduleService,
];
const injectEntityList = [
  AccountEntity,
  AccountHistoryEntity,
  MarketCartEntity,
  PromptHistoryEntity,
  RawVideoEntity,
  UserEntity,
  MarketHistoryEntity,
  MarketItemEntity,
  AdminEntity,
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
const injectRepositoryList = [
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
    useClass: ValidationPipe,
    provide: APP_PIPE,
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
    // task scheduler
    ScheduleModule.forRoot(),
    // Inject entity
    TypeOrmModule.forFeature(injectEntityList),
    // Inject entity repository
    TypeOrmDynamicModule.forCustomRepository(injectRepositoryList),
    // Inject common Moudle
    FfmpegModule,
    AuthModule,
    AwsSqsModule,
    AwsS3Module,
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
export class AppModule {}
