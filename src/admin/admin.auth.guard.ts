import {
  ExecutionContext,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from '../common/auth/auth.service';
import { ApiHttpException } from '../common/response/response-exception.filter';
import { AdminEntity } from '../entities/admin.entity';
import { AdminService } from '../services/admin/admin.service';
import { Request } from 'express';
import { ADMIN_ROLE } from '../constant';
import { CommonService } from '../services/common.service';

@Injectable()
export class AdminAllAuthGuard extends AuthGuard('jwt') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
    private adminService: AdminService,
    private commonService: CommonService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest<Request>();
    const httpMethod: string = request.method;
    const jwt: string = request.headers['authorization'];

    // jwt null check
    if (!jwt) {
      Logger.error('jwt is null');
      throw new ApiHttpException('jwt is null', HttpStatus.UNAUTHORIZED);
    }

    // jwt verify and expired check
    const payload = this.authService.verifyToken(jwt);
    if (!payload || payload.exp < Date.now() / 1000) {
      Logger.error('jwt is expired');
      throw new ApiHttpException('jwt is expired', HttpStatus.UNAUTHORIZED);
    }

    const adminInfo = await this.adminService.verifyAdminToken(jwt);

    request.user = adminInfo as AdminEntity;

    return true;
  }
}

@Injectable()
export class AdminSuperAuthGuard extends AuthGuard('jwt') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
    private commonService: CommonService,
    private adminService: AdminService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest<Request>();
    const httpMethod: string = request.method;
    const jwt: string = request.headers['authorization'];

    // jwt null check
    if (!jwt) {
      Logger.error('jwt is null');
      throw new ApiHttpException('jwt is null', HttpStatus.UNAUTHORIZED);
    }

    // jwt verify and expired check
    const payload = this.authService.verifyToken(jwt);
    if (!payload || payload.exp < Date.now() / 1000) {
      Logger.error('jwt is expired');
      throw new ApiHttpException('jwt is expired', HttpStatus.UNAUTHORIZED);
    }

    const adminInfo = await this.adminService.verifyAdminToken(jwt);

    if (adminInfo.role !== ADMIN_ROLE.SUPER) {
      throw new ApiHttpException(
        'Can not access[SURPER]',
        HttpStatus.FORBIDDEN,
      );
    }

    // ip check - is production environment
    if (this.configService.get('NODE_ENV') === 'production') {
      if (adminInfo.ip !== this.commonService.getIp(request)) {
        throw new ApiHttpException('Can not access[IP]', HttpStatus.FORBIDDEN);
      }
    }

    request.user = adminInfo as AdminEntity;

    return true;
  }
}

@Injectable()
export class AdminCustomerGuard extends AuthGuard('jwt') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
    private adminService: AdminService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest<Request>();
    const httpMethod: string = request.method;
    const jwt: string = request.headers['authorization'];

    // jwt null check
    if (!jwt) {
      Logger.error('jwt is null');
      throw new ApiHttpException('jwt is null', HttpStatus.UNAUTHORIZED);
    }

    // jwt verify and expired check
    const payload = this.authService.verifyToken(jwt);
    if (!payload || payload.exp < Date.now() / 1000) {
      Logger.error('jwt is expired');
      throw new ApiHttpException('jwt is expired', HttpStatus.UNAUTHORIZED);
    }

    const adminInfo = await this.adminService.verifyAdminToken(jwt);

    if (adminInfo.role === ADMIN_ROLE.EDITOR) {
      throw new ApiHttpException(
        'Can not access [EDITOR]',
        HttpStatus.FORBIDDEN,
      );
    }

    request.user = adminInfo as AdminEntity;

    return true;
  }
}

@Injectable()
export class AdminEditorGuard extends AuthGuard('jwt') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
    private adminService: AdminService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest<Request>();
    const httpMethod: string = request.method;
    const jwt: string = request.headers['authorization'];

    // jwt null check
    if (!jwt) {
      Logger.error('jwt is null');
      throw new ApiHttpException('jwt is null', HttpStatus.UNAUTHORIZED);
    }

    // jwt verify and expired check
    const payload = this.authService.verifyToken(jwt);
    if (!payload || payload.exp < Date.now() / 1000) {
      Logger.error('jwt is expired');
      throw new ApiHttpException('jwt is expired', HttpStatus.UNAUTHORIZED);
    }

    const adminInfo = await this.adminService.verifyAdminToken(jwt);

    if (adminInfo.role === ADMIN_ROLE.CUSTOMER) {
      throw new ApiHttpException(
        'Can not access[EDITOR / SUPER]',
        HttpStatus.FORBIDDEN,
      );
    }

    request.user = adminInfo as AdminEntity;

    return true;
  }
}

@Injectable()
export class AdminCommonGuard extends AuthGuard('jwt') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
    private adminService: AdminService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest<Request>();
    const httpMethod: string = request.method;
    const jwt: string = request.headers['authorization'];

    // jwt null check
    if (!jwt) {
      Logger.error('jwt is null');
      throw new ApiHttpException('jwt is null', HttpStatus.UNAUTHORIZED);
    }

    // jwt verify and expired check
    const payload = this.authService.verifyToken(jwt);
    if (!payload || payload.exp < Date.now() / 1000) {
      Logger.error('jwt is expired');
      throw new ApiHttpException('jwt is expired', HttpStatus.UNAUTHORIZED);
    }

    const adminInfo = await this.adminService.verifyAdminToken(jwt);

    if (adminInfo.role === ADMIN_ROLE.CUSTOMER) {
      throw new ApiHttpException(
        'Can not access[COMMON / SUPER]',
        HttpStatus.FORBIDDEN,
      );
    }

    request.user = adminInfo as AdminEntity;

    return true;
  }
}
