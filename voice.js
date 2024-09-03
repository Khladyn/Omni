require('dotenv').config();
const express = require('express');
const twilio = require('twilio');
const bodyParser = require('body-parser');
const path = require('path');
const { VoiceResponse } = require('twilio').twiml;
const WebSocket = require('ws'); // Import WebSocket

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse incoming request bodies
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files

// Twilio credentials from environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

// Serve the voice.html file
app.get('/voice', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'voice.html'));
});

// Endpoint to make a call
app.post('/make-call', (req, res) => {
    const to = req.body.to; // Phone number to call
    const from = process.env.TWILIO_PHONE_NUMBER; // Your Twilio number

    // Validate the 'to' parameter
    if (!to || !/^\+?[1-9]\d{1,14}$/.test(to)) {
        return res.status(400).send('Invalid phone number format. Please provide a valid phone number.');
    }

    // Ensure the Twilio phone number is available
    if (!from) {
        return res.status(500).send('Twilio phone number not configured.');
    }

    client.calls
        .create({
            url: 'http://demo.twilio.com/docs/voice.xml', // TwiML URL to handle the call
            to,
            from
        })
        .then(call => {
            console.log(`Call initiated: ${call.sid}`);
            res.status(200).send(`Call initiated to ${to}`);
        })
        .catch(error => {
            console.error('Error making call:', error);
            // Check for specific error codes and handle accordingly
            if (error.code === 21211) {
                return res.status(400).send('The phone number you provided is not valid.');
            }
            return res.status(500).send('Error making call: ' + error.message);
        });
});

// Create a WebSocket server
const wss = new WebSocket.Server({ noServer: true });

// Handle incoming calls
app.post('/voice', (req, res) => {
    console.log("Call received:", req.body); // Log the incoming call data

    // Extract relevant call information
    const callInfo = {
        Caller: req.body.From || req.body.Caller, // Use From if available
        CallSid: req.body.CallSid,
        Direction: req.body.Direction,
        CallStatus: req.body.CallStatus,
    };

    // Broadcast the call information to all connected WebSocket clients
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(callInfo)); // Send call info to clients
        }
    });

    // Prepare TwiML response
    const response = new VoiceResponse();

    const action = req.body.action; // 'answer' or 'reject'
    
    if (action === 'answer') {
        console.log("Answering the call");
        response.say('Hello, you have an incoming call!');
    } else {
        console.log("Rejecting the call");
        response.reject();
    }

    res.type('text/xml'); // Set the content type to XML
    res.send(response.toString()); // Send the TwiML response
});

// Upgrade the HTTP server to support WebSockets
const server = app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});