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
import { AppApiAuthGuard, AppVerifyAuthPassGuard } from '../app.auth.guard';
import { Request } from 'express';
import { UserEntity } from '../../entities/user.entity';
import { MarketActionService } from '../../services/market/market-action.service';
import { MarketDto, MarketQueryDto } from '../../dto/market.dto';
import { MarketItemService } from '../../services/market/market-item.service';
import { VideoActionService } from '../../services/video/video-action.service';
import {
  ACCOUNT_CURRENCY,
  AWS_S3_BUCKET_PATH,
  BASE64_PREFIX,
  RESPONSE_CODE,
  STOCK_ACCOUNT_MAX_VOLUME,
  STOCK_MESSAGE_TYPE,
} from '../../constant';
import { CommonService } from '../../services/common.service';
import { AwsS3StorageService } from '../../common/aws/s3/aws-s3-storage.service';
import { PageRequest } from '../../common/response/response-page';
import { AccountService } from '../../services/account.service';
import { StockAccountService } from '../../services/stock/stock-account.service';
import { AppDaemonService } from '../../services/daemon/app-daemon.service';
import { DaemonOrderDefaultResultDto } from '../../dto/stock.dto';
import { ConfigService } from '@nestjs/config';

@Controller('/api/v1/market')
export class ApiMarketController {
  private readonly logger = new Logger(ApiMarketController.name);
  private readonly stockMatchingInQueueUrl: string;
  private readonly stockMatchingOutQueueUrl: string;
  private readonly awsS3ImageBucketName: string;

  constructor(
    private readonly marketActionService: MarketActionService,
    private readonly marketItemService: MarketItemService,
    private readonly videoActionService: VideoActionService,
    private readonly commonService: CommonService,
    private readonly accountService: AccountService,
    private readonly stockAccountService: StockAccountService,
    private readonly awsS3StorageService: AwsS3StorageService,
    private readonly appDaemonService: AppDaemonService,
    private readonly configService: ConfigService,
  ) {
    this.stockMatchingInQueueUrl = this.configService.get<string>(
      'AWS_SQS_STOCK_MATCHING_IN_FIFO_QUEUE_URL',
    );
    this.stockMatchingOutQueueUrl = this.configService.get<string>(
      'AWS_SQS_STOCK_MATCHING_OUT_FIFO_QUEUE_URL',
    );
    this.awsS3ImageBucketName = this.configService.get<string>(
      'AWS_S3_IMAGE_BUCKET_NAME',
    );
  }

  // TODO: 테스트 필요(지분 기능 개발 이후 수정 필요 - 지분 분배 이후 지분소유자 별 금액 분배 필요)
  @Post('/purchase')
  @UseGuards(AppApiAuthGuard)
  async purchase(@Req() @Req() req: Request, @Body() marketDto: MarketDto) {
    try {
      const user = req.user as UserEntity;

      // 마켓 아이템 체크
      const marketItem = await this.marketItemService.getEntityById(
        marketDto.id,
      );
      if (!marketItem) {
        throw new ApiHttpException(
          RESPONSE_CODE.MARKET_NOT_FOUND,
          HttpStatus.BAD_REQUEST,
        );
      }

      // isShow , isDeleted 체크
      if (!marketItem.isShow && marketItem.isDeleted) {
        throw new ApiHttpException(
          RESPONSE_CODE.MARKET_ALREADY_EXIST_NOT_SHOW,
          HttpStatus.BAD_REQUEST,
        );
      }

      // 구매자와 판매자가 같은 경우
      if (marketItem.user.id === user.id) {
        throw new ApiHttpException(
          RESPONSE_CODE.MARKET_ITEM_NOT_OWNER,
          HttpStatus.BAD_REQUEST,
        );
      }

      // 지분이 존재하는 경우인지
      const stockAccount =
        await this.stockAccountService.getEntityByUserAndMarketItem(
          marketItem.user,
          marketItem,
          null,
        );
      const isStockAccountExist = stockAccount ? true : false;

      const isExist = await this.marketActionService.purchase(
        user,
        marketItem,
        isStockAccountExist,
      );
      if (!isExist) {
        throw new ApiHttpException(
          RESPONSE_CODE.MARKET_PURCHASE_FAILED,
          HttpStatus.BAD_REQUEST,
        );
      }
      return {
        isExist,
        originVideoUrl: isExist ? marketItem.rawVideo.originVideoUrl : null,
      };
    } catch (error) {
      this.logger.error(error);
      throw new ApiHttpException(
        error.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // K_TODO: 영상 다운로드 할 수 있도록 URL 전달
  @Post('/batch-purchase')
  @UseGuards(AppApiAuthGuard)
  async batchPurchase(
    @Req() @Req() req: Request,
    @Body() marketDto: MarketDto,
  ) {
    try {
      const user = req.user as UserEntity;

      // 마켓 아이템 체크
      for (const id of marketDto.marketItemIdList) {
        const marketItem = await this.marketItemService.getEntityById(id);
        if (!marketItem) {
          throw new ApiHttpException(
            RESPONSE_CODE.MARKET_NOT_FOUND,
            HttpStatus.BAD_REQUEST,
          );
        }

        // 구매자와 판매자가 같은 경우
        if (marketItem.user.id === user.id) {
          throw new ApiHttpException(
            RESPONSE_CODE.MARKET_ITEM_NOT_OWNER,
            HttpStatus.BAD_REQUEST,
          );
        }

        // isShow , isDeleted 체크
        if (!marketItem.isShow || marketItem.isDeleted) {
          throw new ApiHttpException(
            RESPONSE_CODE.MARKET_ALREADY_EXIST_NOT_SHOW,
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      // 잔액 체크
      const isInSufficient = await this.accountService.isInSufficientBalance(
        marketDto.marketCartTotalPrice,
        ACCOUNT_CURRENCY.CL,
        user.id,
      );
      if (isInSufficient) {
        throw new ApiHttpException(
          RESPONSE_CODE.ACCOUNT_INSUFFICIENT_BALANCE,
          HttpStatus.BAD_REQUEST,
        );
      }

      // 구매
      for (const id of marketDto.marketItemIdList) {
        const marketItem = await this.marketItemService.getEntityById(id);
        const isExist = await this.marketActionService.purchase(
          user,
          marketItem,
        );
        if (!isExist) {
          throw new ApiHttpException(
            RESPONSE_CODE.MARKET_PURCHASE_FAILED,
            HttpStatus.BAD_REQUEST,
          );
        }

        // 구매 완료 후 cart 삭제
        await this.marketActionService.deleteMarketCart(marketItem, user);
      }

      return true;
    } catch (error) {
      this.logger.error(error);
      throw new ApiHttpException(
        error.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // TODO: 영상 썸네일 작성간 시간 기록 해야함
  // K_TODO: 24.11.10 base64 requestBody 용량 이슈 발생
  @Post('/create')
  @UseGuards(AppApiAuthGuard)
  async create(@Req() @Req() req: Request, @Body() marketDto: MarketDto) {
    try {
      const user = req.user as UserEntity;

      const rawVideo = await this.videoActionService.getEntityById(
        marketDto.id,
      );
      if (!rawVideo || rawVideo.user.id !== user.id) {
        throw new ApiHttpException(
          RESPONSE_CODE.VIDEO_NOT_FOUND,
          HttpStatus.BAD_REQUEST,
        );
      }

      const isMarketItemExist = await this.marketItemService.isExist(
        rawVideo.id,
      );
      if (isMarketItemExist) {
        if (isMarketItemExist.isShow) {
          throw new ApiHttpException(
            RESPONSE_CODE.MARKET_ALREADY_EXIST_SHOW,
            HttpStatus.BAD_REQUEST,
          );
        } else {
          throw new ApiHttpException(
            RESPONSE_CODE.MARKET_ALREADY_EXIST_NOT_SHOW,
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      // 썸네일 저장
      const base64ToBuffer = this.commonService.base64ToBuffer(
        marketDto.thumbnailUrl,
      );
      if (!base64ToBuffer) {
        throw new ApiHttpException(
          RESPONSE_CODE.MARKET_INVALID_THUMBNAIL_FORMAT,
          HttpStatus.BAD_REQUEST,
        );
      }

      // Upload to S3
      const unixtimeFileName = Date.now().toString();
      const s3KeyPath = await this.awsS3StorageService.uploadBase64(
        this.awsS3ImageBucketName,
        AWS_S3_BUCKET_PATH.MARKET_ITEM_THUMBNAIL + '/' + unixtimeFileName,
        marketDto.thumbnailUrl.split(BASE64_PREFIX).pop(),
        marketDto.thumbnailUrl.split(';')[0].split(':')[1],
      );
      if (!s3KeyPath) {
        throw new ApiHttpException(
          RESPONSE_CODE.AWS_S3_UPLOAD_ERROR,
          HttpStatus.BAD_REQUEST,
        );
      }

      marketDto.thumbnailUrl = this.awsS3StorageService.getPublicUrl(
        s3KeyPath,
        this.awsS3ImageBucketName,
      );

      return await this.marketItemService.create(marketDto, rawVideo, user);
    } catch (error) {
      this.logger.error(error);
      throw new ApiHttpException(
        error.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // 해시태그는 front에서 정렬 이후 string으로 전달
  @Post('/update')
  @UseGuards(AppApiAuthGuard)
  async update(@Req() @Req() req: Request, @Body() marketDto: MarketDto) {
    try {
      // 사용자 검증
      const user = req.user as UserEntity;
      if (!user) {
        throw new ApiHttpException(
          RESPONSE_CODE.USER_NOT_FOUND,
          HttpStatus.BAD_REQUEST,
        );
      }

      // 마켓 아이템 검증
      const marketItem = await this.marketItemService.getEntityById(
        marketDto.id,
      );
      if (!marketItem) {
        throw new ApiHttpException(
          RESPONSE_CODE.MARKET_NOT_FOUND,
          HttpStatus.BAD_REQUEST,
        );
      }
      if (marketItem.user.id !== user.id) {
        throw new ApiHttpException(
          RESPONSE_CODE.MARKET_ITEM_NOT_OWNER,
          HttpStatus.BAD_REQUEST,
        );
      }

      // 썸네일 저장
      if (
        Number(marketDto.thumbnailStartTime) !==
        Number(marketItem.thumbnailStartTime)
      ) {
        if (marketDto.thumbnailUrl) {
          // base64 convert to buffer and Buffer save to S3
          const verifyFormat = this.commonService.base64ToBuffer(
            marketDto.thumbnailUrl,
          );
          if (!verifyFormat) {
            throw new ApiHttpException(
              RESPONSE_CODE.MARKET_INVALID_THUMBNAIL_FORMAT,
              HttpStatus.BAD_REQUEST,
            );
          }

          // Upload to S3
          const unixtimeFileName = Date.now().toString();
          const s3KeyPath = await this.awsS3StorageService.uploadBase64(
            this.awsS3ImageBucketName,
            AWS_S3_BUCKET_PATH.MARKET_ITEM_THUMBNAIL + '/' + unixtimeFileName,
            marketDto.thumbnailUrl.split(BASE64_PREFIX).pop(),
            marketDto.thumbnailUrl.split(';')[0].split(':')[1],
          );
          if (!s3KeyPath) {
            throw new ApiHttpException(
              RESPONSE_CODE.AWS_S3_UPLOAD_ERROR,
              HttpStatus.BAD_REQUEST,
            );
          }

          marketDto.thumbnailUrl = this.awsS3StorageService.getPublicUrl(
            s3KeyPath,
            this.awsS3ImageBucketName,
          );
        }
      }
      // 마켓 아이템 업데이트
      const isExist = await this.marketItemService.update(
        marketDto,
        marketItem,
      );
      if (!isExist) {
        throw new ApiHttpException(
          RESPONSE_CODE.MARKET_NOT_FOUND,
          HttpStatus.BAD_REQUEST,
        );
      }

      return isExist;
    } catch (error) {
      console.log(error);

      this.logger.error(error);
      throw new ApiHttpException(
        error.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // TODO: 삭제 하는 경우 지분 100%인지 검증 필요
  // 지분 개발 이후 진행 예정
  @Post('/delete')
  @UseGuards(AppApiAuthGuard)
  async delete(@Req() @Req() req: Request, @Body() marketDto: MarketDto) {
    try {
      const user = req.user as UserEntity;
      if (!user) {
        throw new ApiHttpException(
          RESPONSE_CODE.USER_NOT_FOUND,
          HttpStatus.BAD_REQUEST,
        );
      }

      const marketItem = await this.marketItemService.getEntityById(
        marketDto.id,
      );
      if (!marketItem) {
        throw new ApiHttpException(
          RESPONSE_CODE.MARKET_NOT_FOUND,
          HttpStatus.BAD_REQUEST,
        );
      }
      if (marketItem.user.id !== user.id) {
        throw new ApiHttpException(
          RESPONSE_CODE.MARKET_ITEM_NOT_OWNER,
          HttpStatus.BAD_REQUEST,
        );
      }

      // 지분이 존재하는지 검증
      const stockAccount =
        await this.stockAccountService.getEntityByUserAndMarketItem(
          user,
          marketItem,
          null,
        );
      if (stockAccount) {
        // 지분이 100%인지 검증
        if (Number(stockAccount.volume) !== STOCK_ACCOUNT_MAX_VOLUME) {
          throw new ApiHttpException(
            RESPONSE_CODE.STOCK_ACCOUNT_NOT_MAX_VOLUME,
            HttpStatus.BAD_REQUEST,
          );
        } else {
          // 지분 삭제 요청
          const message = {
            type: STOCK_MESSAGE_TYPE.DELETE,
            id: stockAccount.stockItem.id,
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
        }
      }

      const isExist = await this.marketItemService.delete(marketItem);

      return isExist;
    } catch (error) {
      this.logger.error(error);
      throw new ApiHttpException(
        error.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // TODO: Not yet implemented
  @Get('/detail/:id')
  @UseGuards(AppVerifyAuthPassGuard)
  async getMarketItem(@Req() req: Request, @Param('id') id: number) {
    try {
      const user = req.user as UserEntity | undefined;

      const marketItem = await this.marketItemService.getEntityById(id);
      if (!marketItem) {
        throw new ApiHttpException(
          RESPONSE_CODE.MARKET_NOT_FOUND,
          HttpStatus.BAD_REQUEST,
        );
      }

      if (!marketItem.isShow || marketItem.isDeleted) {
        throw new ApiHttpException(
          RESPONSE_CODE.MARKET_ALREADY_EXIST_NOT_SHOW,
          HttpStatus.BAD_REQUEST,
        );
      }

      await this.marketActionService.increaseViewCnt(marketItem.id);

      delete marketItem.user;
      delete marketItem.rawVideo.originVideoUrl;

      return {
        marketItem,
        isLike: false,
        isMarketCart: false,
      };
    } catch (error) {
      this.logger.error(error);
      throw new ApiHttpException(
        error.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // ssr 요청간 sessionStorage에 접근하지 못해 사용자 정보를 전달 받아야함
  // 1. 사용자 존재하는 경우 좋아요 유무 확인
  // 2. 사용자 마켓 카트에 존재하는지 확인
  @Get('/detail-util/:id')
  @UseGuards(AppVerifyAuthPassGuard)
  async getMarketItemUtil(@Req() req: Request, @Param('id') id: number) {
    try {
      const user = req.user as UserEntity | undefined;

      const marketItem = await this.marketItemService.getEntityById(id);
      if (!marketItem) {
        throw new ApiHttpException(
          RESPONSE_CODE.MARKET_NOT_FOUND,
          HttpStatus.BAD_REQUEST,
        );
      }

      // K_TODO: 사용자가 존재 유무 확인후
      // 1. 사용자 존재하는 경우 좋아요 유무 확인
      // 2. 사용자 마켓 카트에 존재하는지 확인
      let isLike = false,
        isMarketCart = false,
        isOwner = false;

      if (user) {
        isLike = await this.marketActionService.isLike(marketItem, user);
        isMarketCart = await this.marketActionService.isMarketCart(
          marketItem,
          user,
        );
        isOwner = marketItem.user.id === user.id;
      }

      delete marketItem.user;
      delete marketItem.rawVideo.originVideoUrl;

      return {
        isLike,
        isMarketCart,
        isOwner,
      };
    } catch (error) {
      this.logger.error(error);
      throw new ApiHttpException(
        error.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('/list')
  @UseGuards(AppVerifyAuthPassGuard)
  async list(@Req() req: Request, @Query() marketQueryDto: MarketQueryDto) {
    try {
      const user = req.user as UserEntity | undefined;

      return await this.marketItemService.list(
        marketQueryDto.getOffset(),
        marketQueryDto.getLimit(),
        marketQueryDto,
      );
    } catch (error) {
      this.logger.error(error);
      throw new ApiHttpException(
        error.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('/market-cart/list')
  @UseGuards(AppApiAuthGuard)
  async listMarketCart(@Req() req: Request, @Query() pageRequest: PageRequest) {
    try {
      const user = req.user as UserEntity;
      if (!user) {
        throw new ApiHttpException(
          RESPONSE_CODE.USER_NOT_FOUND,
          HttpStatus.BAD_REQUEST,
        );
      }

      return await this.marketActionService.listMarketCart(
        pageRequest.getOffset(),
        pageRequest.getLimit(),
        user,
      );
    } catch (error) {
      this.logger.error(error);
      throw new ApiHttpException(
        error.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('/market-cart/create/:id')
  @UseGuards(AppApiAuthGuard)
  async craeteMarketCart(@Req() req: Request, @Param('id') id: number) {
    try {
      const user = req.user as UserEntity;
      if (!user) {
        throw new ApiHttpException(
          RESPONSE_CODE.USER_NOT_FOUND,
          HttpStatus.BAD_REQUEST,
        );
      }

      const marketItem = await this.marketItemService.getEntityById(id);
      if (!marketItem) {
        throw new ApiHttpException(
          RESPONSE_CODE.MARKET_NOT_FOUND,
          HttpStatus.BAD_REQUEST,
        );
      }

      const isExist = await this.marketActionService.createMarketCart(
        marketItem,
        user,
      );
      if (!isExist) {
        throw new ApiHttpException(
          RESPONSE_CODE.MARKET_CART_CREATE_FAILED,
          HttpStatus.BAD_REQUEST,
        );
      }

      return true;
    } catch (error) {
      this.logger.error(error);
      throw new ApiHttpException(
        error.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('/market-cart/delete')
  @UseGuards(AppApiAuthGuard)
  async deleteMarketCart(@Req() req: Request, @Body() marketDto: MarketDto) {
    try {
      const user = req.user as UserEntity;
      if (!user) {
        throw new ApiHttpException(
          RESPONSE_CODE.USER_NOT_FOUND,
          HttpStatus.BAD_REQUEST,
        );
      }

      const marketCartList =
        await this.marketActionService.findMarketCartByIdList(
          marketDto.marketCartIdList,
          user,
        );
      if (!marketCartList || marketCartList.length === 0) {
        throw new ApiHttpException(
          RESPONSE_CODE.MARKET_CART_NOT_FOUND,
          HttpStatus.BAD_REQUEST,
        );
      }

      const isExist = await this.marketActionService.bulkDeleteMarketCart(
        marketCartList,
        user,
      );
      if (!isExist) {
        throw new ApiHttpException(
          RESPONSE_CODE.MARKET_CART_CREATE_FAILED,
          HttpStatus.BAD_REQUEST,
        );
      }

      return true;
    } catch (error) {
      this.logger.error(error);
      throw new ApiHttpException(
        error.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('/like/:id')
  @UseGuards(AppApiAuthGuard)
  async like(@Req() req: Request, @Param('id') id: number) {
    try {
      const user = req.user as UserEntity;
      if (!user) {
        throw new ApiHttpException(
          RESPONSE_CODE.USER_NOT_FOUND,
          HttpStatus.BAD_REQUEST,
        );
      }

      const marketItem = await this.marketItemService.getEntityById(id);
      if (!marketItem) {
        throw new ApiHttpException(
          RESPONSE_CODE.MARKET_NOT_FOUND,
          HttpStatus.BAD_REQUEST,
        );
      }

      // 좋아요 검증
      const isLike = await this.marketActionService.isLike(marketItem, user);
      if (isLike) {
        throw new ApiHttpException(
          RESPONSE_CODE.MARKET_ALREADY_LIKE,
          HttpStatus.BAD_REQUEST,
        );
      }

      return await this.marketActionService.like(marketItem, user);
    } catch (error) {
      this.logger.error(error);
      throw new ApiHttpException(
        error.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('/unlike/:id')
  @UseGuards(AppApiAuthGuard)
  async unlike(@Req() req: Request, @Param('id') id: number) {
    try {
      const user = req.user as UserEntity;
      if (!user) {
        throw new ApiHttpException(
          RESPONSE_CODE.USER_NOT_FOUND,
          HttpStatus.BAD_REQUEST,
        );
      }

      const marketItem = await this.marketItemService.getEntityById(id);
      if (!marketItem) {
        throw new ApiHttpException(
          RESPONSE_CODE.MARKET_NOT_FOUND,
          HttpStatus.BAD_REQUEST,
        );
      }

      // 좋아요 검증
      const isLike = await this.marketActionService.isLike(marketItem, user);
      if (!isLike) {
        throw new ApiHttpException(
          RESPONSE_CODE.MARKET_LIKE_NOT_FOUND,
          HttpStatus.BAD_REQUEST,
        );
      }

      // 종아요 데이터 삭제 및 like_cnt -1
      const isExist = await this.marketActionService.unlike(marketItem, user);
      if (!isExist) {
        throw new ApiHttpException(
          RESPONSE_CODE.MARKET_NOT_LIKE,
          HttpStatus.BAD_REQUEST,
        );
      }

      return true;
    } catch (error) {
      this.logger.error(error);
      throw new ApiHttpException(
        error.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
