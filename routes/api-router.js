const router = require('express').Router();

router.get('/test', (req, res) => {
  return res.json({ hello: 'test api' });
});

module.exports = {
  apiRouter: router,
};
