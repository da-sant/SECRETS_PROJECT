//jshint esversion:6
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
// var LocalStrategy = require('passport-local');

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
});

userSchema.plugin(passportLocalMongoose);

// Create Mongoose model based on the Schema
const User = mongoose.model('User', userSchema);

passport.use(User.createStrategy());

// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

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

// ----

app.get('/', (req, res) => {
  res.render('home');
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.get('/secrets', (req, res) => {
  if (req.isAuthenticated()) {
    res.render('secrets');
  } else {
    console.log(`Please need to login`);
    res.redirect('/login');
  }
});

app.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect('/');
  });
});

app.post('/register', async (req, res) => {
  try {
    const registerUser = await User.register(
      { username: req.body.username },
      req.body.password
    );

    if (registerUser) {
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
