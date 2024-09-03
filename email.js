// // server.js
// require('dotenv').config();
// const express = require('express');
// const nodemailer = require('nodemailer');
// const Imap = require('imap');
// const bodyParser = require('body-parser');
// const multer = require('multer'); // Import multer
// const path = require('path'); // Import path module

// const app = express();
// const port = process.env.PORT || 3000;

// // Configure multer for file uploads
// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, 'uploads/'); // Specify the directory to save uploaded files
//     },
//     filename: (req, file, cb) => {
//         cb(null, file.originalname); // Use the original file name
//     },
// });

// const upload = multer({ storage: storage });

// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));

// // Serve static files from the public directory
// app.use(express.static(path.join(__dirname, 'public')));

// // Route to serve email.html as the default page
// app.get('/email', (req, res) => {
//     res.sendFile(path.join(__dirname, 'public', 'email.html'));
// });

// // SMTP configuration for sending email
// const transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS,
//     },
// });

// // Endpoint to send an email with file attachments
// app.post('/send-email', upload.array('attachments'), (req, res) => {
//     const { to, cc, bcc, subject, text } = req.body;

//     // Prepare the attachments array
//     const attachments = req.files ? req.files.map(file => ({
//         filename: file.originalname,
//         path: file.path
//     })) : [];

//     const mailOptions = {
//         from: process.env.EMAIL_USER,
//         to,
//         cc,
//         bcc,
//         subject,
//         text,
//         attachments, // Include attachments in the email
//     };

//     transporter.sendMail(mailOptions, (error, info) => {
//         if (error) {
//             return res.status(500).send(error.toString());
//         }
//         res.status(200).send('Email sent: ' + info.response);
//     });
// });

// // Function to open the mailbox and fetch emails
// const openInbox = (cb) => {
//     imap.openBox('INBOX', true, cb);
// };

// // IMAP configuration for fetching email
// const imap = new Imap({
//     user: process.env.EMAIL_USER,
//     password: process.env.EMAIL_PASS,
//     host: 'imap.gmail.com',
//     port: 993,
//     tls: true,
//     // The following line should be avoided in production
//     tlsOptions: { rejectUnauthorized: false },
// });

// imap.once('ready', () => {
//     console.log('IMAP Connection Ready');
// });

// // Start the server
// app.listen(port, () => {
//     console.log(`Server is running on http://localhost:${port}`);
//     imap.connect();
// });


// server.js
require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const Imap = require('imap');
const bodyParser = require('body-parser');
const { simpleParser } = require('mailparser');
const multer = require('multer'); // Import multer
const path = require('path'); // Import path module

const app = express();
const port = process.env.PORT || 3000;

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Specify the directory to save uploaded files
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname); // Use the original file name
    },
});

const upload = multer({ storage: storage });

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Route to serve email.html as the default page
app.get('/email', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'email.html'));
});

// SMTP configuration for sending email
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Endpoint to send an email with file attachments
app.post('/send-email', upload.array('attachments'), (req, res) => {
    const { to, cc, bcc, subject, text } = req.body;

    // Prepare the attachments array
    const attachments = req.files ? req.files.map(file => ({
        filename: file.originalname,
        path: file.path
    })) : [];

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        cc,
        bcc,
        subject,
        text,
        attachments, // Include attachments in the email
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return res.status(500).send(error.toString());
        }
        res.status(200).send('Email sent: ' + info.response);
    });
});

// Function to open the mailbox and fetch emails
const openInbox = (cb) => {
    imap.openBox('INBOX', true, cb);
};

// IMAP configuration for fetching email
const imap = new Imap({
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASS,
    host: 'imap.gmail.com',
    port: 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false },
});

imap.once('ready', () => {
    console.log('IMAP Connection Ready');
});

// Endpoint to fetch all emails
app.get('/fetch-emails', (req, res) => {
    imap.connect();
    
    imap.once('ready', () => {
        openInbox((err, box) => {
            if (err) throw err;

            imap.search(['ALL'], (err, results) => {
                if (err) throw err;

                if (results.length) {
                    const f = imap.fetch(results, { bodies: ['HEADER.FIELDS (FROM SUBJECT DATE)', 'TEXT'] }); // Fetch both headers and body
                    let emails = [];
                    f.on('message', (msg, seqno) => {
                        msg.on('body', (stream, info) => {
                            let buffer = '';
                            stream.on('data', (chunk) => {
                                buffer += chunk.toString('utf8');
                            });
                            stream.once('end', async () => {
                                // Log the info object for debugging
                                console.log('Email Info:', info);
                                
                                try {
                                    // Use mailparser to parse the email
                                    const parsed = await simpleParser(buffer);
                                    
                                    // Create the email object including seqno and size
                                    const email = {
                                        subject: parsed.subject || 'No Subject',
                                        from: parsed.from.text || 'Unknown Sender',
                                        body: parsed.text || 'No Body', // Get plain text body
                                        html: parsed.html || '', // Get HTML body if exists
                                        date: parsed.date || new Date(), // Get the email date
                                        // seqno: info.seqno, // Get the sequence number
                                        // size: info.size // Get the size of the email
                                    };
                                    emails.push(email);
                                } catch (error) {
                                    console.error('Error parsing email:', error);
                                }
                            });
                        });
                    });
                    
                    f.once('end', () => {
                        // Sort emails from newest to oldest based on the date property
                        emails.sort((a, b) => new Date(b.date) - new Date(a.date));
                        res.status(200).json(emails);
                        imap.end();
                    });
                } else {
                    res.status(200).json([]);
                    imap.end();
                }
            });
        });
    });

    imap.once('error', (err) => {
        console.log('Error: ' + err);
        res.status(500).send(err.toString());
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
    imap.connect();
});