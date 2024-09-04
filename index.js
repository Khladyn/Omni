const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const ejsLayouts = require('express-ejs-layouts');
const userController = require('./controllers/userController'); // Import the user controller
const authController = require('./controllers/authController'); // Import the auth controller

require('dotenv').config();

// Set up the Express app
const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'default_secret', // Use a secret for session encryption
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set `secure: true` if you're using HTTPS
}));

// Set EJS as the templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Use express-ejs-layouts
app.use(ejsLayouts);

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
  if (req.session.user) {
    return next();
  }
  res.redirect('/login');
}


// Authentication routes
app.get('/login', authController.renderLoginPage);
app.post('/login', authController.loginUser);
app.get('/logout', authController.logoutUser);


// User management routes
app.get('/home', isAuthenticated, authController.renderHomePage);
app.get('/users', isAuthenticated, userController.getUsers);
app.get('/register', userController.renderAddUserForm);
app.post('/register', userController.addUser);
app.get('/update/:id', isAuthenticated, userController.renderUpdateUserForm);
app.post('/update/:id', isAuthenticated, userController.updateUser);
app.get('/delete/:id', isAuthenticated, userController.deleteUser);

// In your route handler
app.get('/about', (req, res) => {
res.render('about', { title: 'About Us', page: 'about' });
});

app.get('/contact', (req, res) => {
res.render('contact', { title: 'Contact Us', page: 'contact' });
});


// Start the server
app.listen(port, () => {
  console.log(`App running on http://localhost:${port}`);
});
