import dotenv from 'dotenv';
import sendEmail from './utils/sendEmail.js';

dotenv.config();

async function testEmail() {
  console.log('Testing SMTP connection with credentials:');
  console.log('SMTP_HOST:', process.env.SMTP_HOST);
  console.log('SMTP_PORT:', process.env.SMTP_PORT);
  console.log('SMTP_EMAIL:', process.env.SMTP_EMAIL);
  console.log('SMTP_PASSWORD:', process.env.SMTP_PASSWORD ? '******' : 'MISSING');

  try {
    const result = await sendEmail({
      email: process.env.SMTP_EMAIL || 'laughtale124@gmail.com',
      subject: 'Digital Udhaar Katha - SMTP Diagnostic Test',
      message: 'This is a test email sent to verify active email notifications.',
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #6366f1; border-bottom: 2px solid #f3f4f6; padding-bottom: 10px; margin-top: 0;">📬 Email Notifications Verified!</h2>
          <p>This is a real-time diagnostic test email triggered from your local <strong>Digital Udhaar Katha</strong> developer instance.</p>
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #6366f1;">
            <p style="margin: 0; font-size: 0.95rem; color: #4b5563;"><strong>SMTP Relay:</strong> ${process.env.SMTP_HOST || 'smtp.gmail.com'}</p>
            <p style="margin: 5px 0 0 0; font-size: 0.95rem; color: #4b5563;"><strong>Sender Account:</strong> ${process.env.SMTP_EMAIL}</p>
          </div>
          <p style="font-size: 0.9rem; color: #9ca3af; margin-bottom: 0;">Connection timestamp: ${new Date().toISOString()}</p>
        </div>
      `
    });
    console.log('\n✅ SMTP TEST SUCCESSFUL!');
    console.log('Message ID:', result.messageId);
    process.exit(0);
  } catch (error) {
    console.error('\n❌ SMTP TEST FAILED!');
    console.error('Error Details:', error);
    process.exit(1);
  }
}

testEmail();
