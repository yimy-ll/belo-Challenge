export class PaginatedResponseDto<T> {
  list: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };

  constructor(list: T[], total: number, page: number, limit: number) {
    const totalPages = Math.ceil(total / limit);
    this.list = list;
    this.meta = {
      total,
      page,
      limit,
      totalPages,
      hasPreviousPage: page > 1,
      hasNextPage: page < totalPages,
    };
  }
}
