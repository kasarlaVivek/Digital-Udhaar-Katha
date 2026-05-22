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
    console.log(`Attempting to send email to: ${options.email}...`);
    const info = await transporter.sendMail(message);
    console.log('Message sent successfully: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Nodemailer Error:', error.message);
    throw error;
  }
};

export default sendEmail;
