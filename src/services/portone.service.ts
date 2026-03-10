/**
 * 결제 요청 API https://developers.portone.io/docs/ko/sdk/javascript-sdk/payrq?v=v1
 * desc https://developers.portone.io/api/rest-v1/payment.validation?v=v1#post%20%2Fpayments%2Fprepare
 * 결제 대행사 코드 https://developers.portone.io/docs/ko/tip/pg-2?v=v1
 * 결제 대행사별 은행 코드 https://developers.portone.io/docs/ko/tip/pg-1?v=v1
 * 포트원이란?
 * 포트원은 PG사가 아닙니다. 포트원은 다양한 PG사의 결제 서비스를 쉽게 통합하고 관리할 수 있도록 지원하는 결제 플랫폼입니다. 여러 PG사의 서비스를 하나의 인터페이스로 사용할 수 있게 해줍니다.
 * 국내 PG사란?
 * 국내 주요 PG사에는 다음과 같은 회사들이 있습니다: 1. 카카오페이 2. 네이버페이 3. 토스 4. 이니시스 5. KCP 6. LG U+ 7. 페이코 8. 삼성페이
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import axios from 'axios';

@Injectable()
export class PortoneService {
  private PORTONE_KEY: null | string = null;
  private PORTONE_SECRET: null | string = null;
  private PORTONE_TOKEN: null | string = null;
  private logger = new Logger(PortoneService.name);

  constructor(private readonly configService: ConfigService) {
    this.PORTONE_KEY = this.configService.get<string>('PORTONE_KEY') || null;
    this.PORTONE_SECRET =
      this.configService.get<string>('PORTONE_SECRET') || null;

    this.init();
  }

  init() {
    if (!this.PORTONE_KEY || !this.PORTONE_SECRET) {
      this.logger.error('PORTONE_KEY or PORTONE_SECRET is null');
      return;
    }

    this.updateToken().then(() => {
      this.logger.log('PORTONE_TOKEN is updated');

      // 30분마다 토큰 갱신
      setInterval(
        async () => {
          await this.updateToken();
          this.logger.log('PORTONE_TOKEN is updated');
        },
        1000 * 60 * 29,
      );
    });
  }

  /**
   * portone token update
   * @returns
   */
  async updateToken() {
    try {
      if (!this.PORTONE_KEY || !this.PORTONE_SECRET) {
        this.logger.error('PORTONE_KEY or PORTONE_SECRET is null');
        return null;
      }

      const response = await axios({
        url: 'https://api.iamport.kr/users/getToken',
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          imp_key: this.PORTONE_KEY,
          imp_secret: this.PORTONE_SECRET,
        },
      });

      if (response.data.code !== 0) {
        this.logger.error('PORTONE_TOKEN is null');
        return null;
      }

      this.PORTONE_TOKEN = response.data.response.access_token;
    } catch (e) {
      console.log(e);
      this.logger.error(e);
      return null;
    }
  }

  /**
   * 결제 준비
   * @param merchantUid
   * @param amount
   * @returns
   */
  async prepare(merchantUid: string, amount: number) {
    try {
      if (!this.PORTONE_TOKEN) {
        this.logger.error('PORTONE_TOKEN is null');
        return null;
      }
      const response = await axios({
        url: 'https://api.iamport.kr/payments/prepare',
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          'X-ImpTokenHeader': this.PORTONE_TOKEN,
        },
        data: {
          merchant_uid: merchantUid,
          amount,
        },
      });

      if ((response.data.code as number) !== 0) {
        this.logger.error('Failed to prepare payment');
        return null;
      }

      this.logger.log('Success to prepare payment');
      return response.data.response.merchant_uid as string;
    } catch (e) {
      console.log(e);
      this.logger.error(e);
      return null;
    }
  }

  /**
   * 입금자 확인
   * TODO: 결제 대해사별 은행사 코드 상이하다.
   * @param bankCode https://developers.portone.io/docs/ko/tip/pg-1?v=v1
   * @param bankNum
   * @returns
   */
  async getBankHolder(bankCode: string, bankNum: string) {
    try {
      if (!this.PORTONE_TOKEN) {
        this.logger.error('PORTONE_TOKEN is null');
        return null;
      }

      const response = await axios({
        url: `https://api.iamport.kr/vbanks/holder?bank_code=${bankCode}&bank_num=${bankNum}`,
        method: 'get',
        headers: {
          'Content-Type': 'application/json',
          'X-ImpTokenHeader': this.PORTONE_TOKEN,
        },
      });

      if (response.data.code !== 0) {
        this.logger.error('Bank Holder is null');
        return null;
      }

      return response.data.response.bank_holder as any;
    } catch (error) {
      console.log(error);
      this.logger.error(error);
      return null;
    }
  }

  async getPaymentByMerchantUUID(merchantUUID: string) {
    try {
      if (!this.PORTONE_TOKEN) {
        this.logger.error('PORTONE_TOKEN is null');
        return null;
      }

      const response = await axios({
        url: `https://api.iamport.kr/payments/${merchantUUID}`,
        method: 'get',
        headers: {
          'Content-Type': 'application/json',
          'X-ImpTokenHeader': this.PORTONE_TOKEN,
        },
      });

      if (response.data.code !== 0) {
        this.logger.error('Payment is null');
        return null;
      }

      return response.data.response as any;
    } catch (error) {
      console.log(error);
      this.logger.error(error);
      return null;
    }
  }

  // TODO : 결제 취소
  // https://developers.portone.io/api/rest-v1/payment?v=v1#post%20%2Fpayments%2Fcancel
  async cancel() {}
}
