import {
  BadRequestException,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import { Request } from 'express';

export interface Sorting {
  property: string;
  direction: string;
}

export const SortingParams = createParamDecorator(
  (_, ctx: ExecutionContext): Sorting | undefined => {
    const req: Request = ctx.switchToHttp().getRequest();
    const sort = req.query.sort as string;
    if (!sort) return;

    // check the format of the sort query param
    const sortPattern = /^([a-zA-Z0-9]+):(asc|desc)$/;
    if (!sort.match(sortPattern))
      throw new BadRequestException('Invalid sort parameter');

    // extract the property name and direction and check if they are valid
    const [property, direction] = sort.split(':');

    return { property, direction };
  },
);
