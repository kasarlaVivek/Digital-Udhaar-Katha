# Digital Udhaar Katha - Backend API

Digital Udhaar Katha is a secure, decoupled MERN-stack financial ledger system designed for shop owners and customers. The backend provides robust REST APIs, real-time database balance synchronization, decoupled multi-tenant transaction logging, Stripe integration, and automatic email receipt notifications.

## System Architecture and Database Design

The database utilizes a Decoupled Multi-Ledger Database Architecture (Option B) built on MongoDB. Rather than strictly linking a customer email to a single owner, customer credentials are globally unique across the platform. This allows customers to log in once and access a unified dashboard displaying all their outstanding balances across different shops.

### Core Data Models

1. **User Schema**
   * Fields: name, email, password (hashed), role (owner or customer), phone, stripePublishableKey, stripeSecretKey (encrypted), ledgers (references to active shop accounts).
   * Identifies all actors. Owners manage customers; customers login to view balances and settle accounts.

2. **Ledger Schema**
   * Fields: ownerId, customerId, ownerName, payableAmount, stripePublishableKey.
   * Connects a globally unique customer to a specific owner's shop, keeping the credit entries isolated.

3. **Transaction Schema**
   * Fields: ledgerId, ownerId, customerId, type (credit or debit), amount, description, createdAt.
   * Maintains a permanent, chronological statement ledger of every credit addition, repayment, and Stripe transaction.

---

## Core System Flows

### 1. Authentication and Onboarding
* Owners register and login.
* Owners register customers directly inside their dashboard by providing the customer's name, email, unique password, phone number, and initial debt.
* If the customer does not exist in the database, a new globally unique user account is automatically created.
* If the customer already exists, the backend links a new separate Ledger entry under the customer's account for this specific shop.

### 2. Balance Adjustment, Note Integration, and Payment
* **Manual Credit/Debit**: Owners can update customer debts using premium modals. Every balance adjustment accepts a custom **Note / Description** parameter from the client (e.g. `"Rice & soap packets"`, `"Cash paid at counter"`).
* **Context Preservation**: The backend records the note directly inside the `description` field of the `Transaction` schema. If omitted, the system defaults to appropriate transaction events (like `'Manual debt addition'` or `'Manual repayment'`).
* **Stripe Online Settle**: Customers pay outstanding dues online via Stripe. The system registers a secure payment transaction with description `'Online Payment (Stripe)'`.

### 3. Automated Deletion and Account Clearance
* When a customer's outstanding balance reaches exactly zero (either through manual repayment or online Stripe payment), the backend:
  1. Deletes the specific shop's ledger mapping document.
  2. Evaluates if the customer has any other active outstanding ledgers with other shops in the system.
  3. If no other active ledgers remain, the customer's user account is completely purged from the database, preventing orphaned accounts.

### 4. Real-time Email Notifications
* Powered by Nodemailer with highly responsive, secure HTML/CSS email templates.
* Triggered on user registration, manual debt updates, Stripe payment receipts, password resets, and final congratulations/account clearance.
* Integrates custom transaction notes directly into a visually distinct card inside the customer email template (`debtUpdatedEmail`), allowing immediate invoice-level transparency.

### 5. Secure Password Management
* Forgot password flow allows users (both owners and customers) to request a secure reset token via email.
* Token is cryptographically hashed using Node's native `crypto` module before saving to the database.

---

## Development Setup

### Prerequisites
* Node.js (version 16 or higher)
* MongoDB (Local instance or MongoDB Atlas URI)
* Gmail SMTP Credentials (requires a 16-character App Password)

### Installation Steps

1. Navigate to the backend directory:
   ```bash
   cd Backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root of the Backend directory with the following variables:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_signing_secret
   STRIPE_SECRET_KEY=your_stripe_test_secret_key
   FRONTEND_URL=http://localhost:5175
   
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_EMAIL=your_sender_gmail@gmail.com
   SMTP_PASSWORD=your_16_character_google_app_password
   FROM_NAME=Digital Udhaar Katha
   FROM_EMAIL=your_sender_gmail@gmail.com
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```
   Or run standard nodemon:
   ```bash
   npx nodemon index.js
   ```

### Diagnostic & E2E Integration Testing

To verify the system components, run the following automated diagnostic utilities:

#### 1. SMTP Credentials & Mailbox Test
Sends a rich, styled HTML verification email to your configured SMTP address:
```bash
node test_email.js
```

#### 2. E2E Core Integration Test
Simulates owner registration, customer linkage with a custom welcome note, debt update with a custom note, manual repayments, Stripe payment processing, and balance clearance cleanups. Asserts database constraints in MongoDB and dispatches notifications:
```bash
node test_e2e.js
```

---

## API Endpoints

### Authentication
* `POST /api/auth/register` - Register a new owner
* `POST /api/auth/login` - Login owner or customer
* `GET /api/auth/me` - Get current authenticated user details
* `POST /api/auth/forgotpassword` - Request a password reset email
* `PUT /api/auth/resetpassword/:resettoken` - Reset password using the emailed token

### Owner Management
* `POST /api/owner/customers` - Register/Onboard a customer
* `GET /api/owner/customers` - Fetch all customers linked to this owner
* `PUT /api/owner/customers/:id/debt` - Adjust credit/debit for a customer
* `DELETE /api/owner/customers/:id` - Delete a customer ledger account

### Stripe Payments
* `POST /api/payment/create-intent` - Generate Stripe Client Secret for checkout
* `POST /api/payment/success` - Update ledger balance and send receipts on checkout success

### Ledger History
* `GET /api/transactions` - Fetch chronologically logged statements for the authenticated user
