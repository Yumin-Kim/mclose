import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { PageRequest } from '../common/response/response-page';

export class CreateAdminDto {
  @IsString()
  loginId: string;

  @IsString()
  @IsNotEmpty()
  hashPassword: string;

  @IsString()
  @IsNotEmpty()
  realName: string;

  @IsString()
  @IsNotEmpty()
  nickName: string;

  @IsString()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  role: string;

  @IsString()
  ip: string;

  @IsString()
  @IsOptional()
  phoneNo: string;
}

export class UpdateAdminDto {
  @IsString()
  @IsOptional()
  loginId: string;

  @IsString({
    message: 'realName is required',
  })
  @IsOptional()
  realName: string;

  @IsEmail()
  @IsOptional()
  email: string;

  @IsOptional()
  role: string;

  @IsString()
  @IsOptional()
  nickName: string;

  @IsString()
  @IsOptional()
  ip: string;
}

export class SigninAdminDto {
  @IsString({
    message: 'loginId is required',
  })
  loginId: string;

  @IsNotEmpty()
  loginPw: string;

  @IsNumber()
  nonce: number;

  ip: string;
}

export class SearchAdminDto extends PageRequest {
  @IsString()
  @IsOptional()
  real_name: string;

  @IsString()
  @IsOptional()
  email: string;

  @IsOptional()
  role: string;
}
class SearchDto extends PageRequest {
  @IsString()
  @IsOptional()
  date_from: string;

  @IsString()
  @IsOptional()
  date_to: string;
}

export class SearchUserDto extends SearchDto {
  @IsString()
  @IsOptional()
  real_name: string;

  @IsString()
  @IsOptional()
  login_id: string;

  @IsString()
  @IsOptional()
  phone_no: string;
}

export class SearchPaymentDto extends SearchDto {
  @IsString()
  @IsOptional()
  currency: string; // all , cl , os

  @IsString()
  @IsOptional()
  status: string; // all , 'PENDING', 'PROGRESS', 'CONFIRMED', 'CANCELED'

  @IsString()
  @IsOptional()
  real_name: string;

  @IsString()
  @IsOptional()
  login_id: string;

  @IsString()
  @IsOptional()
  title: string;
}

export class SearchMarketDto extends SearchDto {
  @IsString()
  @IsOptional()
  login_id: string;

  @IsString()
  @IsOptional()
  real_name: string;

  @IsString()
  @IsOptional()
  title: string;
}

export class SearchStockDto extends SearchDto {
  @IsString()
  @IsOptional()
  login_id: string;

  @IsString()
  @IsOptional()
  real_name: string;

  @IsString()
  @IsOptional()
  title: string;
}

export class SearchSupportDto extends SearchDto {
  @IsString()
  @IsOptional()
  login_id: string;

  @IsString()
  @IsOptional()
  real_name: string;

  @IsString()
  @IsOptional()
  status: string; // 'PENDING', 'PROGRESS', 'CONFIRMED', 'CANCELED'
}

export class SearchFaqDto extends SearchDto {}

export class FaqDto {
  @IsString()
  @IsOptional()
  title: string;

  @IsString()
  @IsOptional()
  content: string;

  @IsArray()
  @IsOptional()
  idList: number[];
}
