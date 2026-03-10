export interface PaymentDto {
  id: number;
  currency: string;
  impUid: string;
  merchantUid: string;
  payMethod: string;
  pgProvider: string;
  amount: number;
  status: string;
  paidAt: string;
  errorMsg: string;
  errorCode: string;
  chargeAmount: number;
}
