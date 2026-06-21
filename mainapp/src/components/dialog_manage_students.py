import streamlit as st
from src.database.db import unenroll_student_to_subject, delete_student
from src.database.config import supabase

@st.dialog("Manage Students")
def manage_students_dialog(subject_id):
    # Fetch enrolled students
    response = supabase.table('subject_students').select("*, students(*)").eq('subject_id', subject_id).execute()
    enrolled = response.data

    if not enrolled:
        st.info("No students enrolled in this subject.")
        return

    st.write("### Enrolled Students")
    
    for node in enrolled:
        student = node['students']
        # If student record was deleted but subject_student record wasn't cascading
        if not student:
            continue
            
        col1, col2, col3 = st.columns([2, 1, 1])
        with col1:
            st.write(f"**{student['name']}** (ID: {student['student_id']})")
        with col2:
            if st.button("Unenroll", key=f"unenroll_{student['student_id']}_{subject_id}", type="secondary", icon=":material/person_remove:", use_container_width=True):
                unenroll_student_to_subject(student['student_id'], subject_id)
                st.toast(f"Unenrolled {student['name']}")
                import time
                time.sleep(1)
                st.rerun()
        with col3:
            if st.button("Delete", key=f"delete_{student['student_id']}_{subject_id}", type="primary", icon=":material/delete:", use_container_width=True):
                delete_student(student['student_id'])
                st.toast(f"Deleted {student['name']} from system")
                import time
                time.sleep(1)
                st.rerun()
