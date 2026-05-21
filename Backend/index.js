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

const app = express();

// Connect to Database
connectDB();

// Middleware
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176", "https://digital-udhaar-katha.vercel.app"],
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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
