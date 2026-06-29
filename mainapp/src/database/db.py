from src.database.config import supabase
import bcrypt



def hash_pass(pwd):
    return bcrypt.hashpw(pwd.encode(), bcrypt.gensalt()).decode()

def check_pass(pwd, hashed):
    return bcrypt.checkpw(pwd.encode(), hashed.encode())


def check_teacher_exists(username):
    # Check for unique username, returns false when username is already taken
    response = supabase.table("teachers").select("username").eq("username", username).execute()
    return len(response.data) > 0 



def create_teacher(username, password, name, email, phone):

    data = { "username" : username, "password": hash_pass(password), "name": name, "email": email, "phone": phone}
    response = supabase.table("teachers").insert(data).execute()
    return response.data


def teacher_login(username, password):
    # Support login with either username or email
    response = supabase.table("teachers").select("*").or_(f"username.eq.{username},email.eq.{username}").execute()
    if response.data:
        teacher = response.data[0]
        if check_pass(password, teacher['password']):
            return teacher
    return None


def update_teacher(teacher_id, name, email=None, phone=None, password=None):
    data = {"name": name}
    if email is not None:
        data["email"] = email
    if phone is not None:
        data["phone"] = phone
    if password:
        data["password"] = hash_pass(password)
    response = supabase.table("teachers").update(data).eq("teacher_id", teacher_id).execute()
    return response.data


def get_all_students():
    response = supabase.table('students').select("*").execute()
    return response.data

def create_student(new_name, email, phone, face_embedding=None, voice_embedding=None):
    data = {'name': new_name, 'email': email, 'phone': phone, 'face_embedding':face_embedding, "voice_embedding": voice_embedding}
    response = supabase.table('students').insert(data).execute()
    return response.data

def update_student(student_id, name, email=None, phone=None, face_embedding=None, voice_embedding=None):
    data = {"name": name}
    if email is not None:
        data["email"] = email
    if phone is not None:
        data["phone"] = phone
    if face_embedding is not None:
        data["face_embedding"] = face_embedding
    if voice_embedding is not None:
        data["voice_embedding"] = voice_embedding
    response = supabase.table("students").update(data).eq("student_id", student_id).execute()
    return response.data


def create_subject(subject_code, name, section, teacher_id):
    data = {"subject_code": subject_code, "name": name, "section": section, "teacher_id": teacher_id}
    response = supabase.table("subjects").insert(data).execute()
    return response.data

def delete_subject(subject_id):
    response = supabase.table("subjects").delete().eq("subject_id", subject_id).execute()
    return response.data

def delete_student(student_id):
    response = supabase.table("students").delete().eq("student_id", student_id).execute()
    return response.data

def get_teacher_subjects(teacher_id):
    response = supabase.table('subjects').select("*, subject_students(count), attendance_logs(timestamp)").eq("teacher_id", teacher_id).execute()
    subjects = response.data


    for sub in subjects:
        sub['total_students'] = sub.get("subject_students", [{}])[0].get('count', 0) if sub.get('subject_students') else 0
        attendance = sub.get('attendance_logs', [])
        unique_sessions = len(set(log['timestamp'] for log in attendance))
        sub['total_classes'] = unique_sessions


        sub.pop('subject_student', None)
        sub.pop('attendance_logs', None)

    return subjects


def  enroll_student_to_subject(student_id, subject_id):
    data = {'student_id': student_id, "subject_id": subject_id}
    response= supabase.table('subject_students').insert(data).execute()
    return response.data


def  unenroll_student_to_subject(student_id, subject_id):
    response= supabase.table('subject_students').delete().eq('student_id', student_id).eq('subject_id', subject_id).execute()
    return response.data



def get_student_subjects(student_id):
    response = supabase.table('subject_students').select('*, subjects(*)').eq('student_id', student_id).execute()
    return response.data

def get_subject_students(subject_id):
    response = supabase.table('subject_students').select('*, students(*)').eq('subject_id', subject_id).execute()
    return response.data



def get_student_attendance(student_id):
    response = supabase.table('attendance_logs').select('*, subjects(*)').eq('student_id', student_id).execute()
    return response.data


def create_attendance(logs):
    response = supabase.table('attendance_logs').insert(logs).execute()
    return response.data

def get_attendance_for_teacher(teacher_id):
    response = supabase.table('attendance_logs').select("*, subjects!inner(*), students(*)").eq('subjects.teacher_id', teacher_id).execute()
    return response.data


def delete_attendance_session(subject_id, ts_group):
    # ts_group is the exact timestamp string returned from Postgres (e.g. '2026-06-21T02:38:13+00:00')
    # Because all attendance records for a single session are generated at the exact same moment
    # and inserted with the exact same timestamp string, we can safely use strict equality.
    response = supabase.table('attendance_logs').delete().eq('subject_id', subject_id).eq('timestamp', ts_group).execute()
    return response.data

