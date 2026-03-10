import { ILike } from 'typeorm';

export const getSort = (property?: string, direction?: string) => {
  return property && direction ? { [property]: direction } : undefined;
};

export const getWhere = (property: string, keyword: string) => {
  return { [property]: ILike(`%${keyword}%`) };
};
