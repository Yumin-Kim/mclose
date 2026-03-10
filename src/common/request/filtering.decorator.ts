import {
  BadRequestException,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import { Request } from 'express';

export interface Filtering {
  properties?: string[];
  value?: string;
  start?: string;
  end?: string;
}

export const FilteringParams = createParamDecorator(
  (data, ctx: ExecutionContext): Filtering | undefined => {
    const req: Request = ctx.switchToHttp().getRequest();
    const p = data as string[];
    const value = req.query.keyword as string;
    const start = req.query.start_date as string;
    const end = req.query.end_date as string;

    if ((!start && end) || (start && !end))
      throw new BadRequestException(
        'Invalid filtering params: start_date is missing',
      );
    if (start > end)
      throw new BadRequestException(
        'Invalid filtering params: start_date is greater than end_date',
      );

    const properties = value ? p : undefined;

    if (!properties && !value && !start && !end) return;
    else return { properties, value, start, end };
  },
);
