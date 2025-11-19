require("dotenv").config();
const session = require("express-session");
const MongoStore = require("connect-mongodb-session")(session);

const store = new MongoStore({
  uri: process.env.MONGO_URI,
  collection: "sessions"
});

const configSession = session({
  secret: process.env.SECRET_SESSION,   // FIXED
  resave: false,
  saveUninitialized: false,
  store: store,

  cookie: {                             // FIXED SPELLING
    httpOnly: true,
    secure: false,
    maxAge: null,            // session cookie
    expires: null,
    sameSite: 'lax'      
  },
 
});

module.exports = configSession;
