//jshint esversion:6
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    secret: 'Our little secret.',
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

//SET DATABASE
main().catch((err) => {
  console.log(err);
});
async function main() {
  await mongoose.connect('mongodb://localhost:27017/userDB', {
    useNewUrlParser: true,
  });
}

// mongoose.set('useCreateIndex', true);

// Define Mongoose Schema
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});

userSchema.plugin(passportLocalMongoose);

// Create Mongoose model based on the Schema
const User = mongoose.model('User', userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser);
passport.deserializeUser(User.deserializeUser);

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
    console.log('User does not exist');
    res.redirect('/login');
  }
});

app.post('/register', (req, res) => {
  // const userEmail = req.body.username;
  // const userPassword = req.body.password;

  User.register(
    { username: req.body.username },
    req.body.password,
    (err, user) => {
      if (err) {
        console.log(err);
        res.redirect('/register');
      } else {
        passport.authenticate('local')(req, res, () => {
          res.redirect('/secrets');
          console.log('Successfully authenticated');
        });
      }
    }
  );
});

app.post('/login', (req, res) => {
  const user = new User({
    username,
  });
});

//Start the server on port 3000 and log a message to the console
app.listen(3000, () => {
  console.log('Server started on port 3000');
});
