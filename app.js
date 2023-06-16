//jshint esversion:6
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    secret: 'There is a heaven lets keep it as secret.',
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

//SET DATABASE

mongoose.connect('mongodb://localhost:27017/userDB', { useNewUrlParser: true });

// Define Mongoose Schema
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  secrets: [String],
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

// Create Mongoose model based on the Schema
const User = mongoose.model('User', userSchema);

passport.use(User.createStrategy());

//PASSPORT

passport.serializeUser((user, done) => {
  process.nextTick(() => {
    done(null, { id: user._id, username: user.username });
  });
});

passport.deserializeUser((user, done) => {
  process.nextTick(() => {
    return done(null, user);
  });
});

// GOOGLE STRATEGY
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: 'http://localhost:3000/auth/google/secrets',
      userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo',
    },
    function (accessToken, refreshToken, profile, cb) {
      console.log(profile);

      User.findOrCreate({ googleId: profile.id }, function (err, user) {
        return cb(err, user);
      });
    }
  )
);

//FACEBOOK STRATEGY

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: 'http://localhost:3000/auth/google/secrets',
    },
    function (accessToken, refreshToken, profile, cb) {
      User.findOrCreate({ facebookId: profile.id }, function (err, user) {
        return cb(err, user);
      });
    }
  )
);

// ---- GET ROUTES

app.get('/', (req, res) => {
  res.render('home');
});

app.get(
  '/auth/google',
  passport.authenticate('google', { scope: ['profile'] })
);

app.get(
  '/auth/google/secrets',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function (req, res) {
    console.log('Successfully authenticated with Google');
    res.redirect('/secrets');
  }
);

app.get('/auth/facebook', passport.authenticate('facebook'));

app.get(
  '/auth/facebook/secrets',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function (req, res) {
    console.log('Successfully authenticated with Facebook');
    res.redirect('/secrets');
  }
);

app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.get('/secrets', (req, res) => {

  User.find({ secrets: { $ne: null } })
    .then((foundUsers) => {
      res.render('secrets', { usersWithSecrets: foundUsers });
    })
    .catch((err) => {
      console.log(`${err}`);
    });
});

app.get('/submit', (req, res) => {
  if (req.isAuthenticated()) {
    res.render('submit');
  } else {
    console.log(`Please login`);
    res.redirect('/login');
  }
});

app.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    console.log('Logged out');
    res.redirect('/');
  });
});

// POST

app.post('/submit', (req, res) => {
  const submittedSecret = req.body.secret;

  console.log(req.user.id);

  User.findById(req.user.id)
    .then((foundUser) => {
      if (foundUser) {
        foundUser.secrets.push(submittedSecret);
        foundUser
          .save()
          .then(() => {
            res.redirect('/secrets');
          })
          .catch((err) => {
            console.log(`${err}`);
          });
      } else {
        res.send(`No secrets found ${err}`);
      }
    })
    .catch((err) => {
      console.log(`There was a problem: ${err}`);
    });
});

app.post('/register', async (req, res) => {
  try {
    const registeredUser = await User.register(
      { username: req.body.username },
      req.body.password
    );

    if (registeredUser) {
      passport.authenticate('local')(req, res, () => {
        res.redirect('/secrets');
      });
    } else {
      res.redirect('/register');
    }
  } catch (err) {
    res.send(err);
  }
});

app.post('/login', (req, res) => {
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });

  req.login(user, (err) => {
    if (err) {
      console.log(`There was an error: ${err}`);
    } else {
      passport.authenticate('local')(req, res, () => {
        res.redirect('/secrets');
      });
    }
  });
});

//Start the server on port 3000 and log a message to the console
app.listen(3000, () => {
  console.log('Server started on port 3000');
});
