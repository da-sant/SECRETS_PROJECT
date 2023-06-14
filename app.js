//jshint esversion:6
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');

const app = express();

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));


//SET DATABASE
main().catch((err) => {
  console.log(err);
});
async function main() {
  await mongoose.connect('mongodb://localhost:27017/userDB', {
    useNewUrlParser: true,
  });
}



// Define Mongoose Schema
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});

userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ['password'] });

// Create Mongoose model based on the Schema
const User = mongoose.model('User', userSchema);

// ----

app.get('/', (req, res) => {
  res.render('Home');
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.post('/register', (req, res) => {

  const userMail = req.body.username;
  const userPassword = req.body.password;

  bcrypt.hash(userPassword, saltRoutes, (err, hash) => {
    const newUser = new User({
      email: userMail,
      password: hash,
    });
  
    if (!userMail) {
      console.log(`User doesn't exists. Error: ${err}`);
    } else {
      newUser
        .save()
        .then(() => {
          console.log(`Successfully saved new user in Database`);
          res.render('secrets');
        })
        .catch((err) => {
          console.log(`Error: ${err}, we couldn't save new user.`);
        });
    }
  });

});

app.post('/login', (req, res) => {
  // const userMail = req.body.username;
  // const userPassword = req.body.password;
  //   // const password = md5(req.body.password);

  // User.findOne({ email: userMail })
  //   .then((foundUser) => {
  //     if (foundUser) {
  //       bcrypt.compare(userPassword, foundUser.password, (err, result) => {
  //        if (result === true) {
  //         res.render('secrets');
  //         console.log(`User Successfully found: ${foundUser}`);
  //        } else {
  //         console.log(`${err}`);
  //        } 
  //     });
  //     }
  //   })
  //   .catch((err) => {
  //     console.log(`There was an error: ${err}`);
  //   });
});

//Start the server on port 3000 and log a message to the console
app.listen(3000, () => {
  console.log('Server started on port 3000');
});
