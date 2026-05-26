# Digital Udhaar Katha (MERN Stack)

Digital Udhaar Katha is a secure, decoupled MERN-stack financial ledger system designed for shop owners and customers. It provides robust REST APIs, real-time database balance synchronization, decoupled multi-tenant transaction logging, Stripe integration, and automatic email receipt notifications.

## 🌐 Deployed Links

| Service | URL |
| :--- | :--- |
| **Frontend (Vercel)** | [https://digital-udhaar-katha.vercel.app](https://digital-udhaar-katha.vercel.app) |
| **Backend API (Render)** | [https://digital-udhaar-katha-backend.onrender.com](https://digital-udhaar-katha-backend.onrender.com) |

## 📋 Key Features

*   **Role-Based Access Control:** Distinct dashboards for Shop Owners and Customers.
*   **Decoupled Multi-Ledger Architecture:** Customers have globally unique accounts and can manage balances across multiple shop owners seamlessly.
*   **Comprehensive Transaction Logging:** Every debt addition and repayment is meticulously logged in a Global Activity Log.
*   **Online Payments (Stripe):** Customers can securely settle their debts using Stripe integration.
*   **Real-time Email Notifications:** Automated HTML email receipts for account creation, debt updates, successful payments, and password resets.
*   **Password Management:** Secure password reset flows utilizing cryptographic tokens.
*   **PDF Statements:** Customers can download professional PDF statements of their complete transaction history.
*   **Payment Reminders:** Shop owners can configure recurring reminder frequencies (daily, weekly, etc.) and send instant payment reminders.
*   **Custom Stripe Config:** Each shop owner can configure their own Stripe API keys so payments go directly to their account.
*   **Auto-Cleanup:** When a customer's balance reaches ₹0, the ledger entry is automatically purged and the customer account is deleted if no other ledgers exist.

## 🔄 How The App Works

### User Roles

There are two roles in the system:

1. **Shop Owner (Merchant)** — Registers on the platform, manages a credit ledger, onboards customers, adjusts balances, and sends payment reminders.
2. **Customer** — Cannot self-register. A shop owner creates their account. The customer can then log in to view balances, transaction history, and make online Stripe payments.

### End-to-End Workflow

#### Phase 1: Shop Owner Registration
- A shop owner visits the app and registers with their name, email, and password.
- They are automatically logged in and taken to the **Owner Dashboard**, which initially shows an empty customer list and ₹0 total outstanding.

#### Phase 2: Customer Onboarding
- The owner clicks **Add Customer** and fills in the customer's name, email, a temporary password, and an initial outstanding debt amount (e.g. ₹500).
- The system creates a globally unique user account for the customer (or links an existing one if the email is already registered under another shop owner).
- A **Ledger** entry is created linking the owner and customer with the initial payable amount.
- A **Transaction** record is logged as "Customer created with initial debt".
- A welcome email with login credentials is dispatched to the customer (via Brevo HTTP API or SMTP).

#### Phase 3: Managing the Ledger
The shop owner can perform two operations on any customer's ledger:

- **Add Debt:** When the customer buys something on credit, the owner adds the amount with an optional description (e.g. "Purchased rice and oil"). The balance increases.
- **Record Repayment:** When the customer pays cash offline, the owner records it as a negative adjustment (e.g. -₹200 with note "Paid cash at counter"). The balance decreases.

Each operation is:
1. Saved to the database instantly.
2. Logged as a chronological **Transaction** entry with the custom description.
3. An email notification with the updated balance is sent to the customer.

#### Phase 4: Payment Reminders
- The owner can configure recurring payment reminders per customer: **Daily**, **Every 3 Days**, **Weekly**, **Biweekly**, or **Monthly**.
- They can also send an **instant reminder** at any time.
- A background scheduler (`setInterval` every hour) checks for due reminders and dispatches them automatically.

#### Phase 5: Customer Dashboard
When the customer logs in, they see:
- A **total outstanding balance** across all shop owners.
- A list of **Active Shop Accounts** showing each shop owner and the amount owed.
- A **Transaction Ledger History** per shop, showing all credits and debits with timestamps and descriptions.
- A **Global Activity Log** tab with their entire cross-shop transaction history.
- A **Download PDF** button that generates a professional financial statement using `jsPDF`.

#### Phase 6: Online Stripe Payment
- The customer selects a shop account and enters a payment amount (or clicks "Clear Full").
- The app loads Stripe Elements using the shop owner's custom publishable key (or the global key if none is set).
- The customer enters their card details (supports test card `4242 4242 4242 4242`).
- On success:
  - The backend deducts the amount from the ledger.
  - A **debit Transaction** is recorded.
  - Both the customer and owner receive styled payment receipt emails.

#### Phase 7: Full Balance Clearance & Auto-Cleanup
When a customer's outstanding balance reaches **₹0** (via online payment or offline repayment):
1. The **Ledger** entry is automatically deleted.
2. If the customer has **no other active ledgers** with other shop owners, their **user account is completely purged** from the database.
3. Congratulatory emails are sent to both the customer and the owner.
4. On the frontend, a celebratory confetti animation plays and the customer is auto-logged out.

#### Forgot Password Flow
- Users can request a password reset from the login page.
- The backend generates a cryptographic reset token (valid for 10 minutes), saves it hashed in the database, and emails a styled reset link.
- Clicking the link opens the **Reset Password** page where the user sets a new password.

### Architecture Diagram

```
┌──────────────────┐          ┌──────────────────────┐          ┌─────────────┐
│   React Frontend │  ◄────►  │  Express.js Backend  │  ◄────►  │   MongoDB   │
│   (Vercel)       │   REST   │  (Render)            │ Mongoose │   Atlas     │
│                  │   API    │                      │          │             │
│  • Owner Dashboard│         │  • Auth Controller   │          │  • Users    │
│  • Customer Dash │         │  • Owner Controller  │          │  • Ledgers  │
│  • Stripe Elements│         │  • Payment Controller│          │  • Txns     │
│  • jsPDF Generator│         │  • Transaction Ctrl  │          │             │
└──────────────────┘          │  • Email Utility     │          └─────────────┘
                              │    (Brevo/SMTP)      │
                              └──────────┬───────────┘
                                         │
                              ┌──────────▼───────────┐
                              │   Stripe API         │
                              │   (Payment Gateway)  │
                              └──────────────────────┘
```

## 🏗️ Project Structure

This is a monorepo containing both the Frontend and Backend applications:

*   **`Frontend/`**: React application built with Vite, styled with custom CSS and Framer Motion.
*   **`Backend/`**: Node.js & Express API powered by MongoDB and Mongoose.

## 🛠️ Tech Stack

*   **Frontend:** React, Vite, Framer Motion, Custom CSS, Stripe Elements, jsPDF.
*   **Backend:** Node.js, Express, MongoDB (Mongoose), JSON Web Tokens (JWT), Nodemailer, Brevo HTTP API.

## 🚀 Getting Started

### 1. Backend Setup
Navigate to the `Backend` directory, install dependencies, and create a `.env` file with your MongoDB URI, JWT Secret, Stripe Secret Key, and email credentials.
```bash
cd Backend
npm install
npm run dev
```

**Required Environment Variables:**
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
STRIPE_SECRET_KEY=your_stripe_secret_key
BREVO_API_KEY=your_brevo_api_key          # For email via HTTP API (recommended)
SMTP_HOST=smtp-relay.brevo.com            # Or smtp.gmail.com for local dev
SMTP_PORT=2525                            # Use 2525 for Render (587 is blocked)
SMTP_EMAIL=your_smtp_login_email
SMTP_PASSWORD=your_smtp_password
FROM_NAME=Digital Udhaar Katha
FROM_EMAIL=your_verified_sender_email
FRONTEND_URL=https://digital-udhaar-katha.vercel.app
```

*(See `Backend/README.md` for detailed instructions)*

### 2. Frontend Setup
Navigate to the `Frontend` directory, install dependencies, and create a `.env.local` file with your API URL and Stripe Publishable Key.
```bash
cd Frontend
npm install
npm run dev
```

**Required Environment Variables:**
```env
VITE_API_URL=https://digital-udhaar-katha-backend.onrender.com/api
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

*(See `Frontend/README.md` for detailed instructions)*

## 📡 API Endpoints

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register a new shop owner | Public |
| `POST` | `/api/auth/login` | Login (owner or customer) | Public |
| `GET` | `/api/auth/logout` | Logout | Private |
| `GET` | `/api/auth/me` | Get current user profile | Private |
| `POST` | `/api/auth/forgotpassword` | Request password reset email | Public |
| `PUT` | `/api/auth/resetpassword/:token` | Reset password with token | Public |
| `POST` | `/api/owner/customers` | Create/onboard a customer | Owner |
| `GET` | `/api/owner/customers` | List all customers in ledger | Owner |
| `PUT` | `/api/owner/customers/:id/debt` | Add debt or record repayment | Owner |
| `DELETE` | `/api/owner/customers/:id` | Delete a customer ledger | Owner |
| `POST` | `/api/owner/customers/:id/remind` | Send payment reminder | Owner |
| `PUT` | `/api/owner/stripe-keys` | Update custom Stripe keys | Owner |
| `POST` | `/api/payment/create-intent` | Create Stripe payment intent | Customer |
| `POST` | `/api/payment/success` | Record successful payment | Customer |
| `GET` | `/api/transactions` | Get transaction history | Private |
