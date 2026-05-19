# Digital Udhaar Katha - Frontend Web Application

The frontend of Digital Udhaar Katha is a premium, single-page MERN web application built on React, Vite, and custom CSS. It features a stunning glassmorphism design system, harmonious HSL color schemes, dynamic layout states, custom interactive modals, and full Stripe online checkout elements.

## Visual Design and User Experience

The application is styled strictly in custom, premium Vanilla CSS, prioritizing elegant micro-interactions, responsive sizing, and high-fidelity layouts.

### Key Visual Tokens
* **Typography**: Integrated the Outfit sans-serif typeface from Google Fonts for a clean, modern aesthetic.
* **Glassmorphism**: Glass-card structures utilizing low opacity overlays, background blurs (backdrop-filter), and subtle thin borders to generate outstanding visual depth.
* **Color Harmonies**:
  * Surface Dark: Deep slate-blue/black base `#0f172a`
  * Text Primary: Off-white `#f8fafc`
  * Primary Accent: Violet/Indigo gradient `#6366f1` to `#8b5cf6`
  * Success/Repaid Indicator: Emerald Green `#10b981`
  * Error/Credit Indicator: Rose Red `#ef4444`
* **Micro-Animations**: Uses framer-motion for spring-loaded entrances, state transitions, and smooth hover scales on interactive buttons.

---

## Core Interfaces and Dashboards

### 1. Unified Authentication Interface
* Single, responsive login portal featuring glassmorphic forms.
* Automatically identifies the user's role (owner or customer) and routes them instantly to their specialized dashboard.

### 2. Owner Dashboard
* **Dynamic Overview Metrics**: Interactive stat cards highlighting total outstanding udhaar, active customer count, and Stripe account connection status.
* **Custom Interactive Modals**:
  * **Add Customer Modal**: Allows shopkeepers to onboard customers with name, credentials, initial debt, and an **Initial Note / Description** input that dynamically displays only when starting debt is set to > 0.
  * **Debt Update Modal**: Interactive modal equipped with custom quick-preset buttons (₹100, ₹500, ₹1000, ₹5000) and an integrated **Note / Description** input. Displays custom context placeholders based on whether the owner is adding credit or recording manual cash repayments.
  * **Delete Confirmation Modal**: Protects owners from accidentally deleting ledgers.
  * **Chronological History Modal (Drawer)**: Displays a full audit ledger per customer, mapping transaction values, timestamps, and custom notes clearly.

### 3. Customer Dashboard
* **Multi-Shop Account Switcher**: Displays outstanding debts from different merchants side-by-side using an elegant glass-morphic account switcher.
* **Stripe Elements Checkout**: Processes direct full or partial settlements using embedded sandbox checkout elements.
* **Ledger Statement Timeline**: Renders all historical transactions and displays custom notes (e.g. initial balances, item details, manual repayment tags, or Stripe verification stamps) directly inside the customer's personal statement timeline.

---

## Technical Stack & Libraries
* **Core**: React 18, Vite
* **Routing**: React Router DOM (v6)
* **Styling**: Custom CSS and Framer Motion
* **Network**: Axios with centralized API request interceptors for token management
* **Security & Payments**: Stripe SDK, React Stripe Elements, and Lucide React Icons

---

## Development Setup

### Prerequisites
* Node.js (version 16 or higher)
* Backend API active (typically on http://localhost:5000)

### Installation Steps

1. Navigate to the frontend directory:
   ```bash
   cd Frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root of the Frontend directory containing the following variables:
   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_test_publishable_key
   ```

4. Launch the local development server:
   ```bash
   npm run dev
   ```
   The application will hot-reload and run on http://localhost:5175 or http://localhost:5176.
