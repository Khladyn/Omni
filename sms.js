// Import required modules
require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const twilio = require('twilio');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse incoming request bodies
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json()); // Parse JSON bodies for incoming SMS

// Middleware to serve static files from the 'public' directory
app.use(express.static('public')); // Assuming 'public' is the folder where sms.html is located

// Middleware to serve static files from the 'uploads' directory
app.use('/uploads', express.static('uploads')); // Serve files from the uploads directory

// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads'); // Store uploaded files in the 'uploads' folder
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Append timestamp to filename
    },
});
const upload = multer({ storage: storage });

// Create a Twilio client
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// GET route to serve sms.html
app.get('/sms', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'sms.html'));
});

// In-memory storage for messages
let messages = [];

// Function to generate a unique ID for messages
const generateId = () => {
    return messages.length > 0 ? Math.max(...messages.map(msg => msg.id)) + 1 : 1;
};

// Endpoint to send SMS
app.post('/send-sms', upload.single('file'), (req, res) => {
    const to = req.body.to; // Recipient's phone number
    const messageBody = req.body.message; // Message text

    // Prepare message body
    let message = messageBody;
    let mediaUrl = null; // Initialize mediaUrl

    if (req.file) {
        // If a file is uploaded, construct the media URL
        mediaUrl = `https://12ad-180-190-33-135.ngrok-free.app/uploads/${req.file.filename}`; // Adjust this URL for production
        message += ` (Media: ${mediaUrl})`; // Append media URL to message
    }

    // Send the SMS using Twilio
    client.messages
        .create({
            to: to,
            from: process.env.TWILIO_PHONE_NUMBER,
            body: message
        })
        .then(message => {
            console.log(`Message sent: ${message.sid}`);
            
            // Store the sent message with a unique ID
            messages.push({
                id: generateId(),
                body: messageBody,
                type: 'sent',
                mediaUrl: mediaUrl
            });

            // Send a JSON response containing the message and fileUrl
            res.status(200).json({ message: messageBody, fileUrl: mediaUrl });
        })
        .catch(error => {
            console.error('Error sending message:', error);
            res.status(500).send('Error sending message');
        });
});

// Endpoint to receive incoming SMS from Twilio
app.post('/receive-sms', (req, res) => {
    const from = req.body.From; // Sender's phone number
    const body = req.body.Body; // Message body

    // Log the incoming message
    console.log(`Received SMS from ${from}: ${body}`);

    // Store the received message with a unique ID
    messages.push({
        id: generateId(),
        body: body,
        type: 'received'
    });

    // Respond to Twilio with a 200 OK
    res.status(200).send('<Response></Response>'); // Twilio expects an XML response
});

// Endpoint to fetch messages
app.get('/fetch-sms', (req, res) => {
    res.json(messages); // Return all messages
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});