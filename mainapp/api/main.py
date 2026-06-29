from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routers import auth, subjects, attendance, profile, otp

app = FastAPI(title="OmniAttend AI Backend")

# Allow CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(subjects.router, prefix="/api/subjects", tags=["subjects"])
app.include_router(attendance.router, prefix="/api/attendance", tags=["attendance"])
app.include_router(profile.router, prefix="/api/profile", tags=["profile"])
app.include_router(otp.router, prefix="/api/otp", tags=["otp"])

@app.get("/api/health")
def health_check():
    return {"status": "ok"}
