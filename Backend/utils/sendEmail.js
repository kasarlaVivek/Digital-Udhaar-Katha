import nodemailer from 'nodemailer';
import dns from 'dns';

// Force IPv4 DNS resolution globally
dns.setDefaultResultOrder('ipv4first');

const sendEmail = async (options) => {
  const smtpPort = parseInt(process.env.SMTP_PORT, 10) || 587;
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: smtpPort,
    secure: smtpPort === 465, // true for 465, false for other ports
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
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html || undefined,
  };

  try {
    console.log(`[Email] Credentials check - User: ${process.env.SMTP_EMAIL ? '✓' : '✗'}, Host: ${process.env.SMTP_HOST || 'smtp.gmail.com'}`);
    console.log(`[Email] Attempting to send to: ${options.email}...`);
    const info = await transporter.sendMail(message);
    console.log('[Email] ✓ Message sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('[Email] ✗ Failed:', error.code || error.message);
    console.error('[Email] Full error:', error);
    throw error;
  }
};

export default sendEmail;
