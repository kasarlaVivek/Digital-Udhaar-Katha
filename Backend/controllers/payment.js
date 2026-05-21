import Stripe from 'stripe';
import User from '../models/User.js';
import Ledger from '../models/Ledger.js';
import Transaction from '../models/Transaction.js';
import sendEmail from '../utils/sendEmail.js';
import { accountDeletedEmail, ownerNotifyDeletionEmail, paymentVerifiedEmail } from '../utils/emailTemplates.js';

const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_...') {
    console.warn('Stripe API Key is missing or invalid. Payments will not work.');
    return null;
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
};

// @desc    Create Stripe Payment Intent for a specific owner/ledger
// @route   POST /api/payment/create-intent
// @access  Private/Customer
export const createPaymentIntent = async (req, res) => {
  const { amount, ownerId, ledgerId } = req.body;

  try {
    let ledger;
    if (ledgerId) {
      ledger = await Ledger.findById(ledgerId);
    } else if (ownerId) {
      ledger = await Ledger.findOne({ ownerId, customerId: req.user.id });
    } else {
      // Default to customer's first active ledger
      ledger = await Ledger.findOne({ customerId: req.user.id });
    }

    if (!ledger) {
      return res.status(404).json({ success: false, message: 'Ledger entry not found for this customer.' });
    }

    const owner = await User.findById(ledger.ownerId).select('+stripeSecretKey');

    if (!owner || !owner.stripeSecretKey) {
      // Fallback to global Stripe key
      const stripe = getStripe();
      if (!stripe) {
        return res.status(500).json({ success: false, message: 'Payment system is not configured. Please contact the owner.' });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: 'inr',
        metadata: { userId: req.user.id, ownerId: ledger.ownerId.toString(), ledgerId: ledger._id.toString() },
      });

      return res.status(200).json({
        success: true,
        clientSecret: paymentIntent.client_secret,
      });
    }

    const stripe = new Stripe(owner.stripeSecretKey);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'inr',
      metadata: { userId: req.user.id, ownerId: ledger.ownerId.toString(), ledgerId: ledger._id.toString() },
    });

    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      publishableKey: owner.stripePublishableKey || undefined
    });
  } catch (err) {
    console.error('Stripe Error:', err.message);
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Update payment status after successful Stripe payment
// @route   POST /api/payment/success
// @access  Private/Customer
export const paymentSuccess = async (req, res) => {
  const { amount, ownerId, ledgerId } = req.body;

  try {
    const customer = await User.findById(req.user.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let ledger;
    if (ledgerId) {
      ledger = await Ledger.findById(ledgerId);
    } else if (ownerId) {
      ledger = await Ledger.findOne({ ownerId, customerId: req.user.id });
    } else {
      // Default to first active ledger
      ledger = await Ledger.findOne({ customerId: req.user.id });
    }

    if (!ledger) {
      return res.status(404).json({ success: false, message: 'Ledger entry not found.' });
    }

    const owner = await User.findById(ledger.ownerId);
    const originalAmount = ledger.payableAmount;
    ledger.payableAmount -= Number(amount);

    // 1. Record the Debit Transaction
    const transaction = await Transaction.create({
      ledgerId: ledger._id,
      ownerId: ledger.ownerId,
      customerId: req.user.id,
      customerName: customer.name,
      customerEmail: customer.email,
      ownerName: owner ? owner.name : '',
      type: 'debit',
      amount: Number(amount),
      description: 'Stripe Online Payment'
    });

    // 2. Notify both Owner and Customer with verified receipt emails
    const remainingBalance = Math.max(0, ledger.payableAmount);
    
    // Email to customer asynchronously
    try {
      const customerReceiptHtml = paymentVerifiedEmail({
        customerName: customer.name,
        ownerName: owner.name,
        amountPaid: amount,
        remainingBalance,
        transactionId: transaction._id,
        isForOwner: false
      });
      sendEmail({
        email: customer.email,
        subject: `💳 Payment Receipt - ₹${Number(amount).toLocaleString('en-IN')} Paid to ${owner.name}`,
        message: `Your payment of ₹${amount} to ${owner.name} has been processed successfully.`,
        html: customerReceiptHtml
      }).catch((err) => {
        console.error('Could not send payment verification email to customer:', err.message);
      });
    } catch (err) {
      console.error('Error generating customer payment receipt email:', err.message);
    }

    // Email to owner asynchronously
    if (owner && owner.email) {
      try {
        const ownerReceiptHtml = paymentVerifiedEmail({
          customerName: customer.name,
          ownerName: owner.name,
          amountPaid: amount,
          remainingBalance,
          transactionId: transaction._id,
          isForOwner: true
        });
        sendEmail({
          email: owner.email,
          subject: `💰 Payment Verified - Received ₹${Number(amount).toLocaleString('en-IN')} from ${customer.name}`,
          message: `We verified a payment of ₹${amount} from ${customer.name}.`,
          html: ownerReceiptHtml
        }).catch((err) => {
          console.error('Could not send payment verification email to owner:', err.message);
        });
      } catch (err) {
        console.error('Error generating owner payment receipt email:', err.message);
      }
    }

    // 3. If fully paid or overpaid, remove this ledger entry
    if (ledger.payableAmount <= 0) {
      const customerName = customer.name;
      const customerEmail = customer.email;
      const totalPaid = originalAmount;
      const ownerName = owner?.name || 'Shop Owner';
      const ownerEmail = owner?.email;

      await Transaction.create({
        ledgerId: ledger._id,
        ownerId: ledger.ownerId,
        customerId: req.user.id,
        customerName,
        customerEmail,
        ownerName,
        type: 'debit',
        amount: 0,
        description: `Customer deleted - Debt cleared (₹0 written off)`
      });

      // Delete the specific ledger
      await ledger.deleteOne();

      // Check if this customer has any other active ledgers left
      const remainingLedgers = await Ledger.find({ customerId: req.user.id });
      const noMoreDues = remainingLedgers.length === 0;

      if (noMoreDues) {
        // Delete the customer account completely
        await User.findByIdAndDelete(req.user.id);
      }

      // Send additional congratulations email to customer about credit clearance asynchronously in the background
      try {
        const customerHtml = accountDeletedEmail({ customerName, ownerName, totalPaid });
        sendEmail({
          email: customerEmail,
          subject: '🎉 Congratulations! Your Udhaar is Fully Cleared!',
          message: `Congratulations ${customerName}! You have cleared all your outstanding dues of ₹${totalPaid} with ${ownerName}.`,
          html: customerHtml,
        }).catch((emailErr) => {
          console.log('Could not send deletion email to customer:', emailErr.message);
        });
      } catch (err) {
        console.log('Error generating clearance email to customer:', err.message);
      }

      // Notify owner about the final clearance asynchronously in the background
      if (ownerEmail) {
        try {
          const ownerHtml = ownerNotifyDeletionEmail({ customerName, ownerName, totalPaid });
          sendEmail({
            email: ownerEmail,
            subject: `💰 ${customerName} has cleared their full balance!`,
            message: `${customerName} has cleared their full outstanding balance of ₹${totalPaid}.`,
            html: ownerHtml,
          }).catch((emailErr) => {
            console.log('Could not send notification email to owner:', emailErr.message);
          });
        } catch (err) {
          console.log('Error generating clearance email to owner:', err.message);
        }
      }

      return res.status(200).json({
        success: true,
        message: noMoreDues ? 'Total amount cleared. Your account has been deleted.' : 'Balance with this shop cleared successfully!',
        remainingBalance: 0,
        accountDeleted: noMoreDues
      });
    }

    // Save updated balance for partial payment
    await ledger.save();

    return res.status(200).json({
      success: true,
      message: `Payment of ₹${amount} successful.`,
      remainingBalance: ledger.payableAmount,
      accountDeleted: false
    });
  } catch (err) {
    console.error('Payment Update Error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};
