import User from '../models/User.js';
import Ledger from '../models/Ledger.js';
import jwt from 'jsonwebtoken';

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
  const { name, email, password, role } = req.body;

  try {
    if (role === 'customer') {
      return res.status(400).json({ success: false, message: 'Customers cannot register themselves. Please contact a shop owner.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: 'owner'
    });

    sendTokenResponse(user, 201, res);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide an email and password' });
  }

  try {
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Log user out / clear cookie
// @route   GET /api/auth/logout
// @access  Private
export const logout = async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    data: {},
  });
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    let ledgers = [];
    let totalPayable = 0;
    let primaryOwnerId = null;

    if (user.role === 'customer') {
      ledgers = await Ledger.find({ customerId: user._id }).populate('ownerId');
      totalPayable = ledgers.reduce((acc, curr) => acc + curr.payableAmount, 0);
      if (ledgers.length > 0) {
        primaryOwnerId = ledgers[0].ownerId._id;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        payableAmount: totalPayable,
        ownerId: primaryOwnerId,
        ledgers: ledgers.map(l => ({
          id: l._id,
          ownerId: l.ownerId._id,
          ownerName: l.ownerId.name,
          payableAmount: l.payableAmount,
          stripePublishableKey: l.ownerId.stripePublishableKey || null
        }))
      },
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Get token from model, create cookie and send response
const sendTokenResponse = async (user, statusCode, res) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });

  const options = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  let ledgers = [];
  let totalPayable = 0;
  let primaryOwnerId = null;

  if (user.role === 'customer') {
    ledgers = await Ledger.find({ customerId: user._id }).populate('ownerId');
    totalPayable = ledgers.reduce((acc, curr) => acc + curr.payableAmount, 0);
    if (ledgers.length > 0) {
      primaryOwnerId = ledgers[0].ownerId._id;
    }
  }

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        payableAmount: totalPayable,
        ownerId: primaryOwnerId,
        ledgers: ledgers.map(l => ({
          id: l._id,
          ownerId: l.ownerId._id,
          ownerName: l.ownerId.name,
          payableAmount: l.payableAmount,
          stripePublishableKey: l.ownerId.stripePublishableKey || null
        }))
      }
    });
};
