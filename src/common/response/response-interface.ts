export interface IExceptionResponse {
  retCode: number;
  msg: string;
  command: string;
}

export interface IApiResponse {
  retCode: number;
  msg: string;
  data: any;
  command: string;
}
