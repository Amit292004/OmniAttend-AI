from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional
from src.database.db import teacher_login, create_teacher, get_all_students, create_student
from src.pipelines.face_pipeline import predict_attendance, get_face_embeddings
import numpy as np
import io
from PIL import Image

router = APIRouter()

class TeacherLoginRequest(BaseModel):
    username: str
    password: str

class TeacherRegisterRequest(BaseModel):
    username: str
    password: str
    name: str
    email: str
    phone: str

@router.post("/teacher/login")
def login_teacher(req: TeacherLoginRequest):
    teacher = teacher_login(req.username, req.password)
    if not teacher:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    # In a real app, generate a JWT. Here we return the teacher object with a mock token.
    teacher.pop("password", None) # Remove hashed password
    return {"token": f"teacher_{teacher['teacher_id']}", "user": teacher}

@router.post("/teacher/register")
def register_teacher(req: TeacherRegisterRequest):
    from src.database.db import check_teacher_exists
    if check_teacher_exists(req.username):
        raise HTTPException(status_code=400, detail="Username already exists")
        
    result = create_teacher(req.username, req.password, req.name, req.email, req.phone)
    if not result:
        raise HTTPException(status_code=400, detail="Could not create teacher")
        
    teacher = result[0]
    teacher.pop("password", None)
    return {"message": "Teacher created successfully", "token": f"teacher_{teacher['teacher_id']}", "user": teacher}

@router.post("/student/login")
async def login_student_face(image: UploadFile = File(...)):
    contents = await image.read()
    img = Image.open(io.BytesIO(contents)).convert('RGB')
    img_np = np.array(img)

    detected, all_ids, num_faces = predict_attendance(img_np)
    
    if num_faces == 0:
        raise HTTPException(status_code=400, detail="Face not found")
    if num_faces > 1:
        raise HTTPException(status_code=400, detail="Multiple faces found")
    
    if detected:
        student_id = list(detected.keys())[0]
        all_students = get_all_students()
        student = next((s for s in all_students if s['student_id'] == student_id), None)
        
        if student:
            return {"token": f"student_{student['student_id']}", "user": student}
    
    raise HTTPException(status_code=401, detail="Face not recognized")

@router.post("/student/register")
async def register_student(
    name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(...),
    image: UploadFile = File(...),
    audio: Optional[UploadFile] = File(None)
):
    from src.pipelines.voice_pipeline import get_voice_embedding
    
    contents = await image.read()
    img = Image.open(io.BytesIO(contents)).convert('RGB')
    img_np = np.array(img)
    
    encodings = get_face_embeddings(img_np)
    if not encodings:
        raise HTTPException(status_code=400, detail="Could not capture facial features")
        
    face_emb = encodings[0].tolist()
    
    voice_emb = None
    if audio:
        audio_contents = await audio.read()
        try:
            voice_emb_np = get_voice_embedding(audio_contents)
            if voice_emb_np is not None:
                voice_emb = voice_emb_np.tolist()
        except Exception as e:
            print("Audio error:", e)
            
    # Check if user already exists
    all_students = get_all_students()
    if any(s.get("email") == email for s in all_students):
        raise HTTPException(status_code=400, detail="Student with this email already exists")

    result = create_student(name, email, phone, face_emb, voice_emb)
    if not result:
        raise HTTPException(status_code=400, detail="Could not create student")
        
    from src.pipelines.face_pipeline import train_classifier
    train_classifier()
        
    student = result[0]
    return {"message": "Student created successfully", "token": f"student_{student['student_id']}", "user": student}


class ProfileByEmailRequest(BaseModel):
    email: str

@router.post("/profile-by-email")
def get_profile_by_email(req: ProfileByEmailRequest):
    """
    SSO bridge endpoint: given an email from the landing-page JWT session,
    look up the matching teacher or student profile and return it with a
    synthetic token — so the portal can hydrate localStorage without
    asking the user to log in again.
    """
    from src.database.config import supabase

    # 1. Try teachers table
    teacher_res = supabase.table("teachers").select("*").eq("email", req.email).execute()
    if teacher_res.data:
        teacher = teacher_res.data[0]
        teacher.pop("password", None)
        return {
            "role": "teacher",
            "token": f"teacher_{teacher['teacher_id']}",
            "user": teacher
        }

    # 2. Try students table
    student_res = supabase.table("students").select("*").eq("email", req.email).execute()
    if student_res.data:
        student = student_res.data[0]
        return {
            "role": "student",
            "token": f"student_{student['student_id']}",
            "user": student
        }

    raise HTTPException(status_code=404, detail="No teacher or student profile found for this email")
