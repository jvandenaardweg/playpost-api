
export class BaseService {
  getTotalPages(total: number, perPage: number): number {
    if (total === perPage) {
      return 1
    }

    return Math.ceil(total / perPage);
  }
}
