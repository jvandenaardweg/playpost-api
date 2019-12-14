// tslint:disable-next-line
const { version } = require('../../package.json');
import Stripe from 'stripe';

const stripe = new Stripe(`${process.env.STRIPE_SECRET_KEY}`);
stripe.setApiVersion('2019-12-03');
stripe.setMaxNetworkRetries(3);
stripe.setAppInfo({
  name: 'Playpost API',
  version,
  url: process.env.PRODUCTION ? 'https://api.playpost.app' : 'https://localhost:3000'
});

export { stripe }
