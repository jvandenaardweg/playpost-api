// tslint:disable-next-line
const { version } = require('../../package.json');
import Stripe from 'stripe';

const stripe = new Stripe(`${process.env.STRIPE_SECRET_KEY}`, {
  apiVersion: '2019-12-03',
  maxNetworkRetries: 3,
  typescript: true,
  appInfo: {
    name: 'Playpost API',
    version,
    url: process.env.PRODUCTION ? 'https://api.playpost.app' : !!process.env.HEROKU_APP_NAME ? `https://${process.env.HEROKU_APP_NAME}.herokuapp.com` : 'https://localhost:3000'
  }
});

export { stripe }
