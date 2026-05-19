import User from '../models/User.js';
import Ledger from '../models/Ledger.js';
import Transaction from '../models/Transaction.js';
import sendEmail from '../utils/sendEmail.js';
import { customerCreatedEmail, debtUpdatedEmail, accountDeletedEmail, ownerNotifyDeletionEmail } from '../utils/emailTemplates.js';

// @desc    Create a new customer or link existing customer to owner's ledger
// @route   POST /api/owner/customers
// @access  Private/Owner
export const createCustomer = async (req, res, next) => {
  const { name, email, password, phone, payableAmount, description } = req.body;

  try {
    // 1. Check if user already exists globally
    let customer = await User.findOne({ email });
    let isNewCustomer = false;

    if (!customer) {
      // Create new customer user globally
      customer = await User.create({
        name,
        email,
        password, // User model will hash this
        phone: phone || '',
        role: 'customer'
      });
      isNewCustomer = true;
    } else {
      // If user exists but is an owner, block it
      if (customer.role !== 'customer') {
        return res.status(400).json({ success: false, message: 'This email belongs to a shop owner and cannot be added as a customer.' });
      }

      // Check if ledger already exists for this owner
      const existingLedger = await Ledger.findOne({ ownerId: req.user.id, customerId: customer._id });
      if (existingLedger) {
        return res.status(400).json({ success: false, message: 'This customer is already in your ledger.' });
      }
    }

    // 2. Create ledger entry connecting owner and customer
    const ledger = await Ledger.create({
      ownerId: req.user.id,
      customerId: customer._id,
      payableAmount: payableAmount || 0
    });

    // 3. Create a Credit Transaction if starting debt > 0
    if (payableAmount && Number(payableAmount) > 0) {
      await Transaction.create({
        ledgerId: ledger._id,
        ownerId: req.user.id,
        customerId: customer._id,
        type: 'credit',
        amount: Number(payableAmount),
        description: description || 'Initial balance'
      });
    }

    // 4. Send email to customer
    const loginUrl = `${process.env.FRONTEND_URL}/login`;
    const html = customerCreatedEmail({
      customerName: customer.name,
      ownerName: req.user.name,
      email,
      password: isNewCustomer ? password : '[Use your existing password]',
      payableAmount: payableAmount || 0,
      loginUrl
    });

    const plainText = `Hello ${customer.name},\n\nYour account has been added to the ledger of ${req.user.name}.\n\nYour login details:\nEmail: ${email}\n\nYour outstanding balance with this shop is: ₹${payableAmount || 0}\n\nPlease login to pay: ${loginUrl}`;

    try {
      await sendEmail({
        email: customer.email,
        subject: `🏪 Digital Udhaar Katha - Account linked by ${req.user.name}`,
        message: plainText,
        html,
      });
      console.log(`Notification email sent to ${customer.email}`);
    } catch (err) {
      console.log('Email could not be sent:', err.message);
    }

    // Respond back in format expected by OwnerDashboard
    res.status(201).json({
      success: true,
      data: {
        _id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        payableAmount: ledger.payableAmount,
        ledgerId: ledger._id
      }
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Get all customers for owner's ledger
// @route   GET /api/owner/customers
// @access  Private/Owner
export const getCustomers = async (req, res, next) => {
  try {
    const ledgers = await Ledger.find({ ownerId: req.user.id }).populate('customerId');

    // Format response to match original schema to keep frontend 100% compatible
    const formattedCustomers = ledgers.map(l => ({
      _id: l.customerId._id,
      name: l.customerId.name,
      email: l.customerId.email,
      phone: l.customerId.phone,
      payableAmount: l.payableAmount,
      ledgerId: l._id
    }));

    res.status(200).json({
      success: true,
      count: formattedCustomers.length,
      data: formattedCustomers
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Update customer debt on owner's ledger
// @route   PUT /api/owner/customers/:id/debt
// @access  Private/Owner
export const updateDebt = async (req, res, next) => {
  const { amount, description } = req.body; // positive to add debt, negative to reduce manually, optional description/note
  const customerId = req.params.id;

  try {
    const ledger = await Ledger.findOne({ ownerId: req.user.id, customerId });

    if (!ledger) {
      return res.status(404).json({ success: false, message: 'Customer ledger entry not found.' });
    }

    const customer = await User.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    const originalAmount = ledger.payableAmount;
    ledger.payableAmount += Number(amount);

    // Record the Credit or Debit Transaction with the optional note (description)
    await Transaction.create({
      ledgerId: ledger._id,
      ownerId: req.user.id,
      customerId,
      type: amount > 0 ? 'credit' : 'debit',
      amount: Math.abs(Number(amount)),
      description: description || (amount > 0 ? 'Manual debt addition' : 'Manual repayment')
    });
    
    // If ledger balance becomes 0 or less, auto-delete the ledger entry
    if (ledger.payableAmount <= 0) {
      const customerName = customer.name;
      const customerEmail = customer.email;
      const ownerName = req.user.name;
      const ownerEmail = req.user.email;

      await ledger.deleteOne();
      
      // Check if this customer has any other active ledgers left
      const remainingLedgers = await Ledger.find({ customerId });
      const noMoreDues = remainingLedgers.length === 0;
      
      if (noMoreDues) {
        // Delete the customer account completely
        await User.findByIdAndDelete(customerId);
      }

      // Notify customer via HTML email
      try {
        const customerHtml = accountDeletedEmail({ 
          customerName, 
          ownerName, 
          totalPaid: originalAmount 
        });
        await sendEmail({
          email: customerEmail,
          subject: '🎉 Congratulations! Your Udhaar is Fully Cleared!',
          message: `Congratulations ${customerName}! You have cleared all your outstanding dues of ₹${originalAmount} with ${ownerName}.`,
          html: customerHtml,
        });
      } catch (emailErr) {
        console.log('Could not send deletion email to customer:', emailErr.message);
      }

      // Notify owner about the final clearance
      if (ownerEmail) {
        try {
          const ownerHtml = ownerNotifyDeletionEmail({ 
            customerName, 
            ownerName, 
            totalPaid: originalAmount 
          });
          await sendEmail({
            email: ownerEmail,
            subject: `💰 ${customerName} has cleared their full balance!`,
            message: `${customerName} has cleared their full outstanding balance of ₹${originalAmount}.`,
            html: ownerHtml,
          });
        } catch (emailErr) {
          console.log('Could not send notification email to owner:', emailErr.message);
        }
      }

      return res.status(200).json({
        success: true,
        message: noMoreDues ? 'Total amount cleared. Customer account has been deleted.' : 'Balance with this shop cleared successfully!',
        accountDeleted: noMoreDues
      });
    }
    
    await ledger.save();
    
    // Notify customer via HTML email
    const type = amount > 0 ? 'added' : 'repaid';
    const loginUrl = `${process.env.FRONTEND_URL}/login`;
    
    const html = debtUpdatedEmail({
      customerName: customer.name,
      ownerName: req.user.name,
      amount: Number(amount),
      type,
      newBalance: ledger.payableAmount,
      loginUrl,
      note: description // pass description as the custom note to the email template
    });

    const plainText = `Hello ${customer.name},\n\nAn amount of ₹${Math.abs(amount)} has been ${type} to your udhaar katha by ${req.user.name}.${description ? `\nNote: ${description}` : ''}\n\nYour new total balance with this shop is: ₹${ledger.payableAmount}\n\nPlease login to view details: ${loginUrl}`;

    try {
      await sendEmail({
        email: customer.email,
        subject: `📊 Udhaar Update - ₹${Math.abs(amount).toLocaleString('en-IN')} ${type}`,
        message: plainText,
        html,
      });
    } catch (err) {
      console.log('Notification email could not be sent:', err.message);
    }

    res.status(200).json({
      success: true,
      data: {
        _id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        payableAmount: ledger.payableAmount,
        ledgerId: ledger._id
      }
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Update owner stripe keys
// @route   PUT /api/owner/stripe-keys
// @access  Private/Owner
export const updateStripeKeys = async (req, res, next) => {
  const { stripePublishableKey, stripeSecretKey } = req.body;

  try {
    const owner = await User.findByIdAndUpdate(
      req.user.id,
      { stripePublishableKey, stripeSecretKey },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Stripe keys updated successfully',
      data: { stripePublishableKey }
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Delete a customer ledger entry
// @route   DELETE /api/owner/customers/:id
// @access  Private/Owner
export const deleteCustomer = async (req, res, next) => {
  const customerId = req.params.id;
  try {
    const ledger = await Ledger.findOne({ ownerId: req.user.id, customerId });

    if (!ledger) {
      return res.status(404).json({ success: false, message: 'Ledger entry not found.' });
    }

    const customer = await User.findById(customerId);
    await ledger.deleteOne();

    // Check if this customer has any other active ledgers left
    const remainingLedgers = await Ledger.find({ customerId });
    const noMoreDues = remainingLedgers.length === 0;

    if (noMoreDues) {
      // Delete the customer account completely
      await User.findByIdAndDelete(customerId);
    }

    // Send removal email notification
    if (customer) {
      try {
        await sendEmail({
          email: customer.email,
          subject: `🏪 Digital Udhaar Katha - Ledger record removed by ${req.user.name}`,
          message: `Hello ${customer.name},\n\nYour ledger record with ${req.user.name} has been removed. If your account was deleted, you will no longer be able to login unless a shop owner creates a new record for you.`,
        });
      } catch (emailErr) {
        console.log('Could not send removal email to customer:', emailErr.message);
      }
    }

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
