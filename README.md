# Digital Udhaar Katha (MERN Stack)

Digital Udhaar Katha is a secure, decoupled MERN-stack financial ledger system designed for shop owners and customers. It provides robust REST APIs, real-time database balance synchronization, decoupled multi-tenant transaction logging, Stripe integration, and automatic email receipt notifications.

##  Key Features

*   **Role-Based Access Control:** Distinct dashboards for Shop Owners and Customers.
*   **Decoupled Multi-Ledger Architecture:** Customers have globally unique accounts and can manage balances across multiple shop owners seamlessly.
*   **Comprehensive Transaction Logging:** Every debt addition and repayment is meticulously logged in a Global Activity Log.
*   **Online Payments (Stripe):** Customers can securely settle their debts using Stripe integration.
*   **Real-time Email Notifications:** Automated HTML email receipts for account creation, debt updates, successful payments, and password resets.
*   **Password Management:** Secure password reset flows utilizing cryptographic tokens.

##  Project Structure

This is a monorepo containing both the Frontend and Backend applications:

*   **`Frontend/`**: React application built with Vite, styled with custom CSS and Framer Motion.
*   **`Backend/`**: Node.js & Express API powered by MongoDB and Mongoose.

##  Tech Stack

*   **Frontend:** React, Vite, Framer Motion, Tailwind (via generic classes), Stripe Elements.
*   **Backend:** Node.js, Express, MongoDB (Mongoose), JSON Web Tokens (JWT), Nodemailer.

##  Getting Started

### 1. Backend Setup
Navigate to the `Backend` directory, install dependencies, and create a `.env` file with your MongoDB URI, JWT Secret, Stripe Secret Key, and Gmail SMTP credentials.
\`\`\`bash
cd Backend
npm install
npm run dev
\`\`\`
*(See `Backend/README.md` for detailed instructions)*

### 2. Frontend Setup
Navigate to the `Frontend` directory, install dependencies, and create a `.env.local` file with your API URL and Stripe Publishable Key.
\`\`\`bash
cd Frontend
npm install
npm run dev
\`\`\`
*(See `Frontend/README.md` for detailed instructions)*
