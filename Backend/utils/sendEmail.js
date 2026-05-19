import nodemailer from 'nodemailer';

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
    tls: {
      rejectUnauthorized: false
    }
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
