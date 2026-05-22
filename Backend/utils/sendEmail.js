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
    
    // Provide a highly helpful diagnostic tip in the logs if it timed out on Render
    if (error.code === 'ETIMEDOUT' && smtpHost.includes('gmail.com')) {
      console.error(
        '[Email Help] DIAGNOSTIC TIP: Standard SMTP port 587/465 is blocked by Render\'s free tier firewall. ' +
        'To fix this, please register a free account on Brevo or SendGrid, set SMTP_PORT=2525, SMTP_HOST=smtp-relay.brevo.com (or smtp.sendgrid.net), ' +
        'and set your Brevo/SendGrid credentials. Alternatively, set RESEND_API_KEY or BREVO_API_KEY to use HTTP API sending on port 443!'
      );
    }
    throw error;
  }
};

export default sendEmail;
