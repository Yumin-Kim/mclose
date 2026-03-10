import { PageRequest } from '../common/response/response-page';

export class SupportQueryDto extends PageRequest {
  keyword?: string;
  date_from?: string;
  date_to?: string;
  sort_by?: string;
}

export class SupportCustomerDto {
  id?: string;
  email?: string;
  realName?: string;
  phoneNo?: string;
  type?: string;
  content?: string;
  status?: string;
  responseContent?: string;
  typeText?: string;
}

export class SupportBussinessDto {
  id?: string;
  realName?: string;
  phoneNo?: string;
  email?: string;
  content?: string;
  companyNo?: string;
  companyName?: string;
  companyPartName?: string;
  isOptionalRequired?: boolean;
}
