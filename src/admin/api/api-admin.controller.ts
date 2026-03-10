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
import { AdminUserService } from '../../services/admin/admin-user.service';
import {
  CreateAdminDto,
  SearchAdminDto,
  SigninAdminDto,
  UpdateAdminDto,
} from '../../dto/admin.dto';
import { Request } from 'express';
import { AdminAllAuthGuard, AdminSuperAuthGuard } from '../admin.auth.guard';
import { ConfigService } from '@nestjs/config';
import { ApiHttpException } from '../../common/response/response-exception.filter';
import { AdminEntity } from '../../entities/admin.entity';
import { AdminService } from '../../services/admin/admin.service';
import { CommonService } from '../../services/common.service';
import { RESPONSE_CODE } from '../../constant';

@Controller('/admin')
export class ApiAdminController {
  constructor(
    private adminService: AdminService,
    private configService: ConfigService,
    private commonService: CommonService,
  ) { }

  private readonly logger = new Logger(ApiAdminController.name);

  @Get('list')
  @UseGuards(AdminAllAuthGuard)
  async getAdminList(
    @Req() @Req() req: Request,
    @Query() searchAdminDto: SearchAdminDto,
  ) {
    try {
      return await this.adminService.getAdminList(
        searchAdminDto.getOffset(),
        searchAdminDto.getLimit(),
      );
    } catch (error) {
      this.logger.error(error);
      throw new ApiHttpException(
        error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('/detail/:id')
  @UseGuards(AdminAllAuthGuard)
  async getAdminInfo(@Req() @Req() req: Request, @Param('id') adminId: number) {
    try {
      const adminEntity = req.user as AdminEntity;
      if (!adminEntity) {
        throw new ApiHttpException(
          'Invalid Admin User',
          HttpStatus.UNAUTHORIZED,
        );
      }

      return await this.adminService.getAdminInfo(adminId);
    } catch (error) {
      this.logger.error(error);
      throw new ApiHttpException(
        error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('verify_token')
  async getAdminVerifyToken(@Req() @Req() req: Request) {
    try {
      const jwtStr = req.headers['authorization'] as string;
      return await this.adminService.verifyAdminToken(jwtStr);
    } catch (error) {
      this.logger.error(error);
      throw new ApiHttpException(
        error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('update_token')
  async getAdminUpdateToken(@Req() @Req() req: Request) {
    try {
      const jwtStr = req.headers['Authorization'] as string;
      return await this.adminService.updateAdminToken(jwtStr);
    } catch (error) {
      this.logger.error(error);
      throw new ApiHttpException(
        error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('signin')
  async postAdminSignin(
    @Req() @Req() req: Request,
    @Body() signinAdminDto: SigninAdminDto,
  ) {
    try {
      const ip = this.commonService.getIp(req);
      signinAdminDto.ip = ip;
      return await this.adminService.signinAdmin(signinAdminDto);
    } catch (error) {
      this.logger.error(error);
      throw new ApiHttpException(
        error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('initialize')
  async postAdminInitialize(@Req() @Req() req: Request) {
    try {
      const ip = this.commonService.getIp(req);
      const musicanoteAdminLoginId =
        this.configService.get<string>('ADMIN_EMAIL') ?? 'admin@admin.com';
      return await this.adminService.initializeAdmin(
        ip,
        musicanoteAdminLoginId,
      );
    } catch (error) {
      this.logger.error(error);
      throw new ApiHttpException(
        error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('create')
  adminSignup(
    @Req() @Req() req: Request,
    @Body() createAdminDto: CreateAdminDto,
  ) {
    try {
      const ip = this.commonService.getIp(req);
      createAdminDto.ip.trim() != ''
        ? createAdminDto.ip
        : (createAdminDto.ip = ip);
      return this.adminService.adminSignup(createAdminDto);
    } catch (error) {
      this.logger.error(error);
      throw new ApiHttpException(
        error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('change_password/:id')
  @UseGuards(AdminSuperAuthGuard)
  async postAdminSignupChangePassword(
    @Req() @Req() req: Request,
    @Param('id') adminId: number,
    @Body('hashPassword') hashPassword: string,
  ) {
    try {
      if (!hashPassword || hashPassword.length == 0) {
        throw new ApiHttpException('Invalid Password', HttpStatus.BAD_REQUEST);
      }

      // 관리자 조회
      const adminEntity = req.user as AdminEntity;
      if (!adminEntity) {
        throw new ApiHttpException(
          'Invalid Admin User',
          HttpStatus.UNAUTHORIZED,
        );
      }

      const targetAdminEntity = await this.adminService.getAdminEntity(adminId);
      if (!targetAdminEntity) {
        throw new ApiHttpException(
          'Not found admin user',
          HttpStatus.BAD_REQUEST,
        );
      }

      // 관리자 생성
      return await this.adminService.changeAdminPin(
        targetAdminEntity,
        hashPassword,
      );
    } catch (error) {
      this.logger.error(error);
      throw new ApiHttpException(
        error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post("/delete")
  @UseGuards(AdminSuperAuthGuard)
  async postAdminDelete(
    @Req() @Req() req: Request,
    @Body('idList') idList: number[],
  ) {
    try {
      // 관리자 조회
      const adminEntity = req.user as AdminEntity;
      if (!adminEntity) {
        throw new ApiHttpException(
          'Invalid Admin User',
          HttpStatus.UNAUTHORIZED,
        );
      }

      if (idList.length == 0) {
        throw new ApiHttpException(
          'Invalid Admin User',
          HttpStatus.BAD_REQUEST,
        );
      }

      return await this.adminService.deleteAdmin(idList);
    } catch (error) {
      this.logger.error(error);
      throw new ApiHttpException(
        error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('update/:id')
  @UseGuards(AdminSuperAuthGuard)
  async putAdminUpdate(
    @Req() @Req() req: Request,
    @Param('id') adminId: number,
    @Body() updateAdminDto: UpdateAdminDto,
  ) {
    try {
      // 관리자 조회
      const adminEntity = req.user as AdminEntity;
      if (!adminEntity) {
        throw new ApiHttpException(
          'Invalid Admin User',
          HttpStatus.UNAUTHORIZED,
        );
      }

      // 관리자 수정대상 조회
      const targetAdminEntity = await this.adminService.getAdminEntity(adminId);
      if (!targetAdminEntity) {
        throw new ApiHttpException(
          'Not found admin user',
          HttpStatus.BAD_REQUEST,
        );
      }

      const ip = this.commonService.getIp(req);
      updateAdminDto.ip.trim() != ''
        ? updateAdminDto.ip
        : (updateAdminDto.ip = ip);

      // 관리자 수정
      return await this.adminService.updateAdminInfo(
        updateAdminDto,
        targetAdminEntity,
      );
    } catch (error) {
      this.logger.error(error);
      throw new ApiHttpException(
        error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('signout')
  @UseGuards(AdminAllAuthGuard)
  async postAdminSignout(@Req() req: Request) {
    try {
      const admin = req.user as AdminEntity;

      return await this.adminService.signoutAdmin(admin.id);
    } catch (error) {
      this.logger.error(error);
      throw new ApiHttpException(
        error.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
