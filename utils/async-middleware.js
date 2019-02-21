const Sentry = require('@sentry/node');

Sentry.init({
  dsn: 'https://479dcce7884b457cb001deadf7408c8c@sentry.io/1399178'
});

const asyncMiddleware = fn => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(err => {
      Sentry.captureException(err);
      return res.status(500).json({
        status: 500,
        message: err.message
      });
    });
  };
};

module.exports = {
  asyncMiddleware
};
