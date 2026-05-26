import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';

// Load env variables immediately
dotenv.config();

import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import ownerRoutes from './routes/owner.js';
import paymentRoutes from './routes/payment.js';
import transactionRoutes from './routes/transaction.js';
import sendEmail from './utils/sendEmail.js';
import { processScheduledReminders } from './controllers/owner.js';

const app = express();

// Connect to Database
connectDB();

// Middleware
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176", "https://digital-udhaar-katha.vercel.app", "https://digital-udhaar-katha-lj7oovtbh-kasarlaviveks-projects.vercel.app"],
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/owner', ownerRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/transactions', transactionRoutes);

// Basic Route
app.get('/', (req, res) => {
  res.send('Digital Udhaar Katha API is running...');
});

// Diagnostic: Check which email providers are configured
app.get('/api/email-config', (req, res) => {
  res.json({
    resend: {
      configured: !!process.env.RESEND_API_KEY,
      keyPreview: process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.substring(0, 12) + '...' : null
    },
    brevo: {
      configured: !!process.env.BREVO_API_KEY,
      keyPreview: process.env.BREVO_API_KEY ? process.env.BREVO_API_KEY.substring(0, 12) + '...' : null
    },
    smtp: {
      host: process.env.SMTP_HOST || 'not set',
      port: process.env.SMTP_PORT || 'not set',
      user: process.env.SMTP_EMAIL || 'not set',
      passConfigured: !!process.env.SMTP_PASSWORD
    },
    from: {
      name: process.env.FROM_NAME || 'not set',
      email: process.env.FROM_EMAIL || 'not set'
    },
    frontendUrl: process.env.FRONTEND_URL || 'not set'
  });
});

// Diagnostic: Send a real test email and return the exact result or error
app.post('/api/test-email', async (req, res) => {
  const { to } = req.body;
  const testTo = to || process.env.FROM_EMAIL || 'test@mailinator.com';

  try {
    const result = await sendEmail({
      email: testTo,
      subject: '🧪 Digital Udhaar Katha — Email Test',
      message: `This is a test email sent at ${new Date().toISOString()}. If you received this, your email configuration is working!`,
      html: `<div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:30px;background:#0f172a;color:#f8fafc;border-radius:16px;">
        <h2 style="color:#6366f1;">✅ Email Test Successful!</h2>
        <p>Your Digital Udhaar Katha email system is working correctly.</p>
        <p style="color:#94a3b8;font-size:13px;">Sent at: ${new Date().toISOString()}</p>
      </div>`
    });

    res.json({
      success: true,
      message: `Test email sent successfully to ${testTo}!`,
      provider: process.env.RESEND_API_KEY ? 'Resend HTTP API' : process.env.BREVO_API_KEY ? 'Brevo HTTP API' : `SMTP (${process.env.SMTP_HOST}:${process.env.SMTP_PORT})`,
      result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Email sending failed',
      error: error.message,
      code: error.code || null,
      provider: process.env.RESEND_API_KEY ? 'Resend HTTP API' : process.env.BREVO_API_KEY ? 'Brevo HTTP API' : `SMTP (${process.env.SMTP_HOST}:${process.env.SMTP_PORT})`,
      diagnosticTips: [
        process.env.BREVO_API_KEY ? 'Brevo API key IS set — check if FROM_EMAIL matches a verified sender in Brevo dashboard' : 'BREVO_API_KEY is NOT set — consider adding it',
        process.env.RESEND_API_KEY ? 'Resend API key IS set — check if FROM_EMAIL domain is verified' : 'RESEND_API_KEY is NOT set',
        `FROM_EMAIL is: ${process.env.FROM_EMAIL || 'NOT SET (will default to bruvgang321@gmail.com)'}`,
        `SMTP fallback would use: ${process.env.SMTP_HOST || 'smtp.gmail.com'}:${process.env.SMTP_PORT || '587'} — ports 25/465/587 are BLOCKED on Render free tier`
      ]
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);

  // Process scheduled reminders every hour (3600000 ms)
  setInterval(() => {
    processScheduledReminders();
  }, 60 * 60 * 1000);
  console.log('Scheduled reminder cron initialized (runs every hour).');
});
