const imaps = require('imap-simple');
const nodemailer = require('nodemailer');
const { simpleParser } = require('mailparser');
const fs = require('fs');
// require('dotenv').config(); // For environment variables

// IMAP Configuration
const imapConfig = {
    imap: {
        user: process.env.IMAP_USER,
        password: process.env.IMAP_PASS,
        host: 'imap.gmail.com',
        port: 993,
        tls: true,
        tlsOptions: {
            rejectUnauthorized: false // Allows self-signed certificates
        },
        authTimeout: 3000
    }
};

// SMTP Configuration
const smtpConfig = {
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
};

// Retrieve emails
const fetchEmails = async (req, res) => {
    try {
        const connection = await imaps.connect(imapConfig);
        await connection.openBox('INBOX');

        const searchCriteria = ['ALL']; // You can change the criteria
        const fetchOptions = { bodies: ['HEADER', 'TEXT'], struct: true };

        const messages = await connection.search(searchCriteria, fetchOptions);
        
        const emails = await Promise.all(messages.map(async msg => {
            const headersPart = msg.parts.find(part => part.which === 'HEADER').body;
            const bodyPart = msg.parts.find(part => part.which === 'TEXT').body;
            
            const rawEmail = `From: ${headersPart.from}\r\nSubject: ${headersPart.subject}\r\n\r\n${bodyPart}`;
            
            // Parse the email content
            const parsedEmail = await simpleParser(rawEmail);

            const { body, ...emailWithoutBody } = parsedEmail; // Exclude body from the logged object
            console.log(emailWithoutBody);

            return {
                from: parsedEmail.from ? parsedEmail.from.text : null,
                to: parsedEmail.to ? parsedEmail.to.text : null,
                cc: parsedEmail.cc ? parsedEmail.cc.text : null,
                bcc: parsedEmail.bcc ? parsedEmail.bcc.text : null,
                subject: parsedEmail.subject || null,
                body: parsedEmail.text || null, // Plain text
                html: parsedEmail.textAsHtml || null, // HTML content
                inReplyTo: parsedEmail.from ? parsedEmail.from.text : null, // Reply-to ID (if available)
                references: parsedEmail.from ? parsedEmail.from.text : null, // References (if available)
            };
        }));

        connection.end();
        res.json(emails);
    } catch (error) {
        console.error('Error fetching emails:', error);
        res.status(500).json({ error: 'Unable to fetch emails' });
    }
};


const replyEmail = async (req, res) => {
    const { to, cc, bcc, subject, html, references, inReplyTo } = req.body;
    const attachments = req.files ? req.files.map(file => ({
        filename: file.originalname,
        path: file.path
    })) : [];

    try {
        const transporter = nodemailer.createTransport(smtpConfig);

        const mailOptions = {
            from: process.env.SMTP_USER,
            to,
            cc,
            bcc,
            subject,
            html,
            references, // Add references here
            inReplyTo,  // Add inReplyTo here
            attachments // Add attachments here
        };

        await transporter.sendMail(mailOptions);

        // Optionally, clean up uploaded files
        attachments.forEach(att => fs.unlinkSync(att.path));

        res.redirect('/email?success=Email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
        res.redirect('/email?error=Email not sent');
    }
};


// Send an email
const sendEmail = async (req, res) => {

    const { to, cc, bcc, subject, html } = req.body;
    const attachments = req.files ? req.files.map(file => ({
        filename: file.originalname,
        path: file.path
    })) : [];

    try {
        const transporter = nodemailer.createTransport(smtpConfig);

        const mailOptions = {
            from: process.env.SMTP_USER,
            to,
            cc,
            bcc,
            subject,
            html,
            attachments // Add attachments here
        };

        await transporter.sendMail(mailOptions);

        // Optionally, clean up uploaded files
        attachments.forEach(att => fs.unlinkSync(att.path));

        res.redirect('/email?success=Email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
        res.redirect('/email?error=Email not sent');
    }
};


  // Render the form for adding a user
  const renderEmail = (req, res) => {
    res.render('email', { 
      title: 'Email',
      error: req.query.error,
      success: req.query.success }); 
  };


module.exports = {
    fetchEmails,
    sendEmail,
    renderEmail,
    replyEmail
};
