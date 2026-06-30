from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from src.database.db import (
    get_teacher_subjects, create_subject, get_student_subjects,
    delete_subject, enroll_student_to_subject, unenroll_student_to_subject,
    get_subject_students
)

router = APIRouter()

class CreateSubjectRequest(BaseModel):
    subject_code: str
    name: str
    section: str
    teacher_id: int

class EnrollRequest(BaseModel):
    student_id: int
    subject_id: int

@router.get("/teacher/{teacher_id}")
def get_subjects_for_teacher(teacher_id: int):
    subjects = get_teacher_subjects(teacher_id)
    return {"subjects": subjects}

@router.get("/student/{student_id}")
def get_subjects_for_student(student_id: int):
    subjects = get_student_subjects(student_id)
    return {"subjects": subjects}

@router.post("/")
def add_subject(req: CreateSubjectRequest):
    result = create_subject(req.subject_code, req.name, req.section, req.teacher_id)
    if not result:
        raise HTTPException(status_code=400, detail="Could not create subject")
    return {"message": "Subject created successfully", "subject": result[0]}

@router.delete("/{subject_id}")
def remove_subject(subject_id: int):
    delete_subject(subject_id)
    return {"message": "Subject deleted successfully"}

@router.get("/code/{subject_code}")
def get_subject_by_code(subject_code: str):
    from src.database.config import supabase
    res = supabase.table('subjects').select('subject_id, name').eq('subject_code', subject_code).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Subject not found")
    return res.data[0]

@router.post("/enroll")
def enroll_student(req: EnrollRequest):
    result = enroll_student_to_subject(req.student_id, req.subject_id)
    return {"message": "Enrolled successfully", "data": result}

@router.post("/unenroll")
def unenroll_student(req: EnrollRequest):
    unenroll_student_to_subject(req.student_id, req.subject_id)
    return {"message": "Unenrolled successfully"}

@router.get("/students/{subject_id}")
def get_students(subject_id: int):
    students = get_subject_students(subject_id)
    return {"students": students}

@router.get("/{subject_id}/students")
def get_students_by_subject(subject_id: int):
    """Alias used by the live attendance page."""
    relations = get_subject_students(subject_id)
    flattened = []
    for r in relations:
        student = r.get("students")
        if student:
            flattened.append({
                "student_id": student.get("student_id"),
                "name": student.get("name"),
                "email": student.get("email"),
                "phone": student.get("phone"),
                "voice_embedding": bool(student.get("voice_embedding")),
                "face_embedding": bool(student.get("face_embedding"))
            })
    return {"students": flattened}

