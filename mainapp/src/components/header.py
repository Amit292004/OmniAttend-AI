import streamlit as st
import os

def header_home():
    current_dir = os.path.dirname(__file__)
    logo_path = os.path.join(current_dir, "logonew.png")
    
    st.markdown('<div style="margin-top:20px; margin-bottom:20px;"></div>', unsafe_allow_html=True)
    
    if os.path.exists(logo_path):
        # Using columns to ensure it looks nicely centered but full-length if it's wide
        st.image(logo_path, width='stretch')
    else:
        st.markdown(f"""
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center;">
                <h1 style='text-align:center; text-shadow: 0 0 20px rgba(99, 102, 241, 0.3);'>OmniAttend<br/>AI</h1>
            </div>   
        """, unsafe_allow_html=True)

def header_dashboard():
    current_dir = os.path.dirname(__file__)
    logo_path = os.path.join(current_dir, "logonew.png")
    
    if os.path.exists(logo_path):
        # We make it a bit larger on the dashboard
        col1, col2, col3 = st.columns([1, 7, 1])
        with col2:
            st.image(logo_path, width='stretch')
    else:
        st.markdown(f"""
            <div style="display:flex; align-items:center; justify-content:center; gap:10px">
                <h2 style='text-align:left; text-shadow: 0 0 15px rgba(99, 102, 241, 0.3);'>OmniAttend<br/>AI</h2>
            </div>   
        """, unsafe_allow_html=True)
