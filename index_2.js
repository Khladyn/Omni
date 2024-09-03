const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
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

// Route to get users and render to the frontend
app.get('/users', async (req, res) => {
  try {
    const query = 'SELECT user_id, username, first_name, last_name, email, phone_number, date_created FROM "USERS"';
    const result = await pool.query(query);
    
    res.send(`
      <html>
        <head><title>Users List</title></head>
        <body>
          <h1>Users List</h1>
          <table border="1" cellpadding="5" cellspacing="0">
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Email/s</th>
                <th>Phone Number/s</th>
                <th>Date Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${result.rows.map(user => `
                <tr>
                  <td>${user.user_id}</td>
                  <td>${user.username}</td>
                  <td>${user.first_name}</td>
                  <td>${user.last_name}</td>
                  <td>${user.email.join(', ')}</td>
                  <td>${user.phone_number.join(', ')}</td>
                  <td>${new Date(user.date_created).toLocaleString()}</td>
                  <td>
                    <a href="/update/${user.user_id}"><button>Update</button></a> 
                    <a href="/delete/${user.user_id}" onclick="return confirm('Are you sure?')"><button>Delete</button></a>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <a href="/">Add New User</a>
        </body>
      </html>
    `);
  } catch (err) {
    console.error('Error executing query', err);
    res.status(500).send('Error retrieving users');
  }
});

// Render the form for adding a user
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head><title>Add User</title></head>
      <body>
        <h1>Add User</h1>
        <form action="/add-user" method="post">
          <label>Username:</label>
          <input type="text" name="username" required><br>
          
          <label>First Name:</label>
          <input type="text" name="first_name" required><br>
          
          <label>Last Name:</label>
          <input type="text" name="last_name" required><br>
          
          <label>Email/s (comma-separated):</label>
          <input type="text" name="email" required><br>
          
          <label>Phone Number/s (comma-separated):</label>
          <input type="text" name="phone_number" required><br>
          
          <label>Password:</label>
          <input type="password" name="password" required><br>
          
          <label>App Password:</label>
          <input type="password" name="app_password" required><br>
          
          <input type="submit" value="Add User">
        </form>
      </body>
    </html>
  `);
});

// Handle form submission for adding a user
app.post('/add-user', async (req, res) => {
  try {
    const { username, first_name, last_name, email, phone_number, password, app_password } = req.body;
    
    // Encrypt passwords
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const hashedAppPassword = await bcrypt.hash(app_password, saltRounds);

    // Convert comma-separated strings to arrays
    const emailArray = email.split(',').map(email => email.trim());
    const phoneArray = phone_number.split(',').map(phone => phone.trim());

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
    
    res.send(`
      <html>
        <head><title>Update User</title></head>
        <body>
          <h1>Update User</h1>
          <form action="/update/${userId}" method="post">
            <label>Username:</label>
            <input type="text" name="username" value="${user.username}" required><br>
            
            <label>First Name:</label>
            <input type="text" name="first_name" value="${user.first_name}" required><br>
            
            <label>Last Name:</label>
            <input type="text" name="last_name" value="${user.last_name}" required><br>
            
            <label>Email/s (comma-separated):</label>
            <input type="text" name="email" value="${user.email.join(', ')}" required><br>
            
            <label>Phone Number/s (comma-separated):</label>
            <input type="text" name="phone_number" value="${user.phone_number.join(', ')}" required><br>
            
            <label>Password (leave blank to keep current):</label>
            <input type="password" name="password"><br>
            
            <label>App Password (leave blank to keep current):</label>
            <input type="password" name="app_password"><br>
            
            <input type="submit" value="Update User">
          </form>
          <a href="/users">Back to Users List</a>
        </body>
      </html>
    `);
  } catch (err) {
    console.error('Error fetching user', err);
    res.status(500).send('Error retrieving user');
  }
});

// Handle form submission for updating a user
app.post('/update/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const { username, first_name, last_name, email, phone_number, password, app_password } = req.body;

    let updateQuery = 'UPDATE "USERS" SET username = $1, first_name = $2, last_name = $3, email = $4, phone_number = $5';
    const updateValues = [username, first_name, last_name, email.split(',').map(e => e.trim()), phone_number.split(',').map(p => p.trim())];
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
