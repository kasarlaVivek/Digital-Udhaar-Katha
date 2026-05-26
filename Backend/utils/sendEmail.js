import nodemailer from 'nodemailer';
import dns from 'dns';

// Force IPv4 DNS resolution globally
dns.setDefaultResultOrder('ipv4first');

const sendEmail = async (options) => {
  const fromName = process.env.FROM_NAME || 'Digital Udhaar Katha';
  const fromEmail = process.env.FROM_EMAIL || 'bruvgang321@gmail.com';

  // 1. Check for Resend HTTP API (Port 443 - Never blocked on Render)
  if (process.env.RESEND_API_KEY) {
    console.log('[Email] Using Resend HTTP API...');
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${fromName} <${fromEmail}>`,
          to: [options.email],
          subject: options.subject,
          html: options.html || options.message,
          text: options.message,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        console.error('[Email Diagnostic] Resend HTTP API returned error:', JSON.stringify(data, null, 2));
        if (data.message && data.message.toLowerCase().includes('sender')) {
          console.error(
            `[Email Diagnostic Help] SENDER NOT VERIFIED: The sender address "${fromEmail}" is not verified in your Resend account. ` +
            `By default, Resend only allows sending from onboarding@resend.dev unless you verify your custom domain. ` +
            `Please update FROM_EMAIL in your Render dashboard environment variables to a verified email or domain, or use onboarding@resend.dev.`
          );
        }
        throw new Error(data.message || `Resend API returned status ${response.status}`);
      }

      console.log('[Email] ✓ Sent successfully via Resend HTTP API. ID:', data.id);
      return data;
    } catch (error) {
      console.error('[Email] ✗ Resend HTTP API failed:', error.message);
      console.log('[Email] Falling back to other transports...');
    }
  }

  // 2. Check for Brevo HTTP API (Port 443 - Never blocked on Render)
  if (process.env.BREVO_API_KEY) {
    console.log('[Email] Using Brevo HTTP API...');
    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': process.env.BREVO_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: fromName, email: fromEmail },
          to: [{ email: options.email }],
          subject: options.subject,
          htmlContent: options.html || options.message,
          textContent: options.message,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        console.error('[Email Diagnostic] Brevo HTTP API returned error:', JSON.stringify(data, null, 2));
        if (data.message && (data.message.toLowerCase().includes('sender') || data.message.toLowerCase().includes('unauthorized') || data.message.toLowerCase().includes('permission'))) {
          console.error(
            `[Email Diagnostic Help] SENDER NOT VERIFIED: The sender address "${fromEmail}" is likely not verified in your Brevo account. ` +
            `Brevo strictly requires that the sender email address matches a verified sender in your Brevo Dashboard (Senders & Domains). ` +
            `Please check your Brevo dashboard under 'Senders & Domains', verify "${fromEmail}", or set FROM_EMAIL in your Render environment variables to your verified Brevo email.`
          );
        }
        throw new Error(data.message || `Brevo API returned status ${response.status}`);
      }

      console.log('[Email] ✓ Sent successfully via Brevo HTTP API. ID:', data.messageId);
      return data;
    } catch (error) {
      console.error('[Email] ✗ Brevo HTTP API failed:', error.message);
      console.log('[Email] Falling back to SMTP transport...');
    }
  }

  // 3. Fallback to standard SMTP (Supports Port 2525 to bypass Render free tier port blocks)
  const smtpPort = parseInt(process.env.SMTP_PORT, 10) || 587;
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';

  console.log(`[Email] Configuring SMTP Transport - Host: ${smtpHost}, Port: ${smtpPort}`);
  
  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465, // true for 465, false for other ports (like 587 or 2525)
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
    connectionUrl: undefined,
    tls: {
      rejectUnauthorized: false,
      minVersion: 'TLSv1.2'
    },
    greetingTimeout: 10000,
    socketTimeout: 10000,
    connectionTimeout: 10000,
    family: 4
  });

  const message = {
    from: `${fromName} <${fromEmail}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html || undefined,
  };

  try {
    console.log(`[Email] Credentials check - User: ${process.env.SMTP_EMAIL ? '✓' : '✗'}`);
    console.log(`[Email] Attempting to send to: ${options.email} via SMTP...`);
    const info = await transporter.sendMail(message);
    console.log('[Email] ✓ Message sent successfully via SMTP:', info.messageId);
    return info;
  } catch (error) {
    console.error('[Email] ✗ SMTP Transport Failed:', error.code || error.message);
    console.error('[Email] Full SMTP error details:', error);
    
    // Provide an extremely helpful diagnostic tip in the logs if it timed out or refused connection on Render
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED' || error.message.toLowerCase().includes('timeout')) {
      console.error(
        `[Email Help] DIAGNOSTIC TIP: Standard SMTP port ${smtpPort} connection to ${smtpHost} failed. ` +
        `Render's free tier firewall blocks outbound SMTP connections on ports 25, 465, and 587 by default. ` +
        `To resolve this email issue, please do ONE of the following in your Render Dashboard Environment Variables:\n\n` +
        `👉 OPTION A (Recommended - HTTP API):\n` +
        `   1. Set BREVO_API_KEY = your active Brevo API key (starts with 'xkeysib-...').\n` +
        `   2. Set FROM_EMAIL = the exact email address you verified as a sender in Brevo.\n\n` +
        `👉 OPTION B (SMTP on port 2525):\n` +
        `   1. Set SMTP_HOST = smtp-relay.brevo.com\n` +
        `   2. Set SMTP_PORT = 2525 (this port is NOT blocked by Render!)\n` +
        `   3. Set SMTP_EMAIL = your Brevo login email.\n` +
        `   4. Set SMTP_PASSWORD = your Brevo SMTP key.\n` +
        `   5. Set FROM_EMAIL = your verified Brevo sender email.`
      );
    }
    throw error;
  }
};

export default sendEmail;
