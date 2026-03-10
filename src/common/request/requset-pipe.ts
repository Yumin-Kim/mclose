import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { BaesSearchDto } from '../../dto/base.dto';

@Injectable()
export class RequestPipe implements PipeTransform {
  transform(value: BaesSearchDto, metadata: ArgumentMetadata) {
    if (value.keyword) {
      value.keyword = decodeURIComponent(value.keyword);
    }

    return value;
  }
}
