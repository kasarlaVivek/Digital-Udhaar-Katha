import Transaction from '../models/Transaction.js';

// @desc    Get all transactions for the logged in user (owner or customer)
// @route   GET /api/transactions
// @access  Private
export const getTransactions = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'owner') {
      query.ownerId = req.user.id;
      if (req.query.customerId) {
        query.customerId = req.query.customerId;
      }
    } else {
      query.customerId = req.user.id;
    }

    const transactions = await Transaction.find(query)
      .populate('ownerId', 'name email')
      .populate('customerId', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
