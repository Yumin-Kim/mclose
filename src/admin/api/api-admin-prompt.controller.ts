import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Logger,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SearchUserDto } from '../../dto/admin.dto';
import { Request } from 'express';
import { AdminSuperAuthGuard } from '../admin.auth.guard';
import { ConfigService } from '@nestjs/config';
import { ApiHttpException } from '../../common/response/response-exception.filter';
import { AdminEntity } from '../../entities/admin.entity';
import { CommonService } from '../../services/common.service';
import { RESPONSE_CODE } from '../../constant';

@Controller('/prompt')
export class ApiAdminPromptController {
  constructor(
    private configService: ConfigService,
    private commonService: CommonService,
  ) {}

  private readonly logger = new Logger(ApiAdminPromptController.name);

  @Get('/list')
  @UseGuards()
  async list(
    @Req() @Req() req: Request,
    @Query() searchUserDto: SearchUserDto,
  ) {
    try {
    } catch (error) {
      this.logger.error(error);
      throw new ApiHttpException(
        error.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
