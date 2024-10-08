const { getDatabase } = require('./lib/database');
const { verifyPassword } = require('./lib/utils');
const LocalStrategy = require('passport-local');
const GithubStrategy = require('passport-github2').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const passport = require('passport');
const { ObjectId } = require('mongodb');

passport.use(
  new LocalStrategy(async function verify(username, password, done) {
    const db = await getDatabase();
    try {
      const user = await db.collection('users').findOne({
        email: username,
      });
      if (!user) return done(null, false);

      // check if the user logged in previously using OAuth provider.
      if (user.authenticationProvider) {
        return done(null, false);
      }

      const passwordVerified = await verifyPassword(password, user.password);
      if (passwordVerified) {
        done(null, { _id: user._id.toString(), role: user.role });
      } else {
        done(null, false);
      }
    } catch (err) {
      done(err, null);
    }
  })
);

passport.use(
  new GithubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL,
    },
    async function (accessToken, refreshToken, profile, done) {
      // refresh token is undefined
      const db = await getDatabase();

      let userId;
      const user = await db.collection('users').findOne({
        email: profile._json.email,
      });

      // save the user in db if does not already exist.
      if (!user) {
        const { insertedId } = await db.collection('users').insertOne({
          email: profile._json.email,
          name: profile._json.name,
          authenticationProvider: profile.provider,
        });
        userId = insertedId;
      } else {
        userId = user._id.toString();
      }

      // If the user was previously logged in using another strategy than update
      // the authenticationProvider
      if (user && user.authenticationProvider !== profile.provider) {
        await db.collection('users').updateOne(
          {
            email: profile._json.email,
          },
          {
            $set: {
              name: profile._json.name,
              authenticationProvider: profile.provider,
            },
            $unset: { password: '' },
          }
        );
      }

      return done(null, { _id: userId, role: user.role });
    }
  )
);

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async function (accessToken, refreshToken, profile, done) {
      const db = await getDatabase();

      let userId;
      const user = await db.collection('users').findOne({
        email: profile._json.email,
      });

      if (!user) {
        const { insertedId } = await db.collection('users').insertOne({
          email: profile._json.email,
          name: profile._json.name,
          authenticationProvider: profile.provider,
        });
        userId = insertedId;
      } else {
        userId = user._id.toString();
      }

      if (user && user.authenticationProvider !== profile.provider) {
        await db.collection('users').updateOne(
          {
            email: profile._json.email,
          },
          {
            $set: {
              name: profile._json.name,
              authenticationProvider: profile.provider,
            },
            $unset: { password: '' },
          }
        );
      }

      return done(null, { _id: userId, role: user.role });
    }
  )
);

passport.serializeUser((user, done) => {
  // This function will only be called on login (we login when we signup and login)
  // The value provided to callback will be set in the session.passport.user property
  // The session id will be stored in the cookie

  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  const db = await getDatabase();
  const usersCollection = db.collection('users');

  // Fetch the full user document (including role) from the database
  const user = await usersCollection.findOne({ _id: new ObjectId(id) });

  if (!user) {
    return done(new Error('User not found'));
  }

  // the value provided to callback will be set to req.user
  done(null, { _id: id, role: user.role });
});

module.exports = {
  passport,
};
