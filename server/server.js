const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configure CORS
const allowedOrigins = [
  'https://adkompas.com',
  'https://www.adkompas.com',
  'http://localhost:8000',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5500',
  'http://127.0.0.1:5501'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    // Check if the origin is allowed
    const isAllowed = allowedOrigins.some(allowed => {
      return origin.startsWith(allowed);
    });
    
    if (isAllowed) {
      return callback(null, true);
    } else {
      console.warn(`CORS blocked for origin: ${origin}`);
      return callback(new Error('Not allowed by CORS'), false);
    }
  },
  methods: ['POST', 'GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// Initialize Supabase Client securely
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('CRITICAL ERROR: SUPABASE_URL and SUPABASE_KEY environment variables are required.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
console.log('Supabase client securely initialized.');

// Initialize Nodemailer Transporter
const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT || 465;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const emailFrom = process.env.EMAIL_FROM || 'AdKompas CRM <noreply@adkompas.com>';
const emailTo = process.env.EMAIL_TO;

let transporter = null;

if (smtpHost && smtpUser && smtpPass) {
  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: parseInt(smtpPort),
    secure: parseInt(smtpPort) === 465, // true for 465, false for 587/other
    auth: {
      user: smtpUser,
      pass: smtpPass
    }
  });
  console.log('Nodemailer SMTP transporter initialized.');
} else {
  console.warn('SMTP credentials missing. Server will run in DEMO MODE for email alerts (emails printed to console).');
}

// Health Check
app.get('/', (req, res) => {
  res.status(200).json({ status: 'healthy', message: 'WhatsApp CRM Proxy API is running.' });
});

// Endpoint to capture leads
app.post('/api/leads', async (req, res) => {
  try {
    const { name, company_name, email, mobile_number, enquiry_subject, message, channel, from_page } = req.body;

    // Server-side validation
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Name is required.' });
    }
    if (!email || email.trim().length < 3 || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email is required.' });
    }
    if (!mobile_number || mobile_number.trim().length < 5) {
      return res.status(400).json({ error: 'Valid mobile number is required.' });
    }
    if (!enquiry_subject || enquiry_subject.trim().length === 0) {
      return res.status(400).json({ error: 'Enquiry subject is required.' });
    }

    const leadChannel = channel || 'Direct';
    const cleanFromPage = from_page || '';

    // Insert lead into Supabase
    const { data, error } = await supabase
      .from('whatsapp_leads')
      .insert([
        {
          name: name.trim(),
          company_name: company_name ? company_name.trim() : null,
          email: email.trim(),
          mobile_number: mobile_number.trim(),
          enquiry_subject: enquiry_subject.trim(),
          message: message ? message.trim() : null,
          channel: leadChannel,
          from_page: cleanFromPage
        }
      ])
      .select();

    if (error) {
      console.error('Supabase database insert error:', error);
      return res.status(500).json({ error: 'Failed to save lead to CRM.' });
    }

    const savedLead = data[0];
    console.log('Lead successfully saved to database:', savedLead);

    // Format Date/Time
    const submittedAtStr = new Date(savedLead.created_at).toLocaleString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    // Create pre-filled WhatsApp link for reply
    const replyText = encodeURIComponent(`Hi ${savedLead.name}, thank you for contacting AdKompas. I see you are interested in ${savedLead.enquiry_subject}. How can I assist you today?`);
    const waReplyUrl = `https://wa.me/${savedLead.mobile_number.replace(/\+/g, '')}?text=${replyText}`;

    // Premium HTML Email Template matching the screenshot
    const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Lead Notification</title>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 20px; color: #1f2937; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); }
        .header { background-color: #1ebd54; padding: 24px; text-align: center; color: #ffffff; }
        .brand { font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.9; margin-bottom: 8px; }
        .title { font-size: 20px; font-weight: bold; margin: 0; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .subtitle { font-size: 13px; opacity: 0.8; margin-top: 6px; }
        .content { padding: 32px 24px; }
        .section-label { font-size: 11px; font-weight: bold; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 16px; }
        .table { width: 100%; border-collapse: collapse; }
        .table-row { border-bottom: 1px solid #f3f4f6; }
        .table-row:last-child { border-bottom: none; }
        .table-label { font-size: 14px; font-weight: bold; color: #4b5563; padding: 12px 0; width: 140px; vertical-align: top; }
        .table-value { font-size: 14px; color: #111827; padding: 12px 0; line-height: 1.5; word-break: break-all; }
        .table-value a { color: #3b82f6; text-decoration: none; }
        .table-value a:hover { text-decoration: underline; }
        .footer { padding: 0 24px 32px 24px; text-align: center; }
        .btn-wa { display: inline-flex; align-items: center; justify-content: center; background-color: #1ebd54; color: #ffffff !important; text-decoration: none !important; font-size: 15px; font-weight: bold; padding: 14px 28px; border-radius: 8px; box-shadow: 0 4px 6px rgba(30, 189, 84, 0.2); transition: background-color 0.2s; }
        .btn-wa:hover { background-color: #16a34a; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="brand">AdKompas Digital</div>
          <div class="title">💬 New WhatsApp Lead from AdKompas Website</div>
          <div class="subtitle">Someone just enquired via <a href="https://adkompas.com" style="color: #ffffff; text-decoration: underline;">adkompas.com</a></div>
        </div>
        <div class="content">
          <div class="section-label">Lead Details</div>
          <table class="table">
            <tr class="table-row">
              <td class="table-label">Name</td>
              <td class="table-value">${savedLead.name}</td>
            </tr>
            <tr class="table-row">
              <td class="table-label">Company</td>
              <td class="table-value">${savedLead.company_name || '<i>Not specified</i>'}</td>
            </tr>
            <tr class="table-row">
              <td class="table-label">Email</td>
              <td class="table-value"><a href="mailto:${savedLead.email}">${savedLead.email}</a></td>
            </tr>
            <tr class="table-row">
              <td class="table-label">Phone</td>
              <td class="table-value"><a href="tel:${savedLead.mobile_number}">${savedLead.mobile_number}</a></td>
            </tr>
            <tr class="table-row">
              <td class="table-label">Service</td>
              <td class="table-value">${savedLead.enquiry_subject}</td>
            </tr>
            <tr class="table-row">
              <td class="table-label">MOQ / Message</td>
              <td class="table-value">${savedLead.message || '<i>No message</i>'}</td>
            </tr>
            <tr class="table-row">
              <td class="table-label">Channel</td>
              <td class="table-value" style="font-weight: bold; color: ${leadChannel === 'Google Ads' ? '#3b82f6' : '#10b981'};">${leadChannel}</td>
            </tr>
            <tr class="table-row">
              <td class="table-label">Submitted At</td>
              <td class="table-value">${submittedAtStr}</td>
            </tr>
            <tr class="table-row">
              <td class="table-label">From Page</td>
              <td class="table-value"><a href="${cleanFromPage}" target="_blank">${cleanFromPage}</a></td>
            </tr>
          </table>
        </div>
        <div class="footer">
          <a href="${waReplyUrl}" target="_blank" class="btn-wa">💬 Reply on WhatsApp</a>
        </div>
      </div>
    </body>
    </html>
    `;

    // Send Email
    if (transporter && emailTo) {
      try {
        await transporter.sendMail({
          from: emailFrom,
          to: emailTo,
          subject: `💬 New WhatsApp Lead: ${savedLead.name} (${leadChannel})`,
          html: emailHtml
        });
        console.log(`Notification email successfully sent to: ${emailTo}`);
      } catch (mailErr) {
        console.error('SMTP email dispatch error:', mailErr);
      }
    } else {
      console.log('--- EMAIL ALERTS DEMO PRINT ---');
      console.log(`From: ${emailFrom}`);
      console.log(`To: ${emailTo || 'No target email configured'}`);
      console.log(`Subject: New WhatsApp Lead: ${savedLead.name} (${leadChannel})`);
      console.log(`HTML Body Snippet: ${savedLead.name} enquired for ${savedLead.enquiry_subject}`);
      console.log('---------------------------------');
    }

    return res.status(201).json({
      success: true,
      message: 'Lead saved and notification generated.',
      lead: savedLead
    });

  } catch (err) {
    console.error('Unexpected server error:', err);
    return res.status(500).json({ error: 'An unexpected server error occurred.' });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
