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
import { runPortDiagnostics } from './scratch_port_test.js';
import { processScheduledReminders } from './controllers/owner.js';

const app = express();

// Connect to Database
connectDB();

// Middleware
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176", "https://digital-udhaar-katha-lj7oovtbh-kasarlaviveks-projects.vercel.app"],
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

// Test Email Route for Diagnostics
app.get('/api/test-email', async (req, res) => {
  try {
    console.log('[Diagnostic] Running email test...');
    const info = await sendEmail({
      email: 'bruvgang321@gmail.com',
      subject: '🏪 Digital Udhaar Katha - Diagnostic Test',
      message: 'If you receive this, emails are working in this environment!',
    });
    res.status(200).json({
      success: true,
      message: 'Email sent successfully!',
      info,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || error,
      code: error.code,
      stack: error.stack,
      env: {
        SMTP_HOST: process.env.SMTP_HOST,
        SMTP_PORT: process.env.SMTP_PORT,
        SMTP_EMAIL: process.env.SMTP_EMAIL,
        SMTP_PASSWORD_LENGTH: process.env.SMTP_PASSWORD ? process.env.SMTP_PASSWORD.length : 0,
        FROM_EMAIL: process.env.FROM_EMAIL,
      }
    });
  }
});

// Test Outgoing Ports Route for Diagnostics
app.get('/api/test-ports', async (req, res) => {
  try {
    console.log('[Diagnostic] Running port diagnostics...');
    const results = await runPortDiagnostics();
    res.status(200).json({
      success: true,
      results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || error,
    });
  }
});

// Basic Route
app.get('/', (req, res) => {
  res.send('Digital Udhaar Katha API is running...');
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
