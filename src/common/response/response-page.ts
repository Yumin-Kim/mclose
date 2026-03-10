import { Type } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';

export class PagenationRes<T> {
  pageSize: number;
  totalCount: number;
  totalPage: number;
  itemList: T;
  isLast: boolean;
  currentPage: number;

  constructor(
    currentPage: number,
    pageSize: number,
    totalCount: number,
    data: T,
  ) {
    const totalPage = Math.ceil(totalCount / pageSize);

    this.pageSize = pageSize;
    this.totalCount = totalCount;
    this.totalPage = totalPage > 0 ? totalPage - 1 : 0;
    this.itemList = data;
    this.currentPage = currentPage;
    this.isLast = this.currentPage >= this.totalPage;
  }
}

export class PageRequest {
  @Type(() => Number)
  page?: number | 0;

  @Type(() => Number)
  page_size: number | 20;

  getOffset(): number {
    if (this.page < 0 || this.page === null || this.page === undefined) {
      this.page = 0;
    }

    if (
      this.page_size < 0 ||
      this.page_size === null ||
      this.page_size === undefined
    ) {
      this.page_size = 20;
    }

    return (Number(this.page) - 0) * Number(this.page_size);
  }

  getLimit(): number {
    if (
      this.page_size < 0 ||
      this.page_size === null ||
      this.page_size === undefined
    ) {
      this.page_size = 20;
    }
    return Number(this.page_size);
  }
}
