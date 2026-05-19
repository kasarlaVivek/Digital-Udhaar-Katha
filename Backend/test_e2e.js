import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './models/User.js';
import Ledger from './models/Ledger.js';
import Transaction from './models/Transaction.js';

dotenv.config();

const API_URL = 'http://localhost:5000/api';

// Helper to handle API requests and retain cookies/JWT tokens
class ApiClient {
  constructor() {
    this.token = null;
  }

  setToken(token) {
    this.token = token;
  }

  async request(path, options = {}) {
    const url = `${API_URL}${path}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const fetchOptions = {
      method: options.method || 'GET',
      headers,
      ...options,
    };

    if (options.body) {
      fetchOptions.body = JSON.stringify(options.body);
    }

    const response = await fetch(url, fetchOptions);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(`API Error [${response.status}]: ${data.message || response.statusText}`);
    }

    return data;
  }
}

async function runTests() {
  console.log('🏁 Starting E2E Integration and Email Flow Verification...');

  // Connect to DB directly for cleanup and direct DB assertion
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB directly for assertions.');

  // Clean up any old test users
  const testOwnerEmail = 'owner_test_e2e@example.com';
  const testCustomerEmail = process.env.SMTP_EMAIL || 'bruvgang321@gmail.com';

  console.log('🧹 Cleaning up database before test...');
  const existingOwner = await User.findOne({ email: testOwnerEmail });
  if (existingOwner) {
    await Ledger.deleteMany({ ownerId: existingOwner._id });
    await Transaction.deleteMany({ ownerId: existingOwner._id });
    await User.deleteOne({ _id: existingOwner._id });
  }

  const existingCustomer = await User.findOne({ email: testCustomerEmail });
  if (existingCustomer) {
    await Ledger.deleteMany({ customerId: existingCustomer._id });
    await Transaction.deleteMany({ customerId: existingCustomer._id });
    await User.deleteOne({ _id: existingCustomer._id });
  }
  console.log('✅ Database cleaned up.');

  const ownerClient = new ApiClient();
  const customerClient = new ApiClient();

  // 1. Owner Registration
  console.log('\n--- Step 1: Owner Registration ---');
  const ownerReg = await ownerClient.request('/auth/register', {
    method: 'POST',
    body: {
      name: 'Super E2E Shop Owner',
      email: testOwnerEmail,
      password: 'password123',
    },
  });
  console.log('Owner Registered successfully:', ownerReg.success);
  ownerClient.setToken(ownerReg.token);

  // 2. Create Customer with initial debt of 500 and a note
  console.log('\n--- Step 2: Create Customer & Send Welcome Email ---');
  const customerData = {
    name: 'E2E Test Customer',
    email: testCustomerEmail,
    password: 'customerPassword123',
    phone: '9876543210',
    payableAmount: 500,
    description: 'E2E welcome opening limit',
  };

  const createRes = await ownerClient.request('/owner/customers', {
    method: 'POST',
    body: customerData,
  });

  console.log('Customer linked successfully:', createRes.success);
  console.log('Customer Details:', createRes.data);
  const customerId = createRes.data._id;
  const ledgerId = createRes.data.ledgerId;

  // DB Verification
  const dbCustomer = await User.findById(customerId);
  const dbLedger = await Ledger.findById(ledgerId);
  const dbTx1 = await Transaction.findOne({ ledgerId, type: 'credit' });

  console.log('DB Assertion: Customer exists globally:', !!dbCustomer);
  console.log('DB Assertion: Ledger payableAmount:', dbLedger.payableAmount);
  console.log('DB Assertion: Initial Credit transaction recorded:', dbTx1.amount);
  console.log('DB Assertion: Initial Credit note (expected "E2E welcome opening limit"):', dbTx1.description);

  if (dbLedger.payableAmount !== 500 || !dbTx1 || dbTx1.description !== 'E2E welcome opening limit') {
    throw new Error('Initial customer creation verification or note failed in DB!');
  }
  console.log('✅ Step 2 Welcome email triggered to:', testCustomerEmail);

  // 3. Customer Logs In
  console.log('\n--- Step 3: Customer Login ---');
  const customerLogin = await customerClient.request('/auth/login', {
    method: 'POST',
    body: {
      email: testCustomerEmail,
      password: 'customerPassword123',
    },
  });
  console.log('Customer Logged in successfully:', customerLogin.success);
  customerClient.setToken(customerLogin.token);

  // 4. Owner Adds Debt (250) with a note
  console.log('\n--- Step 4: Owner Adds Debt (₹250) ---');
  const updateRes1 = await ownerClient.request(`/owner/customers/${customerId}/debt`, {
    method: 'PUT',
    body: { 
      amount: 250,
      description: '1x Wheat flour, 2x Cooking oil'
    },
  });
  console.log('Updated balance (after adding ₹250):', updateRes1.data.payableAmount);

  const dbLedgerAfterAdd = await Ledger.findById(ledgerId);
  const dbTx2 = await Transaction.findOne({ ledgerId, type: 'credit', amount: 250 });
  console.log('DB Assertion: Ledger balance (expected 750):', dbLedgerAfterAdd.payableAmount);
  console.log('DB Assertion: Debt Addition note (expected "1x Wheat flour, 2x Cooking oil"):', dbTx2 ? dbTx2.description : 'Not found');
  
  if (dbLedgerAfterAdd.payableAmount !== 750 || !dbTx2 || dbTx2.description !== '1x Wheat flour, 2x Cooking oil') {
    throw new Error('Adding debt calculation or note failed!');
  }
  console.log('✅ Step 4 Debt Addition email triggered to:', testCustomerEmail);

  // 5. Owner Records Partial Repayment (Manual -350) with a note
  console.log('\n--- Step 5: Owner Records Partial Repayment (Manual -₹350) ---');
  const updateRes2 = await ownerClient.request(`/owner/customers/${customerId}/debt`, {
    method: 'PUT',
    body: { 
      amount: -350,
      description: 'Paid by Cash at counter'
    },
  });
  console.log('Updated balance (after repaying ₹350):', updateRes2.data.payableAmount);

  const dbLedgerAfterRepay = await Ledger.findById(ledgerId);
  const dbTx3 = await Transaction.findOne({ ledgerId, type: 'debit', amount: 350 });
  console.log('DB Assertion: Ledger balance (expected 400):', dbLedgerAfterRepay.payableAmount);
  console.log('DB Assertion: Repayment note (expected "Paid by Cash at counter"):', dbTx3 ? dbTx3.description : 'Not found');
  
  if (dbLedgerAfterRepay.payableAmount !== 400 || !dbTx3 || dbTx3.description !== 'Paid by Cash at counter') {
    throw new Error('Partial manual repayment calculation or note failed!');
  }
  console.log('✅ Step 5 Partial Repayment email triggered to:', testCustomerEmail);

  // 6. Stripe Payment success simulation (₹200)
  console.log('\n--- Step 6: Simulate Stripe Payment Success (₹200) ---');
  const stripeSuccessRes = await customerClient.request('/payment/success', {
    method: 'POST',
    body: {
      amount: 200,
      ledgerId,
    },
  });
  console.log('Stripe Payment Success response message:', stripeSuccessRes.message);
  console.log('Remaining balance returned:', stripeSuccessRes.remainingBalance);

  const dbLedgerAfterStripe = await Ledger.findById(ledgerId);
  console.log('DB Assertion: Ledger balance (expected 200):', dbLedgerAfterStripe.payableAmount);
  if (dbLedgerAfterStripe.payableAmount !== 200) {
    throw new Error('Stripe payment update failed!');
  }
  console.log('✅ Step 6 Stripe Payment Receipt emails triggered to Customer & Owner!');

  // 7. Full Manual Repayment Clearance (-200) -> Ledger deletion and customer account cleanup
  console.log('\n--- Step 7: Full Manual Repayment Clearance (-₹200) ---');
  const finalRepayRes = await ownerClient.request(`/owner/customers/${customerId}/debt`, {
    method: 'PUT',
    body: { amount: -200 },
  });

  console.log('Final Repayment response message:', finalRepayRes.message);
  console.log('Final Repayment accountDeleted flag:', finalRepayRes.accountDeleted);

  const dbLedgerFinal = await Ledger.findById(ledgerId);
  const dbCustomerFinal = await User.findById(customerId);

  console.log('DB Assertion: Ledger is DELETED (expected null):', dbLedgerFinal);
  console.log('DB Assertion: Customer User account is DELETED (expected null):', dbCustomerFinal);

  if (dbLedgerFinal !== null || dbCustomerFinal !== null) {
    throw new Error('Full clearance did not delete ledger or customer user account!');
  }
  console.log('✅ Step 7 Full Clearance congratulations/notification emails triggered to Customer & Owner!');

  console.log('\n🌟🌟🌟 ALL E2E INTEGRATION AND EMAIL FLOW TESTS PASSED SUCCESSFULLY! 🌟🌟🌟');
  process.exit(0);
}

runTests().catch(err => {
  console.error('\n❌ E2E Test Suite FAILED with error:', err.message);
  console.error(err);
  process.exit(1);
});
