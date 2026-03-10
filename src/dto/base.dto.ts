import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { PageRequest } from '../common/response/response-page';

export class BaseCreateDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  realName?: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  videoUrl?: string;

  @IsString()
  @IsOptional()
  isUsed?: string;

  @IsString()
  @IsOptional()
  imageAltText?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  subCategory?: string;

  @IsString()
  @IsOptional()
  ImageAltJson?: string;

  iumageUrl?: string;
}

export class BaseUpdateDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  realName?: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  videoUrl?: string;

  @IsString()
  @IsOptional()
  isUsed?: string;

  @IsString()
  @IsOptional()
  imageAltText?: string;

  @IsString()
  @IsOptional()
  ImageAltJson?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  subCategory?: string;

  iumageUrl?: string;
}

export class BaesSearchDto extends PageRequest {
  category?: string;
  keyword?: string;
  date_from?: string;
  date_to?: string;
}
