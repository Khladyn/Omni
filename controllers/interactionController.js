const pool = require('../db'); // Import the database pool from your database configuration
const multer = require('multer');
const path = require('path');

// Set up Multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads'); // Destination folder for uploaded files
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
    }
  });
  
  const upload = multer({ storage: storage });

// Endpoint to fetch chat messages by chat ID
const getChatById = async (req, res) => {
    const contactInfo = req.params.id; // Assume the contactInfo is passed as a parameter
    const sessionUserId = req.session.user.user_id; // Access the session user ID
  
    try {
    const query = `
        SELECT * 
        FROM "INTERACTIONS" 
        WHERE $1::text = ANY(contact_info)  -- Check if contactInfo is in the contact_info array
        OR $1::integer = user_id           -- Check if contactInfo matches user_id
        ORDER BY date_created ASC;         -- Sort by date_created from oldest to newest
      `;
  
      const result = await pool.query(query, [contactInfo]);
  
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'No records found for the given contact_info' });
      }
  
      // Include the session user ID in the response
      res.json({
        session_user_id: sessionUserId,
        interactions: result.rows
      });
  
      console.log(result.rows);
    } catch (err) {
      console.error('Error fetching chat messages', err);
      res.status(500).json({ message: 'Error retrieving chat messages' });
    }
  };
  


  // Fetch and render the interactions page
  const renderChat = async (req, res) => {
    try {
      // Extract user_id from session
      const userId = req.session.user.user_id; // Adjust this if your session key is different
  
      if (!userId) {
        return res.status(401).send('User not logged in');
      }
  
      const query = `
        SELECT DISTINCT ON (i.contact_info) 
            i.*, 
            u.username 
        FROM 
            "INTERACTIONS" i
        JOIN 
            "USERS" u 
        ON 
            u.user_id::text = ANY(i.contact_info)
        WHERE 
            i.channel = 'chat'
            AND i.user_id = $1
        ORDER BY 
            i.contact_info,  -- Group by contact_info
            i.date_created DESC;  -- Sort within each group by date_created to get the most recent record
        `;
      
      const result = await pool.query(query, [userId]);
      res.render('chat', { chats: result.rows, title: 'Chat', activePage: 'chat' });
    } catch (err) {
      console.error('Error executing query', err);
      res.status(500).send('Error retrieving interactions');
    }
  };

  const sendChat = async (req, res) => {
    // Handle file uploads
    upload.array('attachments')(req, res, async (err) => {
      if (err) {
        console.error('Error uploading files', err);
        return res.status(500).json({ success: false, message: 'Error uploading files' });
      }
  
      const { contact_info, content } = req.body; // Destructure from the request body
      const user_id = req.session.user.user_id; // Session user ID
      const files = req.files; // Array of uploaded files
  
      console.log(req.body);
      console.log(req.files);
  
      // Prepare file attachment paths if files exist
      const attachment = files.map(file => `/uploads/${file.filename}`);
  
      try {
        // Construct the query for inserting the chat message
        const query = `
          INSERT INTO "INTERACTIONS" (content, contact_info, user_id, channel, attachment)
          VALUES ($1, ARRAY[$2]::text[], $3, 'chat', $4::text[])
          RETURNING *;
        `;
  
        const result = await pool.query(query, [content, contact_info, user_id, attachment]);
  
        // Respond with the inserted message and its date_created
        res.json({
          success: true,
          message: result.rows[0],
        });
      } catch (err) {
        console.error('Error sending chat message', err);
        res.status(500).json({ success: false, message: 'Error sending chat message' });
      }
    });
  };
  
  
  
  // Render the form for adding a user
const renderEmail = (req, res) => {
    res.render('email', { 
      title: 'Email',
      error: req.query.error,
      success: req.query.success }); 
  };

  // Render the form for adding a user
const renderVoice = (req, res) => {
    res.render('voice', { 
      title: 'Voice',
      error: req.query.error,
      success: req.query.success }); 
  };

  // Render the form for adding a user
const renderSms = (req, res) => {
    res.render('sms', { 
      title: 'SMS',
      error: req.query.error,
      success: req.query.success }); 
  };

  module.exports = {
    renderChat,
    renderEmail,
    renderVoice,
    renderSms,
    getChatById,
    sendChat
  };
