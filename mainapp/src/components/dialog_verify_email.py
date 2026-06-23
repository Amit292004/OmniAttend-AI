import streamlit as st
import time
from src.utils.email_verify import send_otp_email, generate_otp
from src.database.db import create_teacher, create_student
from src.pipelines.face_pipeline import train_classifier

@st.dialog("Verify Your Email")
def verify_email_dialog(role):
    if 'temp_reg_data' not in st.session_state or 'otp_code' not in st.session_state:
        st.error("No registration data found.")
        return
        
    reg_data = st.session_state.temp_reg_data
    email = reg_data['email']
    name = reg_data['name']
    
    st.write(f"We've sent a 6-digit verification code to **{email}**. Please enter it below to complete your registration.")
    
    otp_input = st.text_input("Enter 6-digit Code", max_chars=6, placeholder="123456")
    
    c1, c2 = st.columns(2)
    
    with c1:
        if st.button("Verify & Register", type="primary", use_container_width=True):
            if otp_input.strip() == st.session_state.otp_code:
                st.success("Email verified successfully!")
                
                with st.spinner("Creating your profile..."):
                    if role == 'teacher':
                        response_data = create_teacher(
                            username=reg_data['username'],
                            password=reg_data['password'],
                            name=reg_data['name'],
                            email=reg_data['email'],
                            phone=reg_data['phone']
                        )
                        if response_data:
                            # Log in
                            st.session_state.is_logged_in = True
                            st.session_state.user_role = 'teacher'
                            st.session_state.teacher_data = response_data[0]
                            st.toast("Profile created successfully! Welcome!")
                            
                            # Clean session state
                            del st.session_state.temp_reg_data
                            del st.session_state.otp_code
                            time.sleep(1)
                            st.rerun()
                        else:
                            st.error("Failed to create database record. Username might be taken.")
                            
                    elif role == 'student':
                        response_data = create_student(
                            new_name=reg_data['name'],
                            email=reg_data['email'],
                            phone=reg_data['phone'],
                            face_embedding=reg_data['face_embedding'],
                            voice_embedding=reg_data['voice_embedding']
                        )
                        if response_data:
                            if reg_data['face_embedding']:
                                train_classifier()
                            # Log in
                            st.session_state.is_logged_in = True
                            st.session_state.user_role = 'student'
                            st.session_state.student_data = response_data[0]
                            st.toast(f"Profile Created! Hi {reg_data['name']}!")
                            
                            # Clean session state
                            del st.session_state.temp_reg_data
                            del st.session_state.otp_code
                            time.sleep(1)
                            st.rerun()
                        else:
                            st.error("Failed to create database record.")
            else:
                st.error("Invalid verification code. Please try again.")
                
    with c2:
        if st.button("Resend Code", type="secondary", use_container_width=True):
            new_otp = generate_otp()
            st.session_state.otp_code = new_otp
            with st.spinner("Sending code..."):
                if send_otp_email(email, new_otp, name):
                    st.success("New verification code sent!")
                else:
                    st.error("Failed to send email. Please check your email configuration.")
