import streamlit as st
from src.database.db import update_teacher, update_student, check_pass
from src.pipelines.face_pipeline import get_face_embeddings, train_classifier
from src.pipelines.voice_pipeline import get_voice_embedding
from PIL import Image
import numpy as np
import time

@st.dialog("Edit Profile")
def edit_teacher_profile_dialog():
    teacher_data = st.session_state.teacher_data
    
    st.write("Update your profile information below.")
    
    new_name = st.text_input("Full Name", value=teacher_data.get('name', ''))
    
    st.divider()
    st.write("Change Password (optional)")
    old_password = st.text_input("Current Password", type="password", placeholder="Required if changing password")
    new_password = st.text_input("New Password", type="password", placeholder="Leave blank to keep current")
    confirm_password = st.text_input("Confirm New Password", type="password", placeholder="Leave blank to keep current")
    
    if st.button("Save Changes", type="primary", width="stretch"):
        if not new_name.strip():
            st.error("Name cannot be empty.")
            return
            
        if new_password or confirm_password:
            if not old_password:
                st.error("Please enter your current password to change it.")
                return
            if not check_pass(old_password, teacher_data['password']):
                st.error("Current password is incorrect.")
                return
            if new_password != confirm_password:
                st.error("New passwords do not match!")
                return
                
        with st.spinner("Saving profile..."):
            updated_data = update_teacher(
                teacher_data['teacher_id'], 
                name=new_name, 
                password=new_password if new_password else None
            )
            
            if updated_data:
                # Update session state
                st.session_state.teacher_data.update(updated_data[0])
                st.success("Profile updated successfully!")
                time.sleep(1)
                st.rerun()
            else:
                st.error("Failed to update profile.")


@st.dialog("Edit Profile")
def edit_student_profile_dialog():
    student_data = st.session_state.student_data
    
    st.write("Update your profile information below.")
    
    new_name = st.text_input("Full Name", value=student_data.get('name', ''))
    
    st.divider()
    
    st.write("**Update Biometrics (optional)**")
    st.info("Only provide new biometrics if you want to overwrite your existing ones.")
    
    photo_source = st.camera_input("Update Face ID")
    
    audio_data = st.audio_input("Update Voice ID (Say: 'I am present, my name is...')")
    
    if st.button("Save Changes", type="primary", width="stretch"):
        if not new_name.strip():
            st.error("Name cannot be empty.")
            return
            
        with st.spinner("Saving profile..."):
            face_emb = None
            if photo_source:
                img = np.array(Image.open(photo_source))
                encodings = get_face_embeddings(img)
                if encodings:
                    face_emb = encodings[0].tolist()
                else:
                    st.error("Could not detect a face in the new photo. Profile not updated.")
                    return
            
            voice_emb = None
            if audio_data:
                voice_emb = get_voice_embedding(audio_data.read())
                
            updated_data = update_student(
                student_data['student_id'],
                name=new_name,
                face_embedding=face_emb,
                voice_embedding=voice_emb
            )
            
            if updated_data:
                if face_emb:
                    train_classifier() # Retrain face classifier since embeddings changed
                st.session_state.student_data.update(updated_data[0])
                st.success("Profile updated successfully!")
                time.sleep(1)
                st.rerun()
            else:
                st.error("Failed to update profile.")
