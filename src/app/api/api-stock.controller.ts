import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Logger,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiHttpException } from '../../common/response/response-exception.filter';
import {
  ACCOUNT_CURRENCY,
  AWS_S3_BUCKET_PATH,
  BASE64_PREFIX,
  RESPONSE_CODE,
  STOCK_ORDER_MAX_VOLUME,
  STOCK_MESSAGE_TYPE,
  STOCK_ACCOUNT_MAX_REMAIN_VOLUME,
  STOCK_ORDER_TYPE,
  SORT_TYPE,
  STOCK_ACCOUNT_MAX_VOLUME,
  STOCK_EVENT,
  FASTBOOK_MODE,
} from '../../constant';
import { AppApiAuthGuard } from '../app.auth.guard';
import { Request } from 'express';
import { UserEntity } from '../../entities/user.entity';
import {
  DaemonOrderDefaultResultDto,
  DaemonOrderResultDto,
  StockItemDto,
  StockQueryDto,
} from '../../dto/stock.dto';
import { MarketItemService } from '../../services/market/market-item.service';
import { StockActionService } from '../../services/stock/stock-action.service';
import { AccountService } from '../../services/account.service';
import { AppDaemonService } from '../../services/daemon/app-daemon.service';
import { AwsS3StorageService } from '../../common/aws/s3/aws-s3-storage.service';
import { StockItemService } from '../../services/stock/stock-item.service';
import { StockAccountService } from '../../services/stock/stock-account.service';
import { StockGatewayService } from '../../services/stock/stock-gateway.service';
import { ConfigService } from '@nestjs/config';

@Controller('/api/v1/stock')
export class ApiStockController {
  private readonly logger = new Logger(ApiStockController.name);
  private readonly stockMatchingInQueueUrl: string;
  private readonly stockMatchingOutQueueUrl: string;
  private readonly stockGatewayQueueUrl: string;
  private readonly awsS3ImageBucketName: string;

  constructor(
    private readonly marketItemService: MarketItemService,
    private readonly stockActionService: StockActionService,
    private readonly stockItemService: StockItemService,
    private readonly stockAccountService: StockAccountService,
    private readonly accountService: AccountService,
    private readonly appDaemonService: AppDaemonService,
    private readonly awsS3StorageService: AwsS3StorageService,
    private readonly stockGatewayService: StockGatewayService,
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
    this.awsS3ImageBucketName = this.configService.get<string>(
      'AWS_S3_IMAGE_BUCKET_NAME',
    );
  }

  @Get('/list')
  async list(@Req() req: Request, @Query() stockQueryDto: StockQueryDto) {
    try {
      return await this.stockItemService.list(
        stockQueryDto.getOffset(),
        stockQueryDto.getLimit(),
        stockQueryDto,
      );
    } catch (err) {
      throw new ApiHttpException(
        err.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('/detail/:id')
  async detail(@Req() req: Request, @Param('id') id: number) {
    try {
      let remainingVolume = 0;
      const stockItem = await this.stockItemService.getEntityById(id);
      if (!stockItem) {
        throw new ApiHttpException(
          RESPONSE_CODE.STOCK_ITEM_NOT_FOUND,
          HttpStatus.BAD_REQUEST,
        );
      }

      const stockAccount =
        await this.stockAccountService.getEntityByUserAndStockItem(
          stockItem.user,
          stockItem,
          null,
        );
      if (!stockAccount) {
        throw new ApiHttpException(
          RESPONSE_CODE.STOCK_ACCOUNT_NOT_FOUND,
          HttpStatus.BAD_REQUEST,
        );
      }
      remainingVolume =
        Number(stockAccount.volume) - STOCK_ACCOUNT_MAX_REMAIN_VOLUME;

      // 현 주문 가능한 지분 수량 조회
      const sellOrderLiveList = await this.stockActionService.getOrderLiveList(
        stockItem,
        STOCK_ORDER_TYPE.SELL,
        SORT_TYPE.ASC,
        true,
      );
      if (sellOrderLiveList && sellOrderLiveList.length > 0) {
        const sellOrderLiveVolume = sellOrderLiveList.reduce((acc, cur) => {
          acc += Number(cur.volume);
          return acc;
        }, 0);

        remainingVolume += sellOrderLiveVolume;
      }

      const buyOrderBook = await this.stockActionService.getOrderBook(
        stockItem.id,
        STOCK_ORDER_TYPE.BUY,
        SORT_TYPE.DESC,
      );

      const sellOrderBook = await this.stockActionService.getOrderBook(
        stockItem.id,
        STOCK_ORDER_TYPE.SELL,
        SORT_TYPE.ASC,
      );

      await this.stockItemService.increaseViewCnt(stockItem);

      return {
        title: stockItem.title,
        remainingVolume,
        buyOrderBook,
        sellOrderBook,
        thumbnailUrl: stockItem.thumbnailUrl,
        watermarkVideoUrl: stockItem.rawVideo.watermarkVideoUrl,
        highPrice: stockItem.highPrice,
        lowPrice: stockItem.lowPrice,
        openPrice: stockItem.openPrice,
        marketItemId: stockAccount.marketItem.id,
        id: stockItem.id,
        name: stockItem.name,
      };
    } catch (err) {
      throw new ApiHttpException(
        err.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // K_TODO: 24.11.10 base64 requestBody 용량 이슈 발생
  @Post('/init')
  @UseGuards(AppApiAuthGuard)
  async init(@Req() req: Request, @Body() stockItemDto: StockItemDto) {
    try {
      if (
        !stockItemDto ||
        !stockItemDto.volume ||
        stockItemDto.volume <= 0 ||
        stockItemDto.volume > STOCK_ORDER_MAX_VOLUME
      ) {
        throw new ApiHttpException(
          RESPONSE_CODE.INVALID_PARAMETER,
          HttpStatus.BAD_REQUEST,
        );
      }

      // 사용자 검증
      const user = req.user as UserEntity;
      if (!user) {
        throw new ApiHttpException(
          RESPONSE_CODE.USER_NOT_FOUND,
          HttpStatus.UNAUTHORIZED,
        );
      }

      // marketItem 검증
      const marketItem = await this.marketItemService.getEntityById(
        stockItemDto.marketItemId,
      );
      if (!marketItem) {
        throw new ApiHttpException(
          RESPONSE_CODE.MARKET_NOT_FOUND,
          HttpStatus.BAD_REQUEST,
        );
      }
      if (!marketItem.isShow || marketItem.isDeleted) {
        throw new ApiHttpException(
          RESPONSE_CODE.MARKET_NOT_ACTIVE,
          HttpStatus.BAD_REQUEST,
        );
      }
      if (marketItem.user.id !== user.id) {
        throw new ApiHttpException(
          RESPONSE_CODE.MARKET_ITEM_NOT_OWNER,
          HttpStatus.BAD_REQUEST,
        );
      }

      // stockItem 중복 검증
      const stockAccount =
        await this.stockAccountService.getEntityByUserAndMarketItem(
          user,
          marketItem,
          null,
        );
      if (stockAccount) {
        throw new ApiHttpException(
          RESPONSE_CODE.STOCK_ACCOUNT_ALREADY_EXIST,
          HttpStatus.BAD_REQUEST,
        );
      }

      const { rawVideo } = marketItem;

      // upload s3
      const unixtimeFileName = Date.now().toString();
      const s3KeyPath = await this.awsS3StorageService.uploadBase64(
        this.awsS3ImageBucketName,
        AWS_S3_BUCKET_PATH.MARKET_ITEM_THUMBNAIL + '/' + unixtimeFileName,
        stockItemDto.thumbnailUrl.split(BASE64_PREFIX).pop(),
        stockItemDto.thumbnailUrl.split(';')[0].split(':')[1],
      );
      if (!s3KeyPath) {
        throw new ApiHttpException(
          RESPONSE_CODE.AWS_S3_UPLOAD_ERROR,
          HttpStatus.BAD_REQUEST,
        );
      }

      stockItemDto.thumbnailUrl = this.awsS3StorageService.getPublicUrl(
        s3KeyPath,
        this.awsS3ImageBucketName,
      );

      // initial Price = marketItem.price * 0.01 * 10
      // TODO: 환경변수로 받을지??
      stockItemDto.initialPrice = Number(marketItem.price) * 0.01 * 10;

      // stockItem 생성
      const newStockItem = await this.stockItemService.create(
        stockItemDto,
        rawVideo,
        user,
      );
      if (!newStockItem) {
        throw new ApiHttpException(
          RESPONSE_CODE.STOCK_CREATE_FAILED,
          HttpStatus.BAD_REQUEST,
        );
      }
      await this.stockAccountService.create(user, marketItem, newStockItem);

      const isCreated = await this.stockActionService.initOrder(
        stockItemDto.volume,
        stockItemDto.initialPrice,
        user,
        newStockItem,
      );

      if (!isCreated) {
        throw new ApiHttpException(
          RESPONSE_CODE.STOCK_CREATE_FAILED,
          HttpStatus.BAD_REQUEST,
        );
      }

      return {
        ...newStockItem,
        volume: stockItemDto.volume,
      };
    } catch (err) {
      throw new ApiHttpException(
        err.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('/update')
  @UseGuards(AppApiAuthGuard)
  async updateStockItem(
    @Req() req: Request,
    @Body() stockItemDto: StockItemDto,
  ) {
    try {
      const user = req.user as UserEntity;
      if (!user) {
        throw new ApiHttpException(
          RESPONSE_CODE.USER_NOT_FOUND,
          HttpStatus.UNAUTHORIZED,
        );
      }

      const stockItem = await this.stockItemService.getEntityById(
        stockItemDto.id,
      );
      if (!stockItem) {
        throw new ApiHttpException(
          RESPONSE_CODE.STOCK_ITEM_NOT_FOUND,
          HttpStatus.BAD_REQUEST,
        );
      }
      // if (stockItem.user.id !== user.id) {
      //   throw new ApiHttpException(
      //     RESPONSE_CODE.STOCK_ITEM_NOT_OWNER,
      //     HttpStatus.BAD_REQUEST,
      //   );
      // }

      if (
        Number(stockItemDto.thumbnailStartTime) !=
        Number(stockItem.thumbnailStartTime)
      ) {
        if (stockItemDto.thumbnailUrl) {
          // upload s3
          const unixtimeFileName = Date.now().toString();
          const s3KeyPath = await this.awsS3StorageService.uploadBase64(
            this.awsS3ImageBucketName,
            AWS_S3_BUCKET_PATH.MARKET_ITEM_THUMBNAIL + '/' + unixtimeFileName,
            stockItemDto.thumbnailUrl.split(BASE64_PREFIX).pop(),
            stockItemDto.thumbnailUrl.split(';')[0].split(':')[1],
          );
          if (!s3KeyPath) {
            throw new ApiHttpException(
              RESPONSE_CODE.AWS_S3_UPLOAD_ERROR,
              HttpStatus.BAD_REQUEST,
            );
          }
          stockItemDto.thumbnailUrl = this.awsS3StorageService.getPublicUrl(
            s3KeyPath,
            this.awsS3ImageBucketName,
          );
        }
      }

      await this.stockItemService.update(stockItem, stockItemDto);

      return true;
    } catch (err) {
      throw new ApiHttpException(
        err.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('/delete')
  @UseGuards(AppApiAuthGuard)
  async deleteStockItem(@Req() req: Request, @Body() stockItemDto: any) {
    try {
      const user = req.user as UserEntity;
      if (!user) {
        throw new ApiHttpException(
          RESPONSE_CODE.USER_NOT_FOUND,
          HttpStatus.UNAUTHORIZED,
        );
      }

      const stockItem = await this.stockItemService.getEntityById(
        stockItemDto.id,
      );
      if (!stockItem) {
        throw new ApiHttpException(
          RESPONSE_CODE.STOCK_ITEM_NOT_FOUND,
          HttpStatus.BAD_REQUEST,
        );
      }

      // 현 배분된 지분 조회
      const stockAccount =
        await this.stockAccountService.getEntityByUserAndStockItem(
          user,
          stockItem,
          null,
        );

      if (!stockAccount) {
        throw new ApiHttpException(
          RESPONSE_CODE.STOCK_ACCOUNT_NOT_FOUND,
          HttpStatus.BAD_REQUEST,
        );
      }
      if (Number(stockAccount.volume) != STOCK_ACCOUNT_MAX_VOLUME) {
        throw new ApiHttpException(
          RESPONSE_CODE.STOCK_ACCOUNT_NOT_MAX_VOLUME,
          HttpStatus.BAD_REQUEST,
        );
      }

      // SEND MESSAGE QUEUE
      const message = {
        type: STOCK_MESSAGE_TYPE.DELETE,
        id: stockItem.id,
        stockAccountId: stockAccount.id,
        userId: user.id,
      };
      const defferedResult =
        await this.appDaemonService.defferedResult<DaemonOrderDefaultResultDto>(
          this.stockMatchingInQueueUrl,
          this.stockMatchingOutQueueUrl,
          message,
          async (data) => {
            return data;
          },
        );

      if (!defferedResult) {
        throw new ApiHttpException(
          RESPONSE_CODE.MESSAGE_QUEUE_ERROR,
          HttpStatus.BAD_REQUEST,
        );
      }
      if (defferedResult.retCode !== RESPONSE_CODE.SUCCESS) {
        throw new ApiHttpException(
          defferedResult.retCode,
          HttpStatus.BAD_REQUEST,
        );
      }

      return true;
    } catch (err) {
      throw new ApiHttpException(
        err.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('/buy')
  @UseGuards(AppApiAuthGuard)
  async buy(@Req() req: Request, @Body() stockDto: any) {
    try {
      const { volume, amount, id } = stockDto;
      if (
        Number(volume) > STOCK_ORDER_MAX_VOLUME ||
        Number(volume) <= 0 ||
        amount <= 0
      ) {
        throw new ApiHttpException(
          RESPONSE_CODE.INVALID_PARAMETER,
          HttpStatus.BAD_REQUEST,
        );
      }

      // 사용자 검증
      const user = req.user as UserEntity;
      if (!user) {
        throw new ApiHttpException(
          RESPONSE_CODE.USER_NOT_FOUND,
          HttpStatus.UNAUTHORIZED,
        );
      }

      // stock Item 검증
      const stockItem = await this.stockItemService.getEntityById(id);
      if (!stockItem || !stockItem.isShow || stockItem.isDeleted) {
        throw new ApiHttpException(
          RESPONSE_CODE.STOCK_ITEM_NOT_FOUND,
          HttpStatus.BAD_REQUEST,
        );
      }

      // K_TODO: 24.11.10 자신의 주식을 구매할 수 있다.
      // 자신의 주식을 구매할 수 없음
      // if (stockItem.user.id === user.id) {
      //   throw new ApiHttpException(
      //     RESPONSE_CODE.STOCK_OWNER_NOT_ALLOWED,
      //     HttpStatus.BAD_REQUEST,
      //   );
      // }

      // 현 지분 검증
      const stockAccount =
        await this.stockAccountService.getEntityByUserAndStockItem(
          stockItem.user,
          stockItem,
          null,
        );
      if (!stockAccount) {
        throw new ApiHttpException(
          RESPONSE_CODE.STOCK_OWNER_ACCOUNT_NOT_FOUND,
          HttpStatus.BAD_REQUEST,
        );
      }

      // account 검증 및 잔액 확인
      const isInSufficient = await this.accountService.isInSufficientBalance(
        Number(amount) * Number(volume),
        ACCOUNT_CURRENCY.OS,
        user.id,
        null,
      );
      if (isInSufficient) {
        throw new ApiHttpException(
          RESPONSE_CODE.ACCOUNT_INSUFFICIENT_BALANCE,
          HttpStatus.BAD_REQUEST,
        );
      }

      const message = {
        type: STOCK_MESSAGE_TYPE.BUY,
        volume: Number(volume),
        amount: Number(amount),
        id,
        userId: user.id,
        marketItemId: stockAccount.marketItem.id,
      };
      const defferedResult =
        await this.appDaemonService.defferedResult<DaemonOrderResultDto>(
          this.stockMatchingInQueueUrl,
          this.stockMatchingOutQueueUrl,
          message,
          async (data) => {
            // 주문 생성 또는 체결 내역 조회?? 또는 order trigger
            return data;
          },
        );

      if (!defferedResult) {
        throw new ApiHttpException(
          RESPONSE_CODE.MESSAGE_QUEUE_ERROR,
          HttpStatus.BAD_REQUEST,
        );
      }

      if (defferedResult.retCode !== RESPONSE_CODE.SUCCESS) {
        throw new ApiHttpException(
          defferedResult.retCode,
          HttpStatus.BAD_REQUEST,
        );
      }

      // Trigger fastbook for websocket
      const fastBook = await this.stockActionService.getFastbookOrderList(
        defferedResult.matchingCnt,
        defferedResult.openOrderVolume,
        stockItem.id,
        amount,
        STOCK_ORDER_TYPE.SELL,
        STOCK_ORDER_TYPE.BUY,
        FASTBOOK_MODE.CREATE,
      );

      await this.appDaemonService.sendNotCache(this.stockGatewayQueueUrl, {
        eventName: STOCK_EVENT.FAST_BOOK,
        data: {
          stockId: stockItem.id,
          fastBook,
        },
      });

      const { openOrderVolume, matchingOrderVolume, matchingCnt } =
        defferedResult;

      return {
        openOrderVolume,
        matchingOrderVolume,
        matchingCnt,
      };
    } catch (err) {
      console.log(err);

      throw new ApiHttpException(
        err.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('/sell')
  @UseGuards(AppApiAuthGuard)
  async sell(@Req() req: Request, @Body() stockDto: any) {
    try {
      const { volume, amount, id } = stockDto;
      if (
        Number(volume) > STOCK_ORDER_MAX_VOLUME ||
        Number(volume) <= 0 ||
        amount <= 0
      ) {
        throw new ApiHttpException(
          RESPONSE_CODE.INVALID_PARAMETER,
          HttpStatus.BAD_REQUEST,
        );
      }

      // 사용자 검증
      const user = req.user as UserEntity;
      if (!user) {
        throw new ApiHttpException(
          RESPONSE_CODE.USER_NOT_FOUND,
          HttpStatus.UNAUTHORIZED,
        );
      }

      // stock Item 검증
      const stockItem = await this.stockItemService.getEntityById(id);
      if (!stockItem || !stockItem.isShow || stockItem.isDeleted) {
        throw new ApiHttpException(
          RESPONSE_CODE.STOCK_ITEM_NOT_FOUND,
          HttpStatus.BAD_REQUEST,
        );
      }

      // 사용자 지분 검증
      const stockAccount =
        await this.stockAccountService.getEntityByUserAndStockItem(
          user,
          stockItem,
          null,
        );
      if (!stockAccount) {
        throw new ApiHttpException(
          RESPONSE_CODE.STOCK_ACCOUNT_NOT_FOUND,
          HttpStatus.BAD_REQUEST,
        );
      }
      // 판매 등록간 최대 보유량 검증
      if (stockAccount.user.id == stockItem.user.id) {
        const remainStockAccountVolume =
          Number(stockAccount.volume) - Number(volume);

        if (remainStockAccountVolume < STOCK_ACCOUNT_MAX_REMAIN_VOLUME) {
          throw new ApiHttpException(
            RESPONSE_CODE.STOCK_OWNER_TOO_MUCH_VOLUME,
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      // 사용자 보유 지분과 판매 진행 중인 지분 수량 비교
      const currentOrderLiveVolume =
        await this.stockActionService.sumOrderLiveVolume(
          stockItem,
          STOCK_ORDER_TYPE.SELL,
          user,
        );

      if (currentOrderLiveVolume + Number(volume) > stockAccount.volume) {
        throw new ApiHttpException(
          RESPONSE_CODE.STOCK_SELL_OVER_VOLUME,
          HttpStatus.BAD_REQUEST,
        );
      }

      // 판매 등록간 orderbook 최대 보유량 검증
      const orderBook = await this.stockActionService.getOrderBook(
        stockItem.id,
        STOCK_ORDER_TYPE.SELL,
        SORT_TYPE.ASC,
      );
      if (orderBook && orderBook.length > 0) {
        const sumVolume = orderBook.reduce((acc, cur) => {
          acc += Number(cur.volume);
          return acc;
        }, 0);
        if (sumVolume + Number(volume) > STOCK_ORDER_MAX_VOLUME) {
          throw new ApiHttpException(
            RESPONSE_CODE.STOCK_ORDER_MAX_VOLUME,
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      // 보유 지분 검증
      const isInSufficient =
        await this.stockAccountService.isInSufficientBalance(
          Number(volume),
          stockItem,
          user,
          null,
        );
      if (isInSufficient) {
        throw new ApiHttpException(
          RESPONSE_CODE.STOCK_ACCOUNT_INSUFFICIENT_VOLUME,
          HttpStatus.BAD_REQUEST,
        );
      }

      const message = {
        type: STOCK_MESSAGE_TYPE.SELL,
        volume: Number(volume),
        amount: Number(amount),
        id,
        userId: user.id,
        marketItemId: stockAccount.marketItem.id,
      };

      const defferedResult =
        await this.appDaemonService.defferedResult<DaemonOrderResultDto>(
          this.stockMatchingInQueueUrl,
          this.stockMatchingOutQueueUrl,
          message,
          async (data) => {
            // 주문 생성 또는 체결 내역 조회?? 또는 order trigger
            return data;
          },
        );

      if (!defferedResult) {
        throw new ApiHttpException(
          RESPONSE_CODE.MESSAGE_QUEUE_ERROR,
          HttpStatus.BAD_REQUEST,
        );
      }
      if (defferedResult.retCode !== RESPONSE_CODE.SUCCESS) {
        throw new ApiHttpException(
          defferedResult.retCode,
          HttpStatus.BAD_REQUEST,
        );
      }

      const { openOrderVolume, matchingOrderVolume, matchingCnt } =
        defferedResult;

      // Trigger fastbook for websocket
      const fastBook = await this.stockActionService.getFastbookOrderList(
        defferedResult.matchingCnt,
        defferedResult.openOrderVolume,
        stockItem.id,
        amount,
        STOCK_ORDER_TYPE.BUY,
        STOCK_ORDER_TYPE.SELL,
        FASTBOOK_MODE.CREATE,
      );

      await this.appDaemonService.sendNotCache(this.stockGatewayQueueUrl, {
        eventName: STOCK_EVENT.FAST_BOOK,
        data: {
          stockId: stockItem.id,
          fastBook,
        },
      });

      return {
        openOrderVolume,
        matchingOrderVolume,
        matchingCnt,
      };
    } catch (err) {
      console.log(err);

      throw new ApiHttpException(
        err.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('/modify-buy')
  @UseGuards(AppApiAuthGuard)
  async modifyBuyOrder(@Req() req: Request, @Body() stockDto: any) {
    try {
      const { volume, amount, id, stockItemId } = stockDto;
      if (
        Number(volume) > STOCK_ORDER_MAX_VOLUME ||
        Number(volume) <= 0 ||
        amount <= 0
      ) {
        throw new ApiHttpException(
          RESPONSE_CODE.INVALID_PARAMETER,
          HttpStatus.BAD_REQUEST,
        );
      }

      // 사용자 검증
      const user = req.user as UserEntity;
      if (!user) {
        throw new ApiHttpException(
          RESPONSE_CODE.USER_NOT_FOUND,
          HttpStatus.UNAUTHORIZED,
        );
      }

      // stock Item 검증
      const stockItem = await this.stockItemService.getEntityById(stockItemId);
      if (!stockItem || !stockItem.isShow || stockItem.isDeleted) {
        throw new ApiHttpException(
          RESPONSE_CODE.STOCK_ITEM_NOT_FOUND,
          HttpStatus.BAD_REQUEST,
        );
      }

      // order live 검증
      const isExistOrderLive = await this.stockActionService.getOrderLiveById(
        null,
        id,
      );
      if (!isExistOrderLive) {
        throw new ApiHttpException(
          RESPONSE_CODE.STOCK_ORDER_NOT_FOUND,
          HttpStatus.BAD_REQUEST,
        );
      }

      // 자신의 주식을 구매할 수 없음
      // if (stockItem.user.id === user.id) {
      //   throw new ApiHttpException(
      //     RESPONSE_CODE.STOCK_OWNER_NOT_ALLOWED,
      //     HttpStatus.BAD_REQUEST,
      //   );
      // }

      // 현 지분 검증
      const stockAccount =
        await this.stockAccountService.getEntityByUserAndStockItem(
          stockItem.user,
          isExistOrderLive.stockItem,
          null,
        );
      if (!stockAccount) {
        throw new ApiHttpException(
          RESPONSE_CODE.STOCK_OWNER_ACCOUNT_NOT_FOUND,
          HttpStatus.BAD_REQUEST,
        );
      }

      // account 검증 및 잔액 확인
      const isInSufficient = await this.accountService.isInSufficientBalance(
        Number(amount) * Number(volume),
        ACCOUNT_CURRENCY.OS,
        user.id,
        null,
      );
      if (isInSufficient) {
        throw new ApiHttpException(
          RESPONSE_CODE.ACCOUNT_INSUFFICIENT_BALANCE,
          HttpStatus.BAD_REQUEST,
        );
      }

      const message = {
        type: STOCK_MESSAGE_TYPE.MODIFY_BUY,
        volume: Number(volume),
        amount: Number(amount),
        orderLiveId: id,
        id: isExistOrderLive.stockItem.id,
        userId: user.id,
        marketItemId: stockAccount.marketItem.id,
      };

      const defferedResult =
        await this.appDaemonService.defferedResult<DaemonOrderResultDto>(
          this.stockMatchingInQueueUrl,
          this.stockMatchingOutQueueUrl,
          message,
          async (data) => {
            return data;
          },
        );

      if (!defferedResult) {
        throw new ApiHttpException(
          RESPONSE_CODE.MESSAGE_QUEUE_ERROR,
          HttpStatus.BAD_REQUEST,
        );
      }
      if (defferedResult.retCode !== RESPONSE_CODE.SUCCESS) {
        throw new ApiHttpException(
          defferedResult.retCode,
          HttpStatus.BAD_REQUEST,
        );
      }

      // Trigger fastbook for websocket
      const fastBook = await this.stockActionService.getFastbookOrderList(
        defferedResult.matchingCnt,
        defferedResult.openOrderVolume,
        stockItem.id,
        amount,
        STOCK_ORDER_TYPE.SELL,
        STOCK_ORDER_TYPE.BUY,
        FASTBOOK_MODE.MODIFY,
        Number(isExistOrderLive.amount) != Number(amount)
          ? Number(isExistOrderLive.amount)
          : null,
      );

      await this.appDaemonService.sendNotCache(this.stockGatewayQueueUrl, {
        eventName: STOCK_EVENT.FAST_BOOK,
        data: {
          stockId: stockItem.id,
          fastBook,
        },
      });

      return {
        ...defferedResult,
      };
    } catch (error) {
      console.log(error);

      this.logger.error(error);
      throw new ApiHttpException(
        error.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('/modify-sell')
  @UseGuards(AppApiAuthGuard)
  async modifySellOrder(@Req() req: Request, @Body() stockDto: any) {
    try {
      const { volume, amount, id, stockItemId } = stockDto;
      if (
        Number(volume) > STOCK_ORDER_MAX_VOLUME ||
        Number(volume) <= 0 ||
        amount <= 0
      ) {
        throw new ApiHttpException(
          RESPONSE_CODE.INVALID_PARAMETER,
          HttpStatus.BAD_REQUEST,
        );
      }

      // 사용자 검증
      const user = req.user as UserEntity;
      if (!user) {
        throw new ApiHttpException(
          RESPONSE_CODE.USER_NOT_FOUND,
          HttpStatus.UNAUTHORIZED,
        );
      }

      // stock Item 검증
      const stockItem = await this.stockItemService.getEntityById(stockItemId);
      if (!stockItem || !stockItem.isShow || stockItem.isDeleted) {
        throw new ApiHttpException(
          RESPONSE_CODE.STOCK_ITEM_NOT_FOUND,
          HttpStatus.BAD_REQUEST,
        );
      }

      // order live 검증
      const orderLive = await this.stockActionService.getOrderLiveById(
        null,
        id,
      );
      if (!orderLive) {
        throw new ApiHttpException(
          RESPONSE_CODE.STOCK_ORDER_NOT_FOUND,
          HttpStatus.BAD_REQUEST,
        );
      }

      // 사용자 지분 검증
      const stockAccount =
        await this.stockAccountService.getEntityByUserAndStockItem(
          user,
          stockItem,
          null,
        );
      if (!stockAccount) {
        throw new ApiHttpException(
          RESPONSE_CODE.STOCK_ACCOUNT_NOT_FOUND,
          HttpStatus.BAD_REQUEST,
        );
      }
      // 판매 등록간 최대 보유량 검증
      if (stockAccount.user.id == stockItem.user.id) {
        const remainStockAccountVolume =
          Number(stockAccount.volume) - Number(volume);

        if (remainStockAccountVolume < STOCK_ACCOUNT_MAX_REMAIN_VOLUME) {
          throw new ApiHttpException(
            RESPONSE_CODE.STOCK_OWNER_TOO_MUCH_VOLUME,
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      // 판매 등록간 orderbook 최대 보유량 검증
      const orderBook = await this.stockActionService.getOrderBook(
        stockItem.id,
        STOCK_ORDER_TYPE.SELL,
        SORT_TYPE.ASC,
      );
      if (orderBook && orderBook.length > 0) {
        const diffVolume = Number(volume) - Number(orderLive.volume);
        const sumVolume = orderBook.reduce((acc, cur) => {
          acc += Number(cur.volume);
          return acc;
        }, 0);

        if (sumVolume + diffVolume > STOCK_ORDER_MAX_VOLUME) {
          throw new ApiHttpException(
            RESPONSE_CODE.STOCK_ORDER_MAX_VOLUME,
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      // 보유 지분 검증
      const isInSufficient =
        await this.stockAccountService.isInSufficientBalance(
          Number(volume),
          stockItem,
          user,
          null,
        );
      if (isInSufficient) {
        throw new ApiHttpException(
          RESPONSE_CODE.STOCK_ACCOUNT_INSUFFICIENT_VOLUME,
          HttpStatus.BAD_REQUEST,
        );
      }

      const message = {
        type: STOCK_MESSAGE_TYPE.MODIFY_SELL,
        volume: Number(volume),
        amount: Number(amount),
        orderLiveId: id,
        id: stockItem.id,
        userId: user.id,
        marketItemId: stockAccount.marketItem.id,
      };
      const defferedResult =
        await this.appDaemonService.defferedResult<DaemonOrderResultDto>(
          this.stockMatchingInQueueUrl,
          this.stockMatchingOutQueueUrl,
          message,
          async (data) => {
            // 주문 생성 또는 체결 내역 조회?? 또는 order trigger
            return data;
          },
        );

      if (!defferedResult) {
        throw new ApiHttpException(
          RESPONSE_CODE.MESSAGE_QUEUE_ERROR,
          HttpStatus.BAD_REQUEST,
        );
      }
      if (defferedResult.retCode !== RESPONSE_CODE.SUCCESS) {
        throw new ApiHttpException(
          defferedResult.retCode,
          HttpStatus.BAD_REQUEST,
        );
      }

      // Trigger fastbook for websocket
      const fastBook = await this.stockActionService.getFastbookOrderList(
        defferedResult.matchingCnt,
        defferedResult.openOrderVolume,
        stockItem.id,
        amount,
        STOCK_ORDER_TYPE.BUY,
        STOCK_ORDER_TYPE.SELL,
        FASTBOOK_MODE.MODIFY,
        Number(orderLive.amount) != Number(amount)
          ? Number(orderLive.amount)
          : null,
      );

      await this.appDaemonService.sendNotCache(this.stockGatewayQueueUrl, {
        eventName: STOCK_EVENT.FAST_BOOK,
        data: {
          stockId: stockItem.id,
          fastBook,
        },
      });

      return {
        ...defferedResult,
      };
    } catch (error) {
      this.logger.error(error);
      throw new ApiHttpException(
        error.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('/cancel')
  @UseGuards(AppApiAuthGuard)
  async cancelOrder(@Req() req: Request, @Body() stockDto: any) {
    try {
      const { id, stockItemId } = stockDto;

      const user = req.user as UserEntity;
      if (!user) {
        throw new ApiHttpException(
          RESPONSE_CODE.USER_NOT_FOUND,
          HttpStatus.UNAUTHORIZED,
        );
      }

      // order live 검증
      const orderLive = await this.stockActionService.getOrderLiveById(
        null,
        id,
      );
      if (!orderLive) {
        throw new ApiHttpException(
          RESPONSE_CODE.STOCK_ORDER_NOT_FOUND,
          HttpStatus.BAD_REQUEST,
        );
      }

      // stock Item 검증
      const stockItem = await this.stockItemService.getEntityById(stockItemId);
      if (!stockItem || !stockItem.isShow || stockItem.isDeleted) {
        throw new ApiHttpException(
          RESPONSE_CODE.STOCK_ITEM_NOT_FOUND,
          HttpStatus.BAD_REQUEST,
        );
      }

      const message = {
        type: STOCK_MESSAGE_TYPE.CANCEL, // cancel
        id, // orderLiveId
        userId: user.id, // userId
      };

      // SEND MESSAGE QUEUE
      const defferedResult =
        await this.appDaemonService.defferedResult<DaemonOrderDefaultResultDto>(
          this.stockMatchingInQueueUrl,
          this.stockMatchingOutQueueUrl,
          message,
          async (data) => {
            // 주문 생성 또는 체결 내역 조회?? 또는 order trigger
            console.log('Callback!!');

            return data;
          },
        );

      if (!defferedResult) {
        throw new ApiHttpException(
          RESPONSE_CODE.MESSAGE_QUEUE_ERROR,
          HttpStatus.BAD_REQUEST,
        );
      }
      if (defferedResult.retCode !== RESPONSE_CODE.SUCCESS) {
        throw new ApiHttpException(
          defferedResult.retCode,
          HttpStatus.BAD_REQUEST,
        );
      }

      // Trigger fastbook for websocket
      const fastBook = await this.stockActionService.getFastbookOrderList(
        0,
        0,
        stockItem.id,
        orderLive.amount,
        null,
        orderLive.type,
        FASTBOOK_MODE.CANCEL,
      );

      await this.appDaemonService.sendNotCache(this.stockGatewayQueueUrl, {
        eventName: STOCK_EVENT.FAST_BOOK,
        data: {
          stockId: stockItem.id,
          fastBook,
        },
      });

      return {
        ...defferedResult,
      };
    } catch (error) {
      this.logger.error(error);
      throw new ApiHttpException(
        error.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
