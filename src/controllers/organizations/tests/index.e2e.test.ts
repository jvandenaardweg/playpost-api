import supertest from 'supertest';
import { setupServer } from '../../../server';

const e2eTestBearerToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImU3ZTRjM2Y3LWQ2ODEtNGJiOS05NTdhLWExY2JlMDQ2Y2FiMCIsImVtYWlsIjoiam9yZHl2YW5kZW5hYXJkd2VnQGdtYWlsLmNvbSIsImlhdCI6MTU3NjMyMzE2MX0.p0gp5fKctsQ3T1p-11EZc8rVFTqOE6D0pQRnpY-bBLk';

const tests = [
  {
    route: '/v1/organizations',
    type: 'GET',
    authorized: (response: supertest.Response) => {
      expect(response.status).toBe(200)
      expect(response.body.data).toHaveLength(1)
      expect(response.body.data[0].name).toBeDefined() // Check for some basic data to verify the object exists
    },
    unauthorized: (response: supertest.Response) => {
      expect(response.status).toBe(403)
    }
  },
  {
    route: '/v1/organizations/97629636-b7ff-4766-8f9f-0742465682ba',
    type: 'GET',
    authorized: (response: supertest.Response) => {
      expect(response.status).toBe(200)
      expect(response.body.id).toBe('97629636-b7ff-4766-8f9f-0742465682ba')
    },
    unauthorized: (response: supertest.Response) => {
      expect(response.status).toBe(403)
    }
  },
  {
    route: '/v1/organizations/97629636-b7ff-4766-8f9f-0742465682bb',
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
    route: '/v1/organizations/97629636-b7ff-4766-8f9f-0742465682ba/publications',
    type: 'GET',
    authorized: (response: supertest.Response) => {
      expect(response.status).toBe(200)
      expect(response.body.data[0].name).toBeDefined() // Check for some basic data to verify the object exists
    },
    unauthorized: (response: supertest.Response) => {
      expect(response.status).toBe(403)
    }
  },
  {
    route: '/v1/organizations/97629636-b7ff-4766-8f9f-0742465682ba/users',
    type: 'GET',
    authorized: (response: supertest.Response) => {
      expect(response.status).toBe(200)
      expect(response.body.data[0].email).toBeDefined() // Check for some basic data to verify the object exists
    },
    unauthorized: (response: supertest.Response) => {
      expect(response.status).toBe(403)
    }
  },
  {
    route: '/v1/organizations/97629636-b7ff-4766-8f9f-0742465682ba/admin',
    type: 'GET',
    authorized: (response: supertest.Response) => {
      expect(response.status).toBe(200)
      expect(response.body.email).toBeDefined() // Check for some basic data to verify the object exists
    },
    unauthorized: (response: supertest.Response) => {
      expect(response.status).toBe(403)
    }
  },
  {
    route: '/v1/organizations/97629636-b7ff-4766-8f9f-0742465682ba/customer',
    type: 'GET',
    authorized: (response: supertest.Response) => {
      expect(response.status).toBe(200)
      expect(response.body.stripeCustomerId).toBeDefined() // Check for some basic data to verify the object exists
    },
    unauthorized: (response: supertest.Response) => {
      expect(response.status).toBe(403)
    }
  }
];

describe('/v1/organization', () => {
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
