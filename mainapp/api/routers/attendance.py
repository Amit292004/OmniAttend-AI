from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import List
from src.database.db import get_attendance_for_teacher, create_attendance, get_all_students
from src.pipelines.face_pipeline import predict_attendance
from src.pipelines.voice_pipeline import process_bulk_audio
import numpy as np
import io
from PIL import Image
from datetime import datetime
import json

router = APIRouter()

@router.get("/teacher/{teacher_id}")
def get_teacher_analytics(teacher_id: int):
    logs = get_attendance_for_teacher(teacher_id)
    return {"logs": logs}

@router.get("/student/{student_id}")
def get_student_attendance_logs(student_id: int):
    from src.database.db import get_student_attendance
    logs = get_student_attendance(student_id)
    return {"logs": logs}

@router.post("/face")
async def process_face_attendance(
    subject_id: int = Form(...),
    image: UploadFile = File(...)
):
    contents = await image.read()
    img = Image.open(io.BytesIO(contents)).convert('RGB')
    img_np = np.array(img)

    detected, all_ids, num_faces = predict_attendance(img_np)
    
    if num_faces == 0:
        raise HTTPException(status_code=400, detail="No faces detected")
    
    current_time = datetime.utcnow().isoformat()
    logs = []
    
    # In a real app we'd verify the students are enrolled in this subject.
    for student_id in detected.keys():
        logs.append({
            "student_id": student_id,
            "subject_id": subject_id,
            "timestamp": current_time,
            "is_present": True
        })
        
    if logs:
        create_attendance(logs)
        
    return {
        "message": "Face attendance processed",
        "detected_count": len(detected),
        "total_faces": num_faces,
        "logs": logs
    }

@router.post("/voice")
async def process_voice_attendance(
    subject_id: int = Form(...),
    audio: UploadFile = File(...)
):
    contents = await audio.read()
    
    # Query enrolled students for this subject
    from src.database.config import supabase
    enrolled_res = supabase.table('subject_students').select("*, students(*)").eq('subject_id', subject_id).execute()
    enrolled_students = enrolled_res.data
    
    if not enrolled_students:
        raise HTTPException(status_code=400, detail="No students enrolled in this course")
        
    candidates_dict = {
        s['students']['student_id']: np.array(s['students']['voice_embedding'])
        for s in enrolled_students if s['students'].get('voice_embedding')
    }
    
    identified_results = {}
    if candidates_dict:
        identified_results = process_bulk_audio(contents, candidates_dict)
        
    current_time = datetime.utcnow().isoformat()
    logs = []
    
    for node in enrolled_students:
        student = node['students']
        score = identified_results.get(student['student_id'], 0.0)
        is_present = bool(score > 0)
        
        logs.append({
            "student_id": student['student_id'],
            "subject_id": subject_id,
            "timestamp": current_time,
            "is_present": is_present
        })
        
    if logs:
        create_attendance(logs)
        
    return {
        "message": "Voice attendance processed",
        "detected_count": sum(1 for l in logs if l["is_present"]),
        "logs": logs
    }


@router.delete("/session")
def remove_attendance_session(subject_id: int, timestamp: str):
    from src.database.db import delete_attendance_session
    delete_attendance_session(subject_id, timestamp)
    return {"message": "Attendance session deleted successfully"}

@router.post("/face/bulk")
async def process_bulk_face_attendance(
    subject_id: int = Form(...),
    images: List[UploadFile] = File(...)
):
    all_detected_ids = {}
    for idx, image in enumerate(images):
        contents = await image.read()
        img = Image.open(io.BytesIO(contents)).convert('RGB')
        img_np = np.array(img)
        detected, _, _ = predict_attendance(img_np)
        if detected:
            for sid in detected.keys():
                student_id = int(sid)
                all_detected_ids.setdefault(student_id, []).append(f"Photo {idx+1}")
                
    # Now query enrolled students
    from src.database.config import supabase
    enrolled_res = supabase.table('subject_students').select("*, students(*)").eq('subject_id', subject_id).execute()
    enrolled_students = enrolled_res.data
    
    current_time = datetime.utcnow().isoformat()
    logs = []
    results = []
    
    for node in enrolled_students:
        student = node['students']
        sources = all_detected_ids.get(int(student['student_id']), [])
        is_present = len(sources) > 0
        
        results.append({
            "name": student['name'],
            "student_id": student['student_id'],
            "source": ", ".join(sources) if is_present else "-",
            "is_present": is_present
        })
        
        logs.append({
            "student_id": student['student_id'],
            "subject_id": subject_id,
            "timestamp": current_time,
            "is_present": is_present
        })
        
    if logs:
        create_attendance(logs)
        
    return {
        "message": "Bulk face attendance processed",
        "results": results,
        "logs": logs
    }

from fastapi.responses import StreamingResponse
import pandas as pd

@router.get("/export")
def export_attendance(
    teacher_id: int,
    subject_code: str,
    start_date: str,
    end_date: str
):
    logs = get_attendance_for_teacher(teacher_id)
    if not logs:
        raise HTTPException(status_code=404, detail="No attendance records found")
        
    data = []
    for r in logs:
        ts = r.get('timestamp')
        student_name = "Unknown"
        if 'students' in r and r['students']:
            student_name = r['students'].get('name', 'Unknown')
            
        data.append({
            "ts_group": ts.split(".")[0] if ts else None,
            "Time": datetime.fromisoformat(ts).strftime(" %Y-%m-%d %I:%M %p") if ts else "N/A",
            "Subject": r['subjects']['name'],
            "Subject Code": r['subjects']['subject_code'],
            "is_present": bool(r.get('is_present', False)),
            "Student": student_name,
            "subject_id": r.get('subject_id')
        })
        
    df = pd.DataFrame(data)
    df['Date'] = pd.to_datetime(df['ts_group']).dt.date
    
    try:
        s_date = datetime.strptime(start_date, "%Y-%m-%d").date()
        e_date = datetime.strptime(end_date, "%Y-%m-%d").date()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid date format, use YYYY-MM-DD")
        
    mask = (df['Date'] >= s_date) & (df['Date'] <= e_date) & (df['Subject Code'] == subject_code)
    report_df = df[mask].copy()
    
    if report_df.empty:
        raise HTTPException(status_code=404, detail="No records found for the selected criteria.")
        
    export_df = report_df[['Date', 'Subject', 'Subject Code', 'Student', 'ts_group']].copy()
    export_df['Date'] = export_df['Date'].astype(str)
    export_df['TimeOnly'] = pd.to_datetime(export_df['ts_group']).dt.strftime('%H:%M')
    export_df['Status'] = report_df['is_present'].apply(lambda x: 'P' if x else 'A')
    
    export_df['Session_Label'] = export_df.apply(lambda row: f"{row['Date']} ({row['TimeOnly']})", axis=1)
    
    is_single_subject = report_df['Subject Code'].nunique() == 1
    pivot_index = ['Student'] if is_single_subject else ['Subject Code', 'Student']
    
    pivot_df = export_df.pivot_table(
        index=pivot_index,
        columns='Session_Label',
        values='Status',
        aggfunc='first',
        fill_value='-'
    ).reset_index()
    
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
        workbook = writer.book
        worksheet = workbook.add_worksheet('Register')
        writer.sheets['Register'] = worksheet
        
        # Define formats to match requested Excel template exactly
        title_format = workbook.add_format({
            'bold': True,
            'align': 'center',
            'valign': 'vcenter',
            'font_size': 14,
            'bg_color': '#D9E1F2',
            'border': 1,
            'border_color': '#8FAADC'
        })
        
        header_format = workbook.add_format({
            'bold': True,
            'align': 'center',
            'valign': 'vcenter',
            'font_size': 11,
            'bg_color': '#305496',
            'font_color': 'white',
            'border': 1,
            'border_color': '#8FAADC'
        })
        
        student_header_format = workbook.add_format({
            'bold': True,
            'align': 'left',
            'valign': 'vcenter',
            'font_size': 11,
            'bg_color': '#305496',
            'font_color': 'white',
            'border': 1,
            'border_color': '#8FAADC'
        })
        
        student_cell_format = workbook.add_format({
            'align': 'left',
            'valign': 'vcenter',
            'border': 1,
            'border_color': '#D9D9D9'
        })
        
        present_format = workbook.add_format({
            'font_color': '#006100',
            'bold': True,
            'align': 'center',
            'valign': 'vcenter',
            'border': 1,
            'border_color': '#D9D9D9'
        })
        
        absent_format = workbook.add_format({
            'font_color': '#9C0006',
            'bold': True,
            'align': 'center',
            'valign': 'vcenter',
            'border': 1,
            'border_color': '#D9D9D9'
        })
        
        dash_format = workbook.add_format({
            'font_color': '#7F7F7F',
            'align': 'center',
            'valign': 'vcenter',
            'border': 1,
            'border_color': '#D9D9D9'
        })
        
        # Explicitly show Excel gridlines
        worksheet.hide_gridlines(0)
        
        # Build Title Banner
        if is_single_subject:
            subject_title = f"{report_df['Subject Code'].iloc[0]} ({report_df['Subject'].iloc[0]}) Attendance Register"
        else:
            subject_title = "Master Attendance Register"
            
        num_cols = len(pivot_df.columns)
        worksheet.merge_range(0, 0, 0, num_cols - 1, subject_title, title_format)
        worksheet.set_row(0, 30)
        
        # Write Headers
        worksheet.set_row(1, 24)
        for col_idx, col_name in enumerate(pivot_df.columns):
            fmt = student_header_format if col_name in pivot_index else header_format
            worksheet.write(1, col_idx, col_name, fmt)
            
        # Write Data Cells with specific format styling
        for row_idx, row in pivot_df.iterrows():
            excel_row_idx = row_idx + 2
            worksheet.set_row(excel_row_idx, 20)
            for col_idx, col_name in enumerate(pivot_df.columns):
                val = row[col_name]
                if col_name in pivot_index:
                    worksheet.write(excel_row_idx, col_idx, val, student_cell_format)
                else:
                    if val == 'P':
                        worksheet.write(excel_row_idx, col_idx, val, present_format)
                    elif val == 'A':
                        worksheet.write(excel_row_idx, col_idx, val, absent_format)
                    else:
                        worksheet.write(excel_row_idx, col_idx, val, dash_format)
                        
        # Autofit Column Widths nicely
        for col_idx, col_name in enumerate(pivot_df.columns):
            if col_name in pivot_index:
                worksheet.set_column(col_idx, col_idx, 25)
            else:
                worksheet.set_column(col_idx, col_idx, 18)
                
    output.seek(0)
    return StreamingResponse(
        output,
        media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        headers={"Content-Disposition": f"attachment; filename=Attendance_Report_{start_date}_to_{end_date}.xlsx"}
    )

@router.get("/students")
def get_all_students_endpoint():
    return {"students": get_all_students()}

