import { PageRequest } from '../common/response/response-page';
export class MarketDto {
  id?: number;
  name?: string;
  price?: number;
  thumbnailUrl?: string;
  thumbnailStartTime?: number;
  metaData?: number;
  title?: string;
  hashTag?: string;
  marketCartIdList?: number[];
  marketCartTotalPrice?: number;
  marketItemIdList?: number[];
}

// K_TODO: 2024.11.05 임시 수정
// resolution -> 1000(p제거)
export class MarketQueryDto extends PageRequest {
  keyword?: string;
  keyword_type?: string; // title , hashTag
  sort_type?: string; // desc , rand
  ratio?: string; // 16:9 , 9:16
  resolution?: string; // 1080p , 720p
}
