// index.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const { ImapFlow } = require('imapflow');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail', // Change to your email provider
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Setup IMAP connection for receiving emails
const imap = new ImapFlow({
    host: process.env.IMAP_HOST,
    port: process.env.IMAP_PORT,
    secure: true,
    auth: {
        user: process.env.IMAP_USER,
        pass: process.env.IMAP_PASS,
    },
});

// Function to check for new emails
const checkEmails = async () => {
    await imap.connect();
    imap.on('mailboxOpen', (name, info) => {
        console.log(`Mailbox "${name}" opened: ${info}`);
    });

    // Use a simple polling mechanism for checking emails
    setInterval(async () => {
        const lock = await imap.getMailboxLock('INBOX');
        try {
            const messages = await imap.fetch('1:*', { envelope: true });
            for await (let msg of messages) {
                console.log(`${msg.envelope.subject}`);
                // Emit email to clients via Socket.IO
                io.emit('emailReceived', msg.envelope);
            }
        } finally {
            lock.release();
        }
    }, 10000); // Check every 10 seconds
};

// Start checking for emails
checkEmails();

// Serve static files
app.use(express.static('public'));
app.use(express.json());

// Socket.IO for chat functionality
io.on('connection', (socket) => {
    console.log('New user connected');

    socket.on('chatMessage', (msg) => {
        io.emit('chatMessage', msg);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// Send email
app.post('/send-email', (req, res) => {
    const { to, subject, text } = req.body;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject,
        text,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return res.status(500).send(error.toString());
        }
        res.status(200).send('Email sent: ' + info.response);
    });
});

// Send SMS
app.post('/send-sms', (req, res) => {
    const { to, body } = req.body;

    twilioClient.messages
        .create({
            body,
            from: process.env.TWILIO_PHONE_NUMBER,
            to,
        })
        .then(message => res.status(200).send('SMS sent: ' + message.sid))
        .catch(error => res.status(500).send(error.toString()));
});

// Twilio webhook for receiving SMS
app.post('/sms', (req, res) => {
    const { From, Body } = req.body;
    console.log(`Received SMS from ${From}: ${Body}`);
    // Emit the received SMS to the client
    io.emit('smsReceived', { from: From, body: Body });
    res.send('<Response></Response>'); // Respond to Twilio
});

// Twilio webhook for receiving voice calls
app.post('/voice', (req, res) => {
    const { From } = req.body;
    console.log(`Received voice call from ${From}`);
    // Implement voice handling logic here, if needed
    res.send('<Response><Say>Hello, you have reached us!</Say></Response>'); // Respond to Twilio
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});