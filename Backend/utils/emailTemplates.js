/**
 * HTML Email Templates for Digital Udhaar Katha
 */

const baseStyles = `
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: #0f172a;
  color: #f8fafc;
`;

const cardStyles = `
  background: linear-gradient(135deg, #1e293b, #0f172a);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 32px;
  max-width: 520px;
  margin: 24px auto;
`;

const buttonStyles = `
  display: inline-block;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  text-decoration: none;
  padding: 14px 32px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 16px;
  margin-top: 16px;
`;

const highlightBox = (color = '#6366f1') => `
  background: ${color}15;
  border: 1px solid ${color}40;
  border-radius: 12px;
  padding: 16px 20px;
  margin: 16px 0;
`;

/**
 * Email sent when owner creates a new customer account
 */
export const customerCreatedEmail = ({ customerName, ownerName, email, password, payableAmount, loginUrl }) => {
  const html = `
  <div style="${baseStyles}">
    <div style="${cardStyles}">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="font-size: 28px; margin: 0; color: #f8fafc;">
          Welcome to <span style="background: linear-gradient(135deg, #6366f1, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">UdhaarKatha</span>
        </h1>
      </div>

      <p style="color: #94a3b8; font-size: 16px; line-height: 1.6;">
        Hello <strong style="color: #f8fafc;">${customerName}</strong>,
      </p>
      <p style="color: #94a3b8; font-size: 16px; line-height: 1.6;">
        <strong style="color: #f8fafc;">${ownerName}</strong> has created an account for you on Digital Udhaar Katha to manage your credit.
      </p>

      <div style="${highlightBox('#6366f1')}">
        <p style="margin: 0 0 12px 0; font-size: 14px; color: #94a3b8;">Your Login Credentials</p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #94a3b8; font-size: 14px;">Email</td>
            <td style="padding: 6px 0; color: #f8fafc; font-weight: 600; text-align: right;">${email}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #94a3b8; font-size: 14px;">Password</td>
            <td style="padding: 6px 0; color: #f8fafc; font-weight: 600; text-align: right;">${password}</td>
          </tr>
        </table>
      </div>

      <div style="${highlightBox('#ef4444')}">
        <p style="margin: 0 0 4px 0; font-size: 14px; color: #94a3b8;">Current Outstanding Balance</p>
        <p style="margin: 0; font-size: 32px; font-weight: 800; color: #ef4444;">₹${Number(payableAmount).toLocaleString('en-IN')}</p>
      </div>

      <div style="text-align: center; margin-top: 24px;">
        <a href="${loginUrl}" style="${buttonStyles}">
          Login & Pay Now →
        </a>
      </div>

      <p style="color: #64748b; font-size: 12px; margin-top: 24px; text-align: center;">
        Please change your password after your first login for security.
      </p>
    </div>

    <p style="text-align: center; color: #475569; font-size: 12px; padding: 16px;">
      © 2026 Digital Udhaar Katha. All rights reserved.
    </p>
  </div>
  `;

  return html;
};

/**
 * Email sent when debt is updated
 */
export const debtUpdatedEmail = ({ customerName, ownerName, amount, type, newBalance, loginUrl, note }) => {
  const isAdded = type === 'added';
  const color = isAdded ? '#ef4444' : '#10b981';
  const icon = isAdded ? '📈' : '📉';

  const html = `
  <div style="${baseStyles}">
    <div style="${cardStyles}">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="font-size: 40px; margin-bottom: 8px;">${icon}</div>
        <h2 style="font-size: 22px; margin: 0; color: #f8fafc;">Balance Update</h2>
      </div>

      <p style="color: #94a3b8; font-size: 16px; line-height: 1.6;">
        Hello <strong style="color: #f8fafc;">${customerName}</strong>,
      </p>
      <p style="color: #94a3b8; font-size: 16px; line-height: 1.6;">
        <strong style="color: #f8fafc;">${ownerName}</strong> has ${isAdded ? 'added' : 'recorded a repayment of'}
        <strong style="color: ${color};">₹${Math.abs(amount).toLocaleString('en-IN')}</strong>
        ${isAdded ? 'to your credit' : 'on your credit'}.
      </p>

      ${note ? `
      <div style="background: rgba(255, 255, 255, 0.05); border-left: 4px solid ${color}; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
        <p style="margin: 0 0 4px 0; font-size: 11px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Note / Description</p>
        <p style="margin: 0; color: #f8fafc; font-style: italic; font-size: 15px;">"${note}"</p>
      </div>
      ` : ''}

      <div style="${highlightBox(color)}">
        <p style="margin: 0 0 4px 0; font-size: 14px; color: #94a3b8;">New Outstanding Balance</p>
        <p style="margin: 0; font-size: 32px; font-weight: 800; color: ${newBalance > 0 ? '#ef4444' : '#10b981'};">₹${Number(newBalance).toLocaleString('en-IN')}</p>
      </div>

      <div style="text-align: center; margin-top: 24px;">
        <a href="${loginUrl}" style="${buttonStyles}">
          View Details & Pay →
        </a>
      </div>
    </div>

    <p style="text-align: center; color: #475569; font-size: 12px; padding: 16px;">
      © 2026 Digital Udhaar Katha. All rights reserved.
    </p>
  </div>
  `;

  return html;
};

/**
 * Email sent when customer's account is deleted after full payment
 */
export const accountDeletedEmail = ({ customerName, ownerName, totalPaid }) => {
  const html = `
  <div style="${baseStyles}">
    <div style="${cardStyles}">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="font-size: 48px; margin-bottom: 8px;">🎉</div>
        <h2 style="font-size: 26px; margin: 0; color: #10b981;">All Clear!</h2>
      </div>

      <p style="color: #94a3b8; font-size: 16px; line-height: 1.6;">
        Hello <strong style="color: #f8fafc;">${customerName}</strong>,
      </p>
      <p style="color: #94a3b8; font-size: 16px; line-height: 1.6;">
        Congratulations! You have successfully cleared all your outstanding dues
        ${ownerName ? `with <strong style="color: #f8fafc;">${ownerName}</strong>` : ''}.
      </p>

      <div style="${highlightBox('#10b981')}">
        <p style="margin: 0 0 4px 0; font-size: 14px; color: #94a3b8;">Total Amount Paid</p>
        <p style="margin: 0; font-size: 32px; font-weight: 800; color: #10b981;">₹${Number(totalPaid).toLocaleString('en-IN')}</p>
      </div>

      <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 16px; margin-top: 16px; text-align: center;">
        <p style="margin: 0; color: #10b981; font-weight: 600;">Your account has been closed.</p>
        <p style="margin: 8px 0 0 0; font-size: 13px; color: #94a3b8;">
          Your Udhaar record has been removed. If you need credit again in the future, the shop owner can create a new account for you.
        </p>
      </div>

      <p style="color: #64748b; font-size: 14px; margin-top: 24px; text-align: center;">
        Thank you for using Digital Udhaar Katha! 🙏
      </p>
    </div>

    <p style="text-align: center; color: #475569; font-size: 12px; padding: 16px;">
      © 2026 Digital Udhaar Katha. All rights reserved.
    </p>
  </div>
  `;

  return html;
};

/**
 * Email sent to owner when customer clears all dues
 */
export const ownerNotifyDeletionEmail = ({ customerName, ownerName, totalPaid }) => {
  const html = `
  <div style="${baseStyles}">
    <div style="${cardStyles}">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="font-size: 40px; margin-bottom: 8px;">💰</div>
        <h2 style="font-size: 22px; margin: 0; color: #f8fafc;">Payment Received!</h2>
      </div>

      <p style="color: #94a3b8; font-size: 16px; line-height: 1.6;">
        Hello <strong style="color: #f8fafc;">${ownerName}</strong>,
      </p>
      <p style="color: #94a3b8; font-size: 16px; line-height: 1.6;">
        Great news! <strong style="color: #10b981;">${customerName}</strong> has cleared their full outstanding balance.
      </p>

      <div style="${highlightBox('#10b981')}">
        <p style="margin: 0 0 4px 0; font-size: 14px; color: #94a3b8;">Total Received</p>
        <p style="margin: 0; font-size: 32px; font-weight: 800; color: #10b981;">₹${Number(totalPaid).toLocaleString('en-IN')}</p>
      </div>

      <div style="background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 12px; padding: 16px; margin-top: 16px;">
        <p style="margin: 0; color: #94a3b8; font-size: 14px;">
          Their account has been automatically removed from your ledger since all dues are cleared.
        </p>
      </div>
    </div>

    <p style="text-align: center; color: #475569; font-size: 12px; padding: 16px;">
      © 2026 Digital Udhaar Katha. All rights reserved.
    </p>
  </div>
  `;

  return html;
};

/**
 * Email sent to both customer and owner to verify/receipt a successful payment
 */
export const paymentVerifiedEmail = ({ customerName, ownerName, amountPaid, remainingBalance, transactionId, isForOwner }) => {
  const html = `
  <div style="${baseStyles}">
    <div style="${cardStyles}">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="font-size: 40px; margin-bottom: 8px;">💳</div>
        <h2 style="font-size: 22px; margin: 0; color: #10b981;">Payment Verified</h2>
        <p style="color: #94a3b8; font-size: 14px; margin: 4px 0 0 0;">Transaction ID: ${transactionId}</p>
      </div>

      <p style="color: #94a3b8; font-size: 16px; line-height: 1.6;">
        Hello <strong style="color: #f8fafc;">${isForOwner ? ownerName : customerName}</strong>,
      </p>
      
      <p style="color: #94a3b8; font-size: 16px; line-height: 1.6;">
        ${isForOwner 
          ? `We have verified a payment of <strong style="color: #10b981;">₹${Number(amountPaid).toLocaleString('en-IN')}</strong> from <strong style="color: #f8fafc;">${customerName}</strong>.`
          : `Your payment of <strong style="color: #10b981;">₹${Number(amountPaid).toLocaleString('en-IN')}</strong> to <strong style="color: #f8fafc;">${ownerName}</strong> has been successfully processed.`
        }
      </p>

      <div style="${highlightBox('#10b981')}">
        <p style="margin: 0 0 4px 0; font-size: 14px; color: #94a3b8;">Amount Credited</p>
        <p style="margin: 0; font-size: 32px; font-weight: 800; color: #10b981;">₹${Number(amountPaid).toLocaleString('en-IN')}</p>
      </div>

      <div style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 16px; margin: 16px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #94a3b8;">
          <tr>
            <td style="padding: 6px 0;">Date & Time</td>
            <td style="padding: 6px 0; color: #f8fafc; font-weight: 600; text-align: right;">${new Date().toLocaleString('en-IN')}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0;">Payment Method</td>
            <td style="padding: 6px 0; color: #f8fafc; font-weight: 600; text-align: right;">Online (Stripe Card)</td>
          </tr>
          <tr>
            <td style="padding: 6px 0;">Remaining Dues</td>
            <td style="padding: 6px 0; color: #ef4444; font-weight: 600; text-align: right;">₹${Number(remainingBalance).toLocaleString('en-IN')}</td>
          </tr>
        </table>
      </div>

      <p style="color: #64748b; font-size: 13px; text-align: center; margin-top: 24px;">
        This email serves as an official receipt. Thank you for your business! 🙏
      </p>
    </div>

    <p style="text-align: center; color: #475569; font-size: 12px; padding: 16px;">
      © 2026 Digital Udhaar Katha. All rights reserved.
    </p>
  </div>
  `;

  return html;
};

/**
 * Email sent for password reset
 */
export const passwordResetEmail = ({ resetUrl }) => {
  const html = `
  <div style="${baseStyles}">
    <div style="${cardStyles}">
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="font-size: 22px; margin: 0; color: #f8fafc;">Password Reset Request</h2>
      </div>

      <p style="color: #94a3b8; font-size: 16px; line-height: 1.6;">
        You are receiving this email because you (or someone else) requested a password reset for your account.
      </p>

      <div style="text-align: center; margin-top: 24px; margin-bottom: 24px;">
        <a href="${resetUrl}" style="${buttonStyles}">
          Reset Password
        </a>
      </div>
      
      <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
        If you did not request this, please ignore this email and your password will remain unchanged.
      </p>
    </div>

    <p style="text-align: center; color: #475569; font-size: 12px; padding: 16px;">
      © 2026 Digital Udhaar Katha. All rights reserved.
    </p>
  </div>
  `;

  return html;
};

/**
 * Email sent as a payment reminder from the owner
 */
export const paymentReminderEmail = ({ customerName, ownerName, payableAmount, loginUrl }) => {
  const html = `
  <div style="${baseStyles}">
    <div style="${cardStyles}">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="font-size: 28px; margin: 0; color: #f8fafc;">
          🔔 <span style="background: linear-gradient(135deg, #f59e0b, #ef4444); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Payment Reminder</span>
        </h1>
      </div>

      <p style="color: #94a3b8; font-size: 16px; line-height: 1.6;">
        Hello <strong style="color: #f8fafc;">${customerName}</strong>,
      </p>
      <p style="color: #94a3b8; font-size: 16px; line-height: 1.6;">
        This is a friendly reminder from <strong style="color: #f8fafc;">${ownerName}</strong> regarding your outstanding balance.
      </p>

      <div style="${highlightBox('#ef4444')}">
        <p style="margin: 0 0 4px 0; font-size: 14px; color: #94a3b8;">Amount Due</p>
        <p style="margin: 0; font-size: 36px; font-weight: 800; color: #ef4444;">₹${Number(payableAmount).toLocaleString('en-IN')}</p>
      </div>

      <div style="text-align: center; margin-top: 24px;">
        <a href="${loginUrl}" style="${buttonStyles}">
          Login & Pay Now →
        </a>
      </div>

      <p style="color: #64748b; font-size: 12px; margin-top: 24px; text-align: center;">
        Please settle your dues at your earliest convenience. If you have already paid, please disregard this email.
      </p>
    </div>

    <p style="text-align: center; color: #475569; font-size: 12px; padding: 16px;">
      © 2026 Digital Udhaar Katha. All rights reserved.
    </p>
  </div>
  `;

  return html;
};

/**
 * Email sent when an EXISTING customer is linked to a new owner's ledger.
 * Does NOT include credentials — only notifies about being added by a new shop.
 */
export const customerLinkedEmail = ({ customerName, ownerName, payableAmount, loginUrl }) => {
  const html = `
  <div style="${baseStyles}">
    <div style="${cardStyles}">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="font-size: 28px; margin: 0; color: #f8fafc;">
          🏪 <span style="background: linear-gradient(135deg, #6366f1, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">New Shop Added</span>
        </h1>
      </div>

      <p style="color: #94a3b8; font-size: 16px; line-height: 1.6;">
        Hello <strong style="color: #f8fafc;">${customerName}</strong>,
      </p>
      <p style="color: #94a3b8; font-size: 16px; line-height: 1.6;">
        <strong style="color: #f8fafc;">${ownerName}</strong> has added you to their ledger on Digital Udhaar Katha.
      </p>

      <div style="${highlightBox('#ef4444')}">
        <p style="margin: 0 0 4px 0; font-size: 14px; color: #94a3b8;">Outstanding Balance with ${ownerName}</p>
        <p style="margin: 0; font-size: 32px; font-weight: 800; color: #ef4444;">₹${Number(payableAmount).toLocaleString('en-IN')}</p>
      </div>

      <div style="background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 12px; padding: 16px; margin-top: 16px;">
        <p style="margin: 0; color: #94a3b8; font-size: 14px;">
          You can use your existing login credentials to view and manage this new account.
        </p>
      </div>

      <div style="text-align: center; margin-top: 24px;">
        <a href="${loginUrl}" style="${buttonStyles}">
          View Details & Pay →
        </a>
      </div>

      <p style="color: #64748b; font-size: 12px; margin-top: 24px; text-align: center;">
        If you did not expect this, please contact ${ownerName} directly.
      </p>
    </div>

    <p style="text-align: center; color: #475569; font-size: 12px; padding: 16px;">
      © 2026 Digital Udhaar Katha. All rights reserved.
    </p>
  </div>
  `;

  return html;
};
