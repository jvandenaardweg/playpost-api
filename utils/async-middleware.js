const asyncMiddleware = fn =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next))
      .catch((err) => {
        console.log('Error', err.message);
        return res.status(500).json({
          status: 500,
          message: err.message
        });
      });
  };

module.exports = { asyncMiddleware }