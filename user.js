const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

// Set up the Express app
const app = express();
const port = 3000;

// PostgreSQL configuration
const pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Set EJS as the templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Route to get users and render to the frontend
app.get('/users', async (req, res) => {
  try {
    const query = 'SELECT user_id, username, first_name, last_name, email, phone_number, date_created FROM "USERS"';
    const result = await pool.query(query);
    
    res.render('users', { users: result.rows });
  } catch (err) {
    console.error('Error executing query', err);
    res.status(500).send('Error retrieving users');
  }
});

// Render the form for adding a user
app.get('/add', (req, res) => {
  res.render('add_user');
});

// Handle form submission for adding a user
app.post('/add-user', async (req, res) => {
    try {

    console.log('Request Body:', req.body);
    
      const { username, first_name, last_name, password, app_password } = req.body;
      // Handle arrays of emails and phone numbers
      const emailArray = req.body.email || [];
      const phoneArray = req.body.phone_number || [];
  
      // Encrypt passwords
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      const hashedAppPassword = await bcrypt.hash(app_password, saltRounds);
  
      // Insert into database
      await pool.query(
        `INSERT INTO "USERS" (username, first_name, last_name, email, phone_number, password, app_password)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [username, first_name, last_name, emailArray, phoneArray, hashedPassword, hashedAppPassword]
      );
  
      res.send('User added successfully! <a href="/users">View Users</a>');
    } catch (err) {
      console.error('Error inserting user', err);
      res.status(500).send('Error adding user');
    }
  });

// Render the form for updating a user
app.get('/update/:id', async (req, res) => {
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
});

// Handle form submission for updating a user
app.post('/update/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const { username, first_name, last_name, password, app_password } = req.body;
    // Handle arrays of emails and phone numbers
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
});

// Handle user deletion
app.get('/delete/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    await pool.query('DELETE FROM "USERS" WHERE user_id = $1', [userId]);
    res.send('User deleted successfully! <a href="/users">View Users</a>');
  } catch (err) {
    console.error('Error deleting user', err);
    res.status(500).send('Error deleting user');
  }
});

// Start the server
app.listen(port, () => {
  console.log(`App running on http://localhost:${port}`);
});
