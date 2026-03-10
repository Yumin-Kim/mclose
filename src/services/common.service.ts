import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { parse } from 'path';
import { Request } from 'express';
import * as moment from 'moment';
import 'moment/locale/ko';

@Injectable()
export class CommonService {
  constructor() { }
  // previouse object merge next object
  mergeObjects(
    prevObj: Record<string, any>,
    newObj: Record<string, any>,
  ): void {
    // a의 각 키에 대해 반복
    Object.keys(prevObj).forEach((key) => {
      if (key in newObj) {
        prevObj[key] = newObj[key];
      }
    });

    // b의 각 키에 대해 반복
    Object.keys(newObj).forEach((key) => {
      if (!(key in prevObj)) {
        prevObj[key] = newObj[key];
      }
    });
  }

  /**
   * @description convert last time format
   * @param compareDate "2023-11-20T17:40:07.000Z"
   * @returns 1 Day Ago ....
   */
  convertLastTimeFormat(compareDate: Date): string {
    const currentDate: Date = new Date();
    const difference: number = currentDate.getTime() - compareDate.getTime();

    const daysDifference: number = Math.floor(
      difference / (1000 * 60 * 60 * 24),
    );
    const hoursDifference: number = Math.floor(difference / (1000 * 60 * 60));
    const minutesDifference: number = Math.floor(difference / (1000 * 60));

    if (daysDifference > 0) {
      return `${daysDifference} Day${daysDifference > 1 ? 's' : ''} Ago`;
    } else if (hoursDifference > 0) {
      return `${hoursDifference} Hour${hoursDifference > 1 ? 's' : ''} Ago`;
    } else if (minutesDifference > 0) {
      return `${minutesDifference} Minute${minutesDifference > 1 ? 's' : ''
        } Ago`;
    } else {
      return 'Just now';
    }
  }

  /**
   * @description convert date format
   * @param date "2023-11-20T17:40:07.000Z"
   * @returns YYYY.MM.DD HH:MM:SS
   */
  convertDateAndTimeFormat(date: Date, contryCode = 'ko'): string {
    moment.locale(contryCode);
    return moment(date).format('YYYY.MM.DD HH:mm:ss');
  }

  convertDateFormat(date: Date, contryCode = 'ko'): string {
    moment.locale(contryCode);
    return moment(date).format('YYYY.MM.DD');
  }

  // snake_case to camelCase
  convertSnakeCaseToCamelCase<T>(obj: any): T {
    const converted: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const camelCaseKey = key.replace(/_([a-z])/g, (match, letter) =>
          letter.toUpperCase(),
        );
        converted[camelCaseKey] = obj[key];
      }
    }
    return converted;
  }

  // camelCase to snake_case
  convertCamelCaseToSnakeCase<T>(obj: any): T {
    const converted: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const snakeCaseKey = key.replace(
          /[A-Z]/g,
          (letter) => '_' + letter.toLowerCase(),
        );
        converted[snakeCaseKey] = obj[key];
      }
    }
    return converted;
  }

  async requestApi(
    url: string,
    method: 'GET' | 'POST',
    body?: any,
    contentType = 'application/json',
  ): Promise<any> {
    try {
      if (method === 'GET') {
        return await axios.get(url);
      } else {
        return await axios.post(url, body, {
          headers: {
            'Content-Type': contentType,
          },
        });
      }
    } catch (error) {
      Logger.error(error);
      if (error.response) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error(error.message);
      }
    }
  }

  setFilename(uploadedFile: Express.Multer.File): string {
    const fileName = parse(uploadedFile.originalname);
    return `${fileName.name
      .replaceAll(' ', '_')
      .replaceAll(/[^a-zA-Z0-9]/g, '')}-${Date.now()}${fileName.ext}`
      .replace(/^\.+/g, '')
      .replace(/^\/+/g, '')
      .replace(/\r|\n/g, '_');
  }

  sortData(arr) {
    // 숫자로 정렬
    arr.sort((a, b) => {
      // 알파벳 이전에 나오는 숫자들만 비교
      const numA = parseInt(a.category.match(/\d+/)[0]);
      const numB = parseInt(b.category.match(/\d+/)[0]);
      return numA - numB;
    });

    // 숫자로 정렬된 배열에서 알파벳으로 정렬
    arr.sort((a, b) => {
      const numA = parseInt(a.category.match(/\d+/)[0]);
      const numB = parseInt(b.category.match(/\d+/)[0]);
      if (numA === numB) {
        // 숫자가 같으면 알파벳순으로 정렬
        const letterA = a.category.match(/[A-Z]+/)[0];
        const letterB = b.category.match(/[A-Z]+/)[0];
        return letterA.localeCompare(letterB);
      }
      // 숫자가 다르면 이미 숫자로 정렬된 상태 유지
      return 0;
    });
  }

  // header ip 가져오기
  getIp(req: Request) {
    const defaultIp = req.headers['x-forwarded-for'] as string;

    const requestIp = defaultIp
      ? defaultIp.split(',')[0]
      : (req as any).connection.remoteAddress;

    // 로컬에서 테스트시 ip가 ::1로 나오는 경우가 있음
    const isLocal = requestIp === '::1';
    if (isLocal) {
      return '127.0.0.1';
    }
    return requestIp.replace('::ffff:', '');
  }

  toNumber(x: any): string {
    if (!x || x == "-") return x;
    if (!x || x === 0 || x === "0") return "0";
    return Number(x)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  base64ToBuffer(base64: string): Buffer {
    if (!base64) {
      return null;
    }

    const isVerifyFormat = base64.match(
      /^data:image\/([a-zA-Z]+);base64,(.+)$/,
    );
    if (!isVerifyFormat) {
      return null;
    }

    return Buffer.from(base64, 'base64');
  }

  startOfDay(string: string): Date {
    const date = moment(string).format('YYYY-MM-DD');
    return new Date(`${date}T00:00:00.000Z`);
  }

  // retrun end of day 23:59:59
  endOfDay(string: string): Date {
    const date = moment(string).format('YYYY-MM-DD');
    return new Date(`${date}T23:59:59.000Z`);
  }

  toDateFormat(date: string, format: string = "YYYY.MM.DD"): string {
    return moment(date).format(format);
  }
}
