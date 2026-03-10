import { ICommonEntity } from '../common/database/common-entity.interface';
export type TAdminRole = 'SUPER' | 'CLIENT' | 'USER';

export interface IAdminEntity extends ICommonEntity {
  loginId: string;
  loginPw: string;
  pwRound: number;
  realName: string;
  nickName: string;
  email: string;
  role: string;
  jwt?: string;
  ip?: string;
  phoneNo?: string;
}

export interface ICreateAdminData {
  loginId: string;
  loginPw: string;
  pwRound: number;
  realName: string;
  email: string;
  jwt: string;
}

export interface IInitializeAdminRes {
  id: number;
  loginId: string;
  email: string;
  password: string;
  jwt: string;
}
export interface IAdminJwtPayload extends Express.User {
  id?: number;
  loginId?: string;
  realName?: string;
  email?: string;
}

export type TCreateAdminData = Omit<
  IAdminEntity,
  'id' | 'createdAt' | 'updatedAt'
>;
export type TCreateAdminRes = Pick<IAdminEntity, 'loginId' | 'id'>;
export type TAdminInfoRes = Omit<IAdminEntity, 'loginPw' | 'pwRound'>;

export interface IAdminItemRes {
  id: number;
  loginId: string;
  realName: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  nickName: string;
}

export interface IUserItemRes {
  id: number;
  loginId: string;
  email: string;
  description: string;
  iconUrl: string;
  isActivated: boolean;
  lastActivatedAt: string;
  regType: string;
  createdAt: string;
  updatedAt: string;
  nickName: string;
}
