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
import { AppApiAuthGuard } from '../app.auth.guard';
import { Request } from 'express';
import { UserEntity } from '../../entities/user.entity';
import { RESPONSE_CODE } from '../../constant';

import { VideoActionService } from '../../services/video/video-action.service';
import {
  MoveToWorkspaceDto,
  UpdateWorkspaceKeywordDto,
  WorkspaceQueryDto,
} from '../../dto/workspace.dto';
import { UserService } from '../../services/user.service';
import { RawVideoDto } from '../../dto/video.dto';
import { MarketItemService } from '../../services/market/market-item.service';
import { StockItemService } from '../../services/stock/stock-item.service';
import { StockAccountService } from '../../services/stock/stock-account.service';
import { PromptHistoryService } from '../../services/prompt/prompt-history.service';

@Controller('/api/v1/workspace')
@UseGuards(AppApiAuthGuard)
export class ApiWorkspaceController {
  private readonly logger = new Logger(ApiWorkspaceController.name);

  constructor(
    private readonly videoActionService: VideoActionService,
    private readonly userService: UserService,
    private readonly marketItemService: MarketItemService,
    private readonly stockItemService: StockItemService,
    private readonly stockAccountService: StockAccountService,
    private readonly promptHistoryService: PromptHistoryService,
  ) {}

  @Get('/list')
  async list(@Query() query: WorkspaceQueryDto, @Req() req: Request) {
    try {
      const user = req.user as UserEntity;
      if (!user) {
        throw new ApiHttpException(
          RESPONSE_CODE.USER_NOT_FOUND,
          HttpStatus.UNAUTHORIZED,
        );
      }
      // !query.keyword이면 모든 raw video 목록을 조회합니다.
      const { keyword } = query;

      // 사용자가 생성한 raw video 목록을 조회합니다.
      const data = await this.videoActionService.list(
        keyword || null,
        user,
        query.getOffset(),
        query.getLimit(),
      );

      return {
        ...data,
        workspaceKeywordList: user.workspaceHashtag
          ? user.workspaceHashtag.split(',')
          : [],
      };
    } catch (err) {
      this.logger.error(err);
      throw new ApiHttpException(
        err.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('/update-title')
  async updateTitle(@Body() rawVideoDto: RawVideoDto, @Req() req: Request) {
    try {
      // 사용자가 생성한 raw video의 제목을 수정합니다.
      const user = req.user as UserEntity;
      if (!user) {
        throw new ApiHttpException(
          RESPONSE_CODE.USER_NOT_FOUND,
          HttpStatus.UNAUTHORIZED,
        );
      }

      const isExist = await this.videoActionService.updateTitle(
        user,
        rawVideoDto,
      );
      if (!isExist) {
        throw new ApiHttpException(
          RESPONSE_CODE.MARKET_NOT_FOUND,
          HttpStatus.UNAUTHORIZED,
        );
      }

      return true;
    } catch (err) {
      this.logger.error(err);
      throw new ApiHttpException(
        err.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * 버그 수정 필요
   * updateKeywordList : updatekeywordDto[] input 박스별 변경전 텍스트 oldKeyword, 변경후 텍스트 newKeyword
   * deleteKeywordList
   * finalKeywordList : string front에서 최종으로 검증한 후 전달해야함(존재하는 keyword 제거)
   * @param updateWorkspaceKeywordDto
   * @param req
   * @returns
   */
  @Post('/update-keyword')
  async editKeyword(
    @Body() updateWorkspaceKeywordDto: UpdateWorkspaceKeywordDto,
    @Req() req: Request,
  ) {
    try {
      // 사용자 workspace_hashtag 수정
      const user = req.user as UserEntity;
      if (!user) {
        throw new ApiHttpException(
          RESPONSE_CODE.USER_NOT_FOUND,
          HttpStatus.UNAUTHORIZED,
        );
      }

      // 사용자가 선택한 keyword 중복 검증
      if (user.workspaceHashtag) {
        let isDuplicate = false;

        user.workspaceHashtag.split(',').forEach((ele, idx) => {
          if (user.workspaceHashtag.split(',').indexOf(ele) !== idx) {
            isDuplicate = true;
          }
        });

        if (isDuplicate) {
          throw new ApiHttpException(
            RESPONSE_CODE.USER_DUPLICATE_KEYWORD,
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      const isExist = await this.userService.updateWorkspaceHashtag(
        user.id,
        updateWorkspaceKeywordDto.finalKeywordList,
      );
      if (!isExist) {
        throw new ApiHttpException(
          RESPONSE_CODE.USER_NOT_FOUND,
          HttpStatus.UNAUTHORIZED,
        );
      }

      // 사용자가 삭제한 keyword를 제외한다.
      if (updateWorkspaceKeywordDto.deleteKeywordList.length > 0) {
        await this.videoActionService.deleteKeyword(
          user,
          updateWorkspaceKeywordDto.deleteKeywordList,
        );
      }

      // 사용자가 수정한 keyword로 변경한다.
      if (updateWorkspaceKeywordDto.updateKeywordList.length > 0) {
        await this.videoActionService.updateKeyword(
          user,
          updateWorkspaceKeywordDto.updateKeywordList,
        );
      }

      return true;
    } catch (err) {
      this.logger.error(err);
      throw new ApiHttpException(
        err.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('/move-to-workspace')
  async updateWorkspace(
    @Body() moveToWorkspaceDto: MoveToWorkspaceDto,
    @Req() req: Request,
  ) {
    try {
      const user = req.user as UserEntity;
      if (!user) {
        throw new ApiHttpException(
          RESPONSE_CODE.USER_NOT_FOUND,
          HttpStatus.UNAUTHORIZED,
        );
      }

      const isExistKeyword = user.workspaceHashtag
        .split(',')
        .find((keyword) => keyword == moveToWorkspaceDto.keyword);

      if (!isExistKeyword) {
        throw new ApiHttpException(
          RESPONSE_CODE.USER_NOT_FOUND_WORKSPACE_KEYWORD,
          HttpStatus.BAD_REQUEST,
        );
      }

      // 사용자가 선택한 raw video를 workspace로 이동합니다.
      if (moveToWorkspaceDto.idList.length === 0) {
        throw new ApiHttpException(
          RESPONSE_CODE.INVALID_PARAMETER,
          HttpStatus.BAD_REQUEST,
        );
      }

      await this.videoActionService.moveToWorkspace(user, moveToWorkspaceDto);
      return true;
    } catch (err) {
      console.log(err);

      this.logger.error(err);
      throw new ApiHttpException(
        err.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // K_TODO: 24.11.02 프폴프트 정보 필요 , 사용자 정보는 제거
  @Get('/detail/:id')
  async detail(@Req() req: Request, @Param('id') id: number) {
    try {
      const user = req.user as UserEntity;
      if (!user) {
        throw new ApiHttpException(
          RESPONSE_CODE.USER_NOT_FOUND,
          HttpStatus.UNAUTHORIZED,
        );
      }

      const rawVideo = await this.videoActionService.getEntityById(id);
      if (!rawVideo) {
        throw new ApiHttpException(
          RESPONSE_CODE.VIDEO_NOT_FOUND,
          HttpStatus.UNAUTHORIZED,
        );
      }
      if (rawVideo.user.id !== user.id) {
        throw new ApiHttpException(
          RESPONSE_CODE.VIDEO_NOT_OWNER,
          HttpStatus.UNAUTHORIZED,
        );
      }
      if (rawVideo.isDeleted) {
        throw new ApiHttpException(
          RESPONSE_CODE.VIDEO_IS_DELETED,
          HttpStatus.UNAUTHORIZED,
        );
      }

      delete rawVideo.user;

      const promptHistory =
        await this.promptHistoryService.getEntityByCommandUUID(
          rawVideo.commandUUID,
        );
      const marketItem = await this.marketItemService.isExist(id);
      const stockItem = await this.stockItemService.isExist(id);
      let stockAccount = null;

      if (stockItem) {
        stockAccount =
          await this.stockAccountService.getEntityByUserAndStockItem(
            user,
            stockItem,
          );

        if (stockAccount) {
          delete stockAccount.user;
          delete stockAccount.stockItem;
          delete stockAccount.marketItem;
        }
      }

      return {
        isExistMarketItem: marketItem ? true : false,
        isExistStockItem: stockItem ? true : false,
        stockItemId: stockItem ? stockItem.id : null,
        marketItemId: marketItem ? marketItem.id : null,
        stockAccount,
        promptHistory,
        rawVideo,
      };

      // 사용자가 생성한 raw video의 상세정보를 조회합니다.
      // 조회간 마켓 , stock에 존재하는지 유무 검증 필요
    } catch (err) {
      this.logger.error(err);
      throw new ApiHttpException(
        err.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // TODO: 이 부분은 마켓 , 지분 개발 이후 진행해야함
  @Post('/delete')
  async delete(@Req() req: Request, @Body('id') id: number) {
    try {
      const user = req.user as UserEntity;
      if (!user) {
        throw new ApiHttpException(
          RESPONSE_CODE.USER_NOT_FOUND,
          HttpStatus.UNAUTHORIZED,
        );
      }

      // 사용자가 생성한 raw video를 삭제합니다.
      const rawVideo = await this.videoActionService.getEntityById(id);
      if (!rawVideo) {
        throw new ApiHttpException(
          RESPONSE_CODE.VIDEO_NOT_FOUND,
          HttpStatus.UNAUTHORIZED,
        );
      }
      if (rawVideo.user.id !== user.id) {
        throw new ApiHttpException(
          RESPONSE_CODE.VIDEO_NOT_OWNER,
          HttpStatus.UNAUTHORIZED,
        );
      }

      // 마켓 등록된 상품 있는 경우 isDeleted = true 검증
      const marketItem = await this.marketItemService.getEntityByRawVideoId(id);
      if (marketItem) {
        if (marketItem.user.id !== user.id) {
          throw new ApiHttpException(
            RESPONSE_CODE.MARKET_ITEM_NOT_OWNER,
            HttpStatus.UNAUTHORIZED,
          );
        }

        if (!marketItem.isDeleted) {
          throw new ApiHttpException(
            RESPONSE_CODE.MARKET_ITEM_NOT_DELETED,
            HttpStatus.UNAUTHORIZED,
          );
        }

        // 주식 등록된 상품 있는 경우 isDeleted = true 검증
        const stockItem = await this.stockItemService.getEntityById(id);
        if (stockItem) {
          if (stockItem.user.id !== user.id) {
            throw new ApiHttpException(
              RESPONSE_CODE.STOCK_ITEM_NOT_OWNER,
              HttpStatus.UNAUTHORIZED,
            );
          }

          if (!stockItem.isDeleted) {
            throw new ApiHttpException(
              RESPONSE_CODE.STOCK_ITEM_NOT_DELETED,
              HttpStatus.UNAUTHORIZED,
            );
          }
        }
      }

      await this.videoActionService.delete(user, rawVideo);

      return true;
    } catch (err) {
      console.log(err);

      this.logger.error(err);
      throw new ApiHttpException(
        err.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
