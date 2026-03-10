import {
  BadRequestException,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import { Request } from 'express';

export interface Pagination {
  page: number;
  size: number;
}

export const PaginationParams = createParamDecorator(
  (_, ctx: ExecutionContext): Pagination => {
    if (ctx === undefined) return { page: 0, size: 20 };

    const req: Request = ctx.switchToHttp().getRequest();
    const page = req.query.page ? parseInt(req.query.page as string) : 0;
    const size = req.query.size ? parseInt(req.query.size as string) : 20;

    // check if page and size are valid
    if (isNaN(page) || page < 0 || isNaN(size) || size < 0) {
      throw new BadRequestException('Invalid pagination params');
    }
    // do not allow to fetch large slices of the dataset
    if (size > 100) {
      throw new BadRequestException(
        'Invalid pagination params: Max size is 100',
      );
    }
    return { page, size };
  },
);
