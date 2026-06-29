import smtplib
import random
import time
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict
import os
from dotenv import load_dotenv

load_dotenv()

# In-memory OTP store: { email: { "otp": "123456", "expires_at": float, "name": str } }
_otp_store: Dict[str, dict] = {}

OTP_EXPIRY_SECONDS = 600  # 10 minutes


def generate_otp() -> str:
    return f"{random.randint(100000, 999999)}"


def store_otp(email: str, otp: str, name: str):
    _otp_store[email.lower()] = {
        "otp": otp,
        "expires_at": time.time() + OTP_EXPIRY_SECONDS,
        "name": name,
    }


def verify_otp(email: str, otp: str) -> bool:
    record = _otp_store.get(email.lower())
    if not record:
        return False
    if time.time() > record["expires_at"]:
        _otp_store.pop(email.lower(), None)
        return False
    if record["otp"] == otp.strip():
        _otp_store.pop(email.lower(), None)  # one-time use
        return True
    return False


def send_otp_email(to_email: str, otp_code: str, user_name: str) -> bool:
    smtp_server = "smtp.gmail.com"
    smtp_port = 587

    sender_email = os.getenv("EMAIL_USER", "")
    sender_password = os.getenv("EMAIL_PASS", "")

    if not sender_email or not sender_password or sender_email == "your_gmail@gmail.com":
        print(f"\n[DEV MODE] EMAIL_USER not configured. Your OTP for {to_email} is: {otp_code}\n")
        return True

    message = MIMEMultipart("alternative")
    message["Subject"] = "Verify Your OmniAttend AI Account"
    message["From"] = f"OmniAttend AI <{sender_email}>"
    message["To"] = to_email

    html = f"""
    <html>
      <body style="font-family: Arial, sans-serif; background-color: #0d0b1a; padding: 20px; color: #e2e8f0;">
        <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1730 0%, #12101f 100%);
                    padding: 40px; border-radius: 16px; border: 1px solid rgba(99,102,241,0.2);
                    box-shadow: 0 0 40px rgba(99,102,241,0.15);">
          <div style="text-align:center; margin-bottom: 28px;">
            <h2 style="color: #818cf8; font-size: 24px; margin: 0; letter-spacing: -0.5px;">OmniAttend AI</h2>
            <p style="color: rgba(255,255,255,0.4); font-size: 13px; margin: 4px 0 0;">Smart Attendance Platform</p>
          </div>
          <p style="color: rgba(255,255,255,0.8);">Hello <strong style="color: #c7d2fe;">{user_name}</strong>,</p>
          <p style="color: rgba(255,255,255,0.6); line-height: 1.6;">
            Thank you for registering with OmniAttend AI. Please use the One-Time Password below to verify your email address and complete your registration.
          </p>
          <div style="text-align: center; margin: 36px 0;">
            <span style="font-size: 40px; font-weight: 800; letter-spacing: 12px; color: #818cf8;
                         background: rgba(99,102,241,0.15); padding: 18px 32px; border-radius: 12px;
                         border: 1px dashed rgba(99,102,241,0.4); display: inline-block; font-family: monospace;">
              {otp_code}
            </span>
          </div>
          <p style="font-size: 13px; color: rgba(255,255,255,0.4); text-align: center;">
            This code expires in <strong>10 minutes</strong>. Do not share it with anyone.
          </p>
          <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.07); margin: 24px 0;" />
          <p style="font-size: 12px; color: rgba(255,255,255,0.25); text-align: center;">
            OmniAttend AI &copy; 2026 &mdash; Making attendance faster using AI.
          </p>
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
