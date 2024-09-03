// const Imap = require('imap');

// // Update the imap configuration
// const imap = new Imap({
//     user: process.env.EMAIL_USER,
//     password: process.env.EMAIL_PASS,
//     host: 'imap.gmail.com', // Use your email provider's IMAP host
//     port: 993,
//     tls: true,
//     tlsOptions: {
//         rejectUnauthorized: false, // Disable certificate validation
//     },
// });

// imap.once('ready', () => {
//     console.log('IMAP Connection Ready');
//     imap.end();
// });

// imap.once('error', (err) => {
//     console.log('Error: ' + err);
// });

// imap.connect();

require('dotenv').config();
const Imap = require('imap');

// Log the email and password for debugging (remove this in production)
console.log('Using Email:', process.env.EMAIL_USER);
console.log('Using Password:', process.env.EMAIL_PASS); // Be cautious with this log

const imap = new Imap({
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASS, // Use app password if 2FA is enabled
    host: 'imap.gmail.com', // Use your email provider's IMAP host
    port: 993,
    tls: true,
    // The following line should be avoided in production
    tlsOptions: { rejectUnauthorized: false },
});

// Function to open the mailbox and fetch emails
const openInbox = (cb) => {
    imap.openBox('INBOX', true, cb);
};

imap.once('ready', () => {
    console.log('IMAP Connection Ready');
    openInbox((err, box) => {
        if (err) throw err;
        // Search for unseen messages
        imap.search(['UNSEEN'], (err, results) => {
            if (err) throw err;

            if (results.length) {
                const f = imap.fetch(results, { bodies: '' });
                f.on('message', (msg, seqno) => {
                    msg.on('body', (stream, info) => {
                        let buffer = '';
                        stream.on('data', (chunk) => {
                            buffer += chunk.toString('utf8');
                        });
                        stream.once('end', () => {
                            console.log(`Message: ${buffer}`);
                        });
                    });
                });
                f.once('end', () => {
                    console.log('Done fetching all unseen messages!');
                    imap.end(); // Close connection
                });
            } else {
                console.log('No unseen messages found.');
                imap.end(); // Close connection
            }
        });
    });
});

imap.once('error', (err) => {
    console.log('Error: ' + err);
});

imap.connect();