import { HttpStatus, Injectable } from '@nestjs/common';
import { AdminRepository } from '../../repositories/admin.repository';
import { AuthService } from '../../common/auth/auth.service';
import {
  IAdminItemRes,
  IInitializeAdminRes,
  TAdminInfoRes,
  TCreateAdminRes,
} from '../../interfaces/admin.interface';
import {
  CreateAdminDto,
  SearchAdminDto,
  SigninAdminDto,
  UpdateAdminDto,
} from '../../dto/admin.dto';
import { ApiHttpException } from '../../common/response/response-exception.filter';
import { AdminEntity } from '../../entities/admin.entity';
import { PagenationRes } from '../../common/response/response-page';
import { CommonService } from '../../services/common.service';
import { In } from 'typeorm';

@Injectable()
export class AdminService {
  ADMIN_JWT_EXPIRE = '70d';

  constructor(
    private adminRepository: AdminRepository,
    private authService: AuthService,
    private commonService: CommonService,
  ) { }

  /**
   * admin 생성
   * @param createAdminDto
   * @returns
   */
  async adminSignup(createAdminDto: CreateAdminDto): Promise<TCreateAdminRes> {
    const round = this.authService.randomInt(2, 16);
    const loginPwInfo = this.authService.roundPassword(
      createAdminDto.hashPassword,
      round,
    );

    // 중복 체크
    const adminDuplicate = await this.adminRepository.findAdminByLoginId(
      createAdminDto.loginId,
    );
    if (adminDuplicate) {
      throw new ApiHttpException('Exist Admin User', HttpStatus.CONFLICT);
    }

    // admin 생성
    const newEntityData = AdminEntity.createAdmin({
      loginId: createAdminDto.loginId,
      loginPw: loginPwInfo,
      pwRound: round,
      realName: createAdminDto.realName,
      email: createAdminDto.email,
      role: createAdminDto.role,
      nickName: createAdminDto.nickName,
      ip: createAdminDto.ip,
      phoneNo: createAdminDto.phoneNo,
    });
    const newEntity = await this.adminRepository.save(newEntityData);

    return {
      id: newEntity.id,
      loginId: newEntity.loginId,
    };
  }

  async changeAdminPin(adminEntity: AdminEntity, pin: string) {
    const round = this.authService.randomInt(2, 16);
    const loginPwInfo = this.authService.roundPassword(pin, round);

    adminEntity.updatePasswordInfo(loginPwInfo, round);

    return await this.adminRepository.save(adminEntity);
  }

  // admin list 조회
  async getAdminList(page, limit) {
    const [list, total] = await this.adminRepository.findAndCount({
      skip: page,
      take: limit,
      order: {
        id: 'DESC',
      },
    });

    return new PagenationRes(page, limit, total, list);
  }

  /**
   * jwt 검증(변조 및 기간 검증)
   * @param jwt
   * @returns
   */
  async verifyAdminToken(jwt: string): Promise<TAdminInfoRes> {
    const payload = this.authService.verifyToken(jwt);
    if (!payload) {
      throw new ApiHttpException('jwt is expired', HttpStatus.NOT_FOUND);
    }

    const adminEntity = await this.adminRepository.findOne({
      where: {
        id: payload.id,
        jwt: jwt,
      },
    });

    if (!adminEntity) {
      throw new ApiHttpException('Check admin jwt', HttpStatus.NOT_FOUND);
    }

    return adminEntity;
  }

  /**
   * jwt 갱신
   * @param adminId
   * @returns
   */
  async updateAdminToken(adminJwt: string): Promise<TAdminInfoRes> {
    const adminResult = await this.adminRepository.findOne({
      where: {
        jwt: adminJwt,
      },
    });
    if (!adminResult) {
      throw new ApiHttpException('Not found Admin info', HttpStatus.NOT_FOUND);
    }

    const refreshJwt = this.authService.generateJWTToken(
      {
        id: adminResult.id,
        loginId: adminResult.loginId,
        realName: adminResult.realName,
        email: adminResult.email,
      },
      this.ADMIN_JWT_EXPIRE,
    );

    await this.adminRepository.update(adminResult.id, { jwt: refreshJwt });

    return {
      id: adminResult.id,
      loginId: adminResult.loginId,
      realName: adminResult.realName,
      email: adminResult.email,
      jwt: refreshJwt,
      role: adminResult.role,
      createdAt: adminResult.createdAt,
      updatedAt: adminResult.updatedAt,
      nickName: adminResult.nickName,
    };
  }

  // admin 정보 수정
  async updateAdminInfo(
    updateAdminDto: UpdateAdminDto,
    adminEntity: AdminEntity,
  ) {
    adminEntity.updateAdminInfo(updateAdminDto);

    return await this.adminRepository.save(adminEntity);
  }

  /**
   * admin 정보 조회
   * @param adminId
   * @returns
   */
  async getAdminInfo(adminId: number): Promise<TAdminInfoRes> {
    const admin = await this.adminRepository.findById(adminId);

    if (!admin) {
      throw new ApiHttpException('Check admin jwt', HttpStatus.NOT_FOUND);
    }

    return {
      id: admin.id,
      loginId: admin.loginId,
      realName: admin.realName,
      email: admin.email,
      role: admin.role,
      ip: admin.allowIp,
      phoneNo: admin.phoneNo,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
      nickName: admin.nickName,
    };
  }

  /**
   *
   * @param signinAdminDto
   */
  async signinAdmin(signinAdminDto: SigninAdminDto): Promise<TAdminInfoRes> {
    const adminResult = await this.adminRepository.findAdminByLoginId(
      signinAdminDto.loginId,
    );

    if (!adminResult) {
      throw new ApiHttpException('Not Found Admin User', HttpStatus.NOT_FOUND);
    }

    const securePassRound = (signinAdminDto.nonce % 15) + 2;
    const verified = this.authService.verifySecurePassword(
      signinAdminDto.loginPw,
      securePassRound,
      adminResult.loginPw,
      adminResult.pwRound,
    );
    if (!verified) {
      throw new ApiHttpException('Check Password', HttpStatus.NOT_FOUND);
    }
    if (adminResult.allowIp !== signinAdminDto.ip) {
      throw new ApiHttpException('Check IP', HttpStatus.NOT_FOUND);
    }

    const jwt = this.authService.generateJWTToken(
      {
        id: adminResult.id,
        loginId: adminResult.loginId,
        realName: adminResult.realName,
        email: adminResult.email,
      },
      this.ADMIN_JWT_EXPIRE,
    );

    await this.adminRepository.update(adminResult.id, {
      jwt,
    });

    return {
      id: adminResult.id,
      loginId: adminResult.loginId,
      realName: adminResult.realName,
      email: adminResult.email,
      jwt,
      role: adminResult.role,
      createdAt: adminResult.createdAt,
      updatedAt: adminResult.updatedAt,
      nickName: adminResult.nickName,
    };
  }

  /**
   * 초기 관리자 생성
   * @param loginId
   * @returns
   */
  async initializeAdmin(
    ip,
    loginId: string,
  ): Promise<IInitializeAdminRes | TCreateAdminRes> {
    const initalAdmin = await this.adminRepository.findOne({
      where: {
        loginId: loginId,
      },
    });

    // 초기 관리자가 없으면 생성
    if (initalAdmin) {
      return {
        id: initalAdmin.id,
        loginId: initalAdmin.loginId,
      };
    } else {
      const initialPassword = this.authService.randomInt(100000, 999999);
      const round = this.authService.randomInt(2, 16);
      const loginPwInfo = this.authService.makeSafePassword(
        initialPassword.toString(),
        round,
      );

      const newEntityData = AdminEntity.createAdmin({
        loginId: loginId,
        loginPw: loginPwInfo,
        pwRound: round,
        realName: 'admin',
        email: loginId,
        role: 'SUPER',
        nickName: 'admin',
        phoneNo: '',
        ip,
      });

      await this.adminRepository.save(newEntityData);

      return {
        id: newEntityData.id,
        loginId: newEntityData.loginId,
        email: newEntityData.email,
        password: initialPassword.toString(),
      };
    }
  }

  async signoutAdmin(adminId: number) {
    const admin = await this.adminRepository.findById(adminId);
    if (!admin) {
      throw new ApiHttpException('Not Found Admin User', HttpStatus.NOT_FOUND);
    }

    await this.adminRepository.update(adminId, {
      jwt: '',
      lastActivitedAt: () => 'CURRENT_TIMESTAMP',
    });
  }

  async deleteAdmin(idList: number[]) {
    const isDelete = await this.adminRepository.delete({
      id: In(idList)
    });

    return isDelete.affected;
  }

  // admin entity 조회
  async getAdminEntity(adminId: number): Promise<AdminEntity | null> {
    const adminEntity = await this.adminRepository.findById(adminId);

    if (adminEntity) {
      return adminEntity;
    } else {
      return null;
    }
  }
}
