require('dotenv').config();
const express = require('express');
const app = express();
const expressSession = require('express-session');
const MongoStore = require('connect-mongo');
const { authRouter } = require('./routes/auth-router');
const { passport } = require('./passport-config');
const cors = require('cors');
const { apiRouter } = require('./routes/api-router');

app.use(cors());

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  })
);

app.use(
  expressSession({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.DATABASE_CONNECTION,
      dbName: process.env.DATABASE_NAME,
    }),
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use(authRouter);
app.use('/api', apiRouter);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`server started on port ${PORT}`);
});
