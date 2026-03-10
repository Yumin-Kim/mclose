import { PageRequest } from '../common/response/response-page';

export class ProfileQueryDto extends PageRequest {
  keyword?: string;
  date_from?: string;
  date_to?: string;
  sort?: string;
  page_date_from?: string;
  page_date_to?: string;
}

export class ProfileMarketPurchaseHistoryQueryDto extends ProfileQueryDto {
  available_download?: boolean;
}

export class ProfileOutFlowHistoryQueryDto extends ProfileQueryDto {
  type?: string; // REFUND, SETTLEMENT
  status?: string; // PENDING, PROCESSING, CONFIRMED, CANCELLED
}

export class ChartQueryDto extends ProfileQueryDto {
  is_monthly?: boolean;
}

export interface OutFlowHistoryDto {
  id?: number;
  currency?: string;
  expectedAmount?: number;
  type?: string;
  status?: string;
  regBankCode?: string;
  regBankAccountNumber?: string;
  regBankName?: string;
  fee: number;
  originAmount: number;
}
