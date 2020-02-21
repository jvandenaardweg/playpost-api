const { version } = require('./package.json');

module.exports = {
  info: {
    title: 'Playpost API',
    description: 'This is the documentation of the Playpost API',
    version,
    termsOfService: 'https://playpost.app/terms',
    contact: {
      name: 'API Support',
      url: 'https://playpost.app/support',
      email: 'support@playpost.app'
    },
  },
  openapi: '3.0.3',
  servers: [
    {
      url: 'http://localhost:3000/v1',
      description: 'Development server'
    },
    {
      url: 'https://api.playpost.app/v1',
      description: 'Production server'
    },
    {
      url: 'https://playpost-api-test.herokuapp.com/v1',
      description: 'Test server'
    }
  ],
  components: {},
  tags: [
    {
      name: 'auth',
      description: '(public) Endpoint for logging in and requesting new passwords.'
    },
    {
      name: 'users',
      description: '(public) Endpoint for the currently logged in user.'
    },
    {
      name: 'countries',
      description: '(public) Countries related endpoints.'
    },
    {
      name: 'billing',
      description: 'Billing related endpoints. Mostly Stripe.'
    },
    {
      name: 'publications',
      description: 'Publications related endpoints.'
    },
    {
      name: 'languages',
      description: 'Languages related endpoints.'
    },
    {
      name: 'user',
      description: 'Endpoint for the currently logged in user.'
    },
    {
      name: 'voices',
      description: 'Voices related endpoints.'
    },
  ],
  apis: [
    './src/controllers/**/*.ts', 
    './src/controllers/**/*.yaml',
    './src/swagger-schemas/internal/**/*.yaml',
    './src/database/entities/**/*.yaml',
    // './src/swagger-schemas/external/stripe-only-schemas.yaml'
  ],
};
