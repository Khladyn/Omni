const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const ejsLayouts = require('express-ejs-layouts');
const userController = require('./controllers/userController'); // Import the user controller
const authController = require('./controllers/authController'); // Import the auth controller
const interactionController = require('./controllers/interactionController'); // Import the auth controller

require('dotenv').config();

// Set up the Express app
const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static('uploads'));

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

// Use JSON
app.use(express.json());

// Default route
app.get('/', (req, res) => {
  res.redirect('/login');
});

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


// Interaction management routes
app.get('/chat/:id', isAuthenticated, interactionController.getChatById);
app.post('/sendChat', isAuthenticated, interactionController.sendChat);
app.get('/findUser', isAuthenticated, interactionController.findUser);
app.get('/chat', isAuthenticated, interactionController.renderChat);
app.get('/email', isAuthenticated, interactionController.renderEmail);
app.get('/voice', isAuthenticated, interactionController.renderVoice);
app.get('/sms', isAuthenticated, interactionController.renderSms);


// Start the server
app.listen(port, () => {
  console.log(`App running on http://localhost:${port}`);
});

