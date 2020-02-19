import { BaseService } from '../index';

describe('BaseService', () => {

  it('getTotalPages should return the correct total pages create a correct BaseService class', () => {
    const baseService = new BaseService();

    expect(baseService.getTotalPages(10, 5)).toBe(2)
    expect(baseService.getTotalPages(2, 2)).toBe(1)
    expect(baseService.getTotalPages(0, 2)).toBe(0)
  })
})
