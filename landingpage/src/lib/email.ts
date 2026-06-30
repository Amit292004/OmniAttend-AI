import nodemailer from 'nodemailer';

export async function sendOTP(email: string, otp: string) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"OmniAttend AI" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your Login OTP - OmniAttend AI',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #4f46e5;">OmniAttend AI</h2>
        <p>Your one-time password for login is:</p>
        <h1 style="font-size: 36px; letter-spacing: 4px; background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px;">${otp}</h1>
        <p style="color: #6b7280; font-size: 14px;">This code is valid for 10 minutes. If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}
