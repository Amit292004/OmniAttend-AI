import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendOTP = async (email: string, otp: string) => {
  const mailOptions = {
    from: `"OmniAttend AI" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your Verification Code - OmniAttend AI',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #fff; background-color: #1a1744; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid rgba(157, 78, 221, 0.3);">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #c77dff; margin-bottom: 5px;">Welcome to OmniAttend AI!</h2>
        </div>
        <p style="font-size: 16px; line-height: 1.6; color: #e5e7eb;">Please use the following verification code to activate your account:</p>
        <div style="background: rgba(255, 255, 255, 0.05); padding: 15px; font-size: 32px; font-weight: bold; text-align: center; border-radius: 8px; margin: 20px 0; letter-spacing: 8px; color: #00f5d4; border: 1px solid rgba(0, 245, 212, 0.2);">
          ${otp}
        </div>
        <p style="font-size: 14px; color: #9ca3af;">This code will expire in 10 minutes.</p>
        <p style="font-size: 14px; color: #9ca3af;">If you did not request this, please safely ignore this email.</p>
        <hr style="border: none; border-top: 1px solid rgba(255, 255, 255, 0.1); margin: 30px 0 20px;" />
        <div style="text-align: center;">
          <p style="font-size: 12px; color: #6b7280; margin: 0;">© ${new Date().getFullYear()} OmniAttend AI. All rights reserved.</p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};
