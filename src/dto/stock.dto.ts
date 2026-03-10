import { UserEntity } from 'src/entities/user.entity';
import { PageRequest } from '../common/response/response-page';
import { STOCK_ORDER_CANCEL_TYPE } from '../constant';
import { StockItemEntity } from '../entities/stock-item.entity';
import { StockOrderLiveEntity } from '../entities/stock-order-live.entity';
export interface StockItemDto {
  marketItemId?: number;
  id?: number;
  volume?: number;
  openPrice?: number;
  closePrice?: number;
  highPrice?: number;
  lowPrice?: number;
  initialPrice?: number;
  thumbnailUrl?: string;
  thumbnailStartTime?: number;
  name?: string;
  title?: string;
  viewCnt?: number;
  matchCnt?: number;
  status?: string;
  deletedAt?: string;
  isDeleted?: boolean;
  isShow?: boolean;
}

export interface DaemonOrderDto {
  commandUUID: string; // 주문 UUID
  type: string; // BUY, SELL , MODIFY_BUY, MODIFY_SELL, CANCE
  volume: number; // 주문 수량
  amount: number; // 주문 가격
  id: number; // stockItemId
  userId: number; // 사용자 ID
  marketItemId: number; // 마켓 ID
  orderLiveId?: number; // 주문 ID - modify_buy, modify_sell
}

export interface DaemonDeleteStockItemDto {
  id: number;
  userId: number;
  type: string;
  stockAccountId: number;
  commandUUID: string; // 주문 UUID
}

export interface DaemonOrderResultDto extends DaemonOrderDto {
  openOrderVolume?: number;
  matchingOrderVolume?: number;
  matchingCnt?: number;
  retCode?: number;
}

export interface DaemonOrderDefaultResultDto {
  type: string;
  volume: number;
  amount: number;
  id: string;
  userId: string;
  commandUUID: string;
  timestamp: number;
  retCode: number;
}

export interface StockMatchDto {
  volume?: number;
  amount?: number;
  feeAmount?: number;
  type?: string;
  buyUserId?: number;
  buyOrderLiveId?: number;
  sellUserId?: number;
  sellOrderLiveId?: number;
  stockItemId?: number;
  orderLiveId?: number;
  totalAmount: number; // 주문 총 금액
  originalVolume: number; // 원 주문량 기록
}

export class StockQueryDto extends PageRequest {
  keyword?: string;
  sort_type?: string; // desc , O_AMOUNT_ASC:기준가 ASC, O_AMOUNT_DESC:기준가 DESC
}

export interface StockGateawayEventMatchDto {
  userId: number;
  volume: number;
  type: string;
}


export interface StockOrderCancelDto {
  volume: number;
  amount: number;
  regType: typeof STOCK_ORDER_CANCEL_TYPE[keyof typeof STOCK_ORDER_CANCEL_TYPE];
  user: UserEntity;
  stockItem: StockItemEntity;
  stockOrderLive: StockOrderLiveEntity;
}