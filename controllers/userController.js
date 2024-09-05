const pool = require('../db'); // Import the database pool from your database configuration
const bcrypt = require('bcryptjs');

// Fetch and render the users page
const getUsers = async (req, res) => {
  try {
    const query = 'SELECT user_id, username, first_name, last_name, email, phone_number, date_created FROM "USERS"';
    const result = await pool.query(query);
    res.render('users', { users: result.rows, title: 'Users', activePage: 'users' });
  } catch (err) {
    console.error('Error executing query', err);
    res.status(500).send('Error retrieving users');
  }
};

// Render the form for adding a user
const renderAddUserForm = (req, res) => {
  res.render('register', { 
    title: 'Registration',
    layout: false,
    error: req.query.error,
    success: req.query.success }); 
};

// Handle form submission for adding a user
const addUser = async (req, res) => {
  try {
    const { username, first_name, last_name, password, app_password } = req.body;
    const emailArray = req.body.email || [];
    const phoneArray = req.body.phone_number || [];

    // Check for existing username
    const userCheck = await pool.query('SELECT * FROM "USERS" WHERE username = $1', [username]);
    if (userCheck.rows.length > 0) {
      // Username already exists
      return res.render('register', {
        title: 'Registration',
        layout: false,
        error: 'Username already exists',
        success: req.query.success
      });
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Base query and parameters
    let query = `INSERT INTO "USERS" (username, first_name, last_name, email, phone_number, password`;
    let queryParams = [username, first_name, last_name, emailArray, phoneArray, hashedPassword];
    
    // Add app_password if provided
    if (app_password) {
      const hashedAppPassword = await bcrypt.hash(app_password, saltRounds);
      query += `, app_password) VALUES ($1, $2, $3, $4, $5, $6, $7)`;
      queryParams.push(hashedAppPassword);
    } else {
      query += `) VALUES ($1, $2, $3, $4, $5, $6)`;
    }

    // Execute the query
    await pool.query(query, queryParams);
    // Redirect with success message
    res.redirect('/login?success=Account created successfully!');
  } catch (err) {
    console.error('Error inserting user', err);
    // Username already exists
    return res.render('register', {
      title: 'Registration',
      layout: false,
      error: 'Error creating account',
      success: req.query.success
    });
  }
};



// Render the form for updating a user
const renderUpdateUserForm = async (req, res) => {
  try {
    const userId = req.params.id;
    const query = 'SELECT user_id, username, first_name, last_name, email, phone_number FROM "USERS" WHERE user_id = $1';
    const result = await pool.query(query, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).send('User not found');
    }

    const user = result.rows[0];
    res.render('update_user', { user });
  } catch (err) {
    console.error('Error fetching user', err);
    res.status(500).send('Error retrieving user');
  }
};

// Handle form submission for updating a user
const updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { username, first_name, last_name, password, app_password } = req.body;
    const emailArray = req.body.email || [];
    const phoneArray = req.body.phone_number || [];

    let updateQuery = 'UPDATE "USERS" SET username = $1, first_name = $2, last_name = $3, email = $4, phone_number = $5';
    const updateValues = [username, first_name, last_name, emailArray, phoneArray];
    let index = 6;

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateQuery += `, password = $${index}`;
      updateValues.push(hashedPassword);
      index++;
    }

    if (app_password) {
      const hashedAppPassword = await bcrypt.hash(app_password, 10);
      updateQuery += `, app_password = $${index}`;
      updateValues.push(hashedAppPassword);
      index++;
    }

    updateQuery += ' WHERE user_id = $' + index;
    updateValues.push(userId);

    await pool.query(updateQuery, updateValues);

    res.send('User updated successfully! <a href="/users">View Users</a>');
  } catch (err) {
    console.error('Error updating user', err);
    res.status(500).send('Error updating user');
  }
};

// Handle user deletion
const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    await pool.query('DELETE FROM "USERS" WHERE user_id = $1', [userId]);
    res.send('User deleted successfully! <a href="/users">View Users</a>');
  } catch (err) {
    console.error('Error deleting user', err);
    res.status(500).send('Error deleting user');
  }
};

module.exports = {
  getUsers,
  renderAddUserForm,
  addUser,
  renderUpdateUserForm,
  updateUser,
  deleteUser
};
