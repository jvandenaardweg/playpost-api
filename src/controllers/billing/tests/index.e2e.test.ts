import supertest from 'supertest';
import { setupServer } from '../../../server';

const e2eTestBearerToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImU3ZTRjM2Y3LWQ2ODEtNGJiOS05NTdhLWExY2JlMDQ2Y2FiMCIsImVtYWlsIjoiam9yZHl2YW5kZW5hYXJkd2VnQGdtYWlsLmNvbSIsImlhdCI6MTU3NjMyMzE2MX0.p0gp5fKctsQ3T1p-11EZc8rVFTqOE6D0pQRnpY-bBLk';

const tests = [
  {
    route: '/v1/billing/plans',
    type: 'GET',
    authorized: (response: supertest.Response) => {
      expect(response.status).toBe(200)
      expect(response.body[0].object).toBe('plan')
    },
    unauthorized: (response: supertest.Response) => {
      expect(response.status).toBe(403)
    }
  },
  {
    route: '/v1/billing/plans/plan_GLVHSLbMkT1UX8',
    type: 'GET',
    authorized: (response: supertest.Response) => {
      expect(response.status).toBe(200)
      expect(response.body.object).toBe('plan')
    },
    unauthorized: (response: supertest.Response) => {
      expect(response.status).toBe(403)
    }
  },
  {
    route: '/v1/billing/plans/plan_GLVHSLbMkT1UX8_unknown',
    type: 'GET',
    authorized: (response: supertest.Response) => {
      expect(response.status).toBe(404)
      expect(response.body.message).toBeDefined()
    },
    unauthorized: (response: supertest.Response) => {
      expect(response.status).toBe(403)
    }
  },
  {
    route: '/v1/billing/products',
    type: 'GET',
    authorized: (response: supertest.Response) => {
      expect(response.status).toBe(200)
      expect(response.body[0].object).toBe('product')
    },
    unauthorized: (response: supertest.Response) => {
      expect(response.status).toBe(403)
    }
  },
  {
    route: '/v1/billing/products/prod_GNoXV2xtX4zdOI',
    type: 'GET',
    authorized: (response: supertest.Response) => {
      expect(response.status).toBe(200)
      expect(response.body.object).toBe('product')
    },
    unauthorized: (response: supertest.Response) => {
      expect(response.status).toBe(403)
    }
  },
  {
    route: '/v1/billing/products/prod_GNoXV2xtX4zdOI_unknown',
    type: 'GET',
    authorized: (response: supertest.Response) => {
      expect(response.status).toBe(404)
      expect(response.body.message).toBeDefined()
    },
    unauthorized: (response: supertest.Response) => {
      expect(response.status).toBe(403)
    }
  },
  {
    route: '/v1/billing/tax-rates',
    type: 'GET',
    authorized: (response: supertest.Response) => {
      expect(response.status).toBe(200)
      expect(response.body[0].object).toBe('tax_rate')
    },
    unauthorized: (response: supertest.Response) => {
      expect(response.status).toBe(403)
    }
  },
  {
    route: '/v1/billing/tax-rates/txr_1Fqzv1LbygOvfi9oYJqZckKS',
    type: 'GET',
    authorized: (response: supertest.Response) => {
      expect(response.status).toBe(200)
      expect(response.body.object).toBe('tax_rate')
    },
    unauthorized: (response: supertest.Response) => {
      expect(response.status).toBe(403)
    }
  },
  {
    route: '/v1/billing/tax-rates/txr_1Fqzv1LbygOvfi9oYJqZckKS_unknwon',
    type: 'GET',
    authorized: (response: supertest.Response) => {
      expect(response.status).toBe(404)
      expect(response.body.message).toBeDefined()
    },
    unauthorized: (response: supertest.Response) => {
      expect(response.status).toBe(403)
    }
  }
];

describe('/v1/billing', () => {
  let server: Express.Application;

  beforeAll(async () => {
    server = await setupServer()
  });

  // Authorized tests with Bearer token
  tests.map(test => {
    let response: supertest.Response;

    beforeAll(async () => {
      response = await supertest(server)
      .get(test.route)
      .set('Authorization', `Bearer ${e2eTestBearerToken}`)
    });

    describe('Authorized', () => {
      it(`${test.type} ${test.route}`, () => {
        test.authorized(response);
      });
    });
  })

  // Unauthorized tests (anonymous)
  tests.map(test => {
    let response: supertest.Response;

    beforeAll(async () => {
      response = await supertest(server)
      .get(test.route)
    });

    describe('Unauthorized', () => {
      it(`${test.type} ${test.route}`, () => {
        test.unauthorized(response);
      });
    });
  });
})
