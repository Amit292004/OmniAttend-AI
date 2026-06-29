from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from src.utils.otp_service import generate_otp, store_otp, verify_otp, send_otp_email

router = APIRouter()


class SendOTPRequest(BaseModel):
    email: str
    name: str


class VerifyOTPRequest(BaseModel):
    email: str
    otp: str


@router.post("/send")
def send_otp(req: SendOTPRequest):
    """Generate and send a 6-digit OTP to the provided email address."""
    otp = generate_otp()
    store_otp(req.email, otp, req.name)
    success = send_otp_email(req.email, otp, req.name)
    if not success:
        raise HTTPException(
            status_code=500,
            detail="Failed to send OTP email. Please check EMAIL_USER and EMAIL_PASS in your .env file."
        )
    return {"message": f"OTP sent to {req.email}. Valid for 10 minutes."}


@router.post("/verify")
def verify_otp_route(req: VerifyOTPRequest):
    """Verify the OTP sent to the given email. Returns 200 on success, 400 on failure."""
    if verify_otp(req.email, req.otp):
        return {"verified": True, "message": "Email verified successfully!"}
    raise HTTPException(status_code=400, detail="Invalid or expired OTP. Please try again or request a new code.")
