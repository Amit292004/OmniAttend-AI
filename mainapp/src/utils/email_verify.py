import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import random
import os
from dotenv import load_dotenv

load_dotenv()

def send_otp_email(to_email, otp_code, user_name):
    # Retrieve SMTP credentials from environment variables
    smtp_server = "smtp.gmail.com"
    smtp_port = 587
    try:
        sender_email = os.environ["EMAIL_USER"]
        sender_password = os.environ["EMAIL_PASS"]
    except KeyError:
        print("EMAIL_USER or EMAIL_PASS not found in environment variables")
        return False
    
    # Create message
    message = MIMEMultipart("alternative")
    message["Subject"] = "Verify Your OmniAttend AI Account"
    message["From"] = f"OmniAttend AI <{sender_email}>"
    message["To"] = to_email
    
    # HTML Body
    html = f"""
    <html>
      <body style="font-family: Arial, sans-serif; background-color: #f4f5f7; padding: 20px; color: #333333;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); border: 1px solid #e1e8ed;">
          <h2 style="color: #6366f1; text-align: center; margin-top: 0;">OmniAttend AI Verification</h2>
          <p>Hello <strong>{user_name}</strong>,</p>
          <p>Thank you for signing up for OmniAttend AI. To complete your registration, please verify your email address using the One-Time Password (OTP) below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #4f46e5; background-color: #eef2ff; padding: 12px 24px; border-radius: 8px; border: 1px dashed #6366f1; display: inline-block;">
              {otp_code}
            </span>
          </div>
          <p style="font-size: 13px; color: #666666;">This code is valid for 10 minutes. If you did not request this, please ignore this email.</p>
          <hr style="border: 0; border-top: 1px solid #e1e8ed; margin: 20px 0;" />
          <p style="font-size: 12px; color: #999999; text-align: center;">OmniAttend AI &copy; 2026. Making attendance faster using AI.</p>
        </div>
      </body>
    </html>
    """
    
    message.attach(MIMEText(html, "html"))
    
    try:
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(sender_email, sender_password)
        server.sendmail(sender_email, to_email, message.as_string())
        server.close()
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False

def generate_otp():
    return f"{random.randint(100000, 999999)}"
