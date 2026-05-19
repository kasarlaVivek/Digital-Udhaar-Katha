import dotenv from 'dotenv';
import sendEmail from '../utils/sendEmail.js';

dotenv.config({ path: './.env' });

async function diagnoseSMTP() {
  console.log('Testing SMTP connection with credentials:');
  console.log('SMTP_HOST:', process.env.SMTP_HOST);
  console.log('SMTP_PORT:', process.env.SMTP_PORT);
  console.log('SMTP_EMAIL:', process.env.SMTP_EMAIL);
  console.log('SMTP_PASSWORD:', process.env.SMTP_PASSWORD ? '******' : 'MISSING');
  console.log('FROM_EMAIL:', process.env.FROM_EMAIL);

  try {
    const result = await sendEmail({
      email: process.env.SMTP_EMAIL || 'laughtale124@gmail.com',
      subject: 'Digital Udhaar Katha - SMTP Diagnostic Test',
      message: 'This is a test email sent from the diagnostic script to verify Gmail App Password.',
      html: '<h1>Digital Udhaar Katha</h1><p>This is a test email sent from the diagnostic script to verify Gmail App Password.</p>'
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

diagnoseSMTP();
