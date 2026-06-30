from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional, List
from src.database.db import update_teacher, update_student, get_all_students
from src.pipelines.face_pipeline import get_face_embeddings
import numpy as np
import io
from PIL import Image

router = APIRouter()


class TeacherProfileUpdate(BaseModel):
    teacher_id: int
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = None


@router.put("/teacher/{teacher_id}")
def update_teacher_profile(teacher_id: int, req: TeacherProfileUpdate):
    if req.teacher_id != teacher_id:
        raise HTTPException(status_code=400, detail="Teacher ID mismatch")
    result = update_teacher(
        teacher_id=teacher_id,
        name=req.name,
        email=req.email,
        phone=req.phone,
        password=req.password if req.password else None
    )
    if not result:
        raise HTTPException(status_code=404, detail="Teacher not found or update failed")
    updated = result[0]
    updated.pop("password", None)
    return {"message": "Profile updated successfully", "user": updated}


@router.put("/student/{student_id}")
async def update_student_profile(
    student_id: int,
    name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(...),
    images: Optional[List[UploadFile]] = File(None),
    audio: Optional[UploadFile] = File(None),
):
    from src.pipelines.voice_pipeline import get_voice_embedding

    face_emb = None
    if images and len(images) > 0 and images[0].filename != "":
        all_encodings = []
        for img_file in images:
            contents = await img_file.read()
            if not contents:
                continue
            img = Image.open(io.BytesIO(contents)).convert("RGB")
            img_np = np.array(img)
            encodings = get_face_embeddings(img_np)
            if encodings:
                all_encodings.append(encodings[0])
        
        if not all_encodings:
            raise HTTPException(status_code=400, detail="Could not detect a face in any of the uploaded images")
        
        # Average the embeddings for better accuracy
        avg_encoding = np.mean(all_encodings, axis=0)
        face_emb = avg_encoding.tolist() if hasattr(avg_encoding, 'tolist') else list(avg_encoding)

    voice_emb = None
    if audio:
        audio_contents = await audio.read()
        try:
            voice_emb_np = get_voice_embedding(audio_contents)
            if voice_emb_np is not None:
                voice_emb = voice_emb_np.tolist() if hasattr(voice_emb_np, 'tolist') else list(voice_emb_np)
        except Exception as e:
            print("Audio error:", e)

    all_students = get_all_students()
    student = next((s for s in all_students if s["student_id"] == student_id), None)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    result = update_student(
        student_id=student_id,
        name=name,
        email=email,
        phone=phone,
        face_embedding=face_emb,
        voice_embedding=voice_emb,
    )
    if not result:
        raise HTTPException(status_code=400, detail="Update failed")

    # Clear face classifier cache to retrain with new data
    from src.pipelines.face_pipeline import train_classifier
    train_classifier()

    updated = result[0]
    return {"message": "Profile updated successfully", "user": updated}


@router.post("/student/{student_id}/test-voice")
async def test_voice(student_id: int, audio: UploadFile = File(...)):
    """Test a voice sample against the stored embedding for this student."""
    from src.pipelines.voice_pipeline import get_voice_embedding, compare_voice_embeddings

    all_students = get_all_students()
    student = next((s for s in all_students if s["student_id"] == student_id), None)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    stored_emb = student.get("voice_embedding")
    if not stored_emb:
        raise HTTPException(status_code=400, detail="No voice embedding stored for this student. Please save a voice sample first.")

    audio_contents = await audio.read()
    try:
        new_emb_np = get_voice_embedding(audio_contents)
        if new_emb_np is None:
            raise HTTPException(status_code=400, detail="Could not extract voice features from the audio")

        stored_np = np.array(stored_emb)
        match = compare_voice_embeddings(new_emb_np, stored_np)
        return {"match": match, "message": "Voice matched!" if match else "Voice did not match."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Voice test error: {str(e)}")
