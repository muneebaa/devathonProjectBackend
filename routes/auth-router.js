const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const { passport } = require('../passport-config');
const { hashPassword, serverErrorResponse } = require('../lib/utils');
const { getDatabase } = require('../lib/database');
const { addUser } = require('../controllers/user');

router.post(
  '/auth/signup',
  body('name').isString().notEmpty().isLength({ min: 1 }),
  body('email').isEmail(),
  body('password').isString().notEmpty().isLength({ min: 5 }),
  async (req, res) => {
    const result = validationResult(req);

    if (!result.isEmpty()) {
      return res.status(400).end('Invalid data');
    }

    const { password } = req.body;

    const hashedPassword = await hashPassword(password);
    const db = await getDatabase();

    try {
      let user = await db.collection('users').findOne({
        email: req.body.email,
      });

      if (user) {
        return res
          .status(400)
          .json({ message: 'The user with this email already exists' });
      }

      const { insertedId } = await addUser({
        ...req.body,
        password: hashedPassword,
      });

      user = await db.collection('users').findOne({
        _id: insertedId,
      });

      req.login({ _id: user._id.toString() }, err => {
        if (err) return res.status(500).end();
        // return res.redirect('/home');
        return res.status(201).end();
      });
    } catch (e) {
      console.error(e);
      return serverErrorResponse(res);
    }
  }
);

router.post('/auth/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err); // Handle any errors
    }
    if (!user) {
      return res.status(401).json({ message: 'Authentication failed' }); // Authentication failed
    }
    req.logIn(user, err => {
      if (err) {
        return next(err); // Handle login errors
      }
      return res.status(201).end();
    });
  })(req, res, next);
});

router.get(
  '/auth/github',
  passport.authenticate('github', {
    scope: ['user:email'],
  })
);

router.get(
  '/auth/github/callback',
  passport.authenticate('github', {
    successRedirect: '/home',
    failureRedirect: '/login',
  })
);

router.get(
  '/auth/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  })
);

router.get(
  '/auth/google/callback',
  passport.authenticate('google', {
    successRedirect: '/home',
    failureRedirect: '/login',
  })
);

router.get('/logout', (req, res) => {
  req.logout(err => {
    if (err) return res.status(500).end();
    req.session.destroy(err => {
      if (err) return res.status(500).end();
      return res.status(201).end();
    });
  });
});

module.exports = {
  authRouter: router,
};
