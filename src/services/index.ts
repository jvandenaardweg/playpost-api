export class BaseService {
  getTotalPages(total: number, perPage: number): number {
    return Math.ceil(total / perPage);
  }
}
