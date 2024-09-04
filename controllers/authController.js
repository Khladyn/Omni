const pool = require('../db');
const bcrypt = require('bcryptjs');

// Render the login page with optional error message
const renderLoginPage = (req, res) => {
  res.render('login', {
    title: 'Login',
    layout: false,
    error: req.query.error,
    success: req.query.success
  });
};

// Render the home page
const renderHomePage = (req, res) => {
    // Access user data from session
    const user = req.session.user;
    
    // Pass user data to the template
    res.render('home', { 
      title: 'Home Page', 
      activePage: 'home',
      user // Pass user data to the template
    });
  };
  

// Handle login form submission
const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Query the database for the user
    const query = 'SELECT * FROM "USERS" WHERE username = $1';
    const result = await pool.query(query, [username]);
    const user = result.rows[0];

    // Check if user exists and password matches
    if (user && await bcrypt.compare(password, user.password)) {
      req.session.user = user;
      console.log(user);
      res.redirect('/home'); // Redirect to the home page
    } else {
      // Render the login page again with an error message
      res.render('login', {
        title: 'Login',
        layout: false,
        error: 'Invalid username or password',
        success: req.query.success
      });
    }
  } catch (err) {
    console.error('Error logging in:', err);
    res.status(500).send('Internal server error');
  }
};

// Handle logout
const logoutUser = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error logging out:', err);
      return res.status(500).send('Error logging out');
    }
    res.redirect('/login');
  });
};

module.exports = {
  renderLoginPage,
  renderHomePage,
  loginUser,
  logoutUser
};
