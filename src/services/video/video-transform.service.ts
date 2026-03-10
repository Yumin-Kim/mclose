import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class VideoTransformService {
  private readonly logger = new Logger(VideoTransformService.name);

  constructor() {}

  execute() {}
}
