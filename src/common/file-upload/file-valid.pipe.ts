import { HttpStatus, Injectable, PipeTransform } from '@nestjs/common';
import { IFile } from './file.interface';
import { ApiHttpException } from '../response/response-exception.filter';

@Injectable()
export class FileRequiredPipe implements PipeTransform {
  async transform(value: IFile | IFile[]): Promise<IFile | IFile[]> {
    await this.validate(value);

    return value;
  }

  async validate(value: IFile | IFile[]): Promise<void> {
    if (!value || (Array.isArray(value) && value.length === 0)) {
      throw new ApiHttpException('File is required', HttpStatus.BAD_REQUEST);
    }

    return;
  }
}
