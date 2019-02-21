if (process.env.NODE_ENV === 'production') {
  const Sentry = require('@sentry/node');

  Sentry.init({
    dsn: 'https://479dcce7884b457cb001deadf7408c8c@sentry.io/1399178',
    environment: 'production'
  });
}


const asyncMiddleware = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((err) => {

    if (process.env.NODE_ENV === 'production') {
      // Sentry.configureScope((scope) => {
      //   scope.setUser({
      //     id: '13123123',
      //     email: 'john.doe@example.com'
      //   });
      // });

      // Capture the error for us to see in Sentry
      Sentry.captureException(err);
    }

    // Return a general error to the user
    return res.status(500).json({
      status: 500,
      // message: err.message
      message: 'An unexpected error occurred. Please try again or contact us when this happens again.'
    });
  });
};

module.exports = {
  asyncMiddleware
};
