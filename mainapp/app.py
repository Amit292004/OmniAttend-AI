
import streamlit as st

from src.screens.home_screen import home_screen
from src.screens.teacher_screen import teacher_screen
from src.screens.student_screen import student_screen

from src.components.dialog_auto_enroll import auto_enroll_dialog

def main():
    st.set_page_config(
        page_title='OmniAttend AI - Making Attendance faster using AI',
        page_icon= "logonew.png"
    )
    st.logo("logonew.png")
    
    # ---------------------------------------------------------
    # GLOBAL STARTUP THEME & CSS INJECTION
    # ---------------------------------------------------------
    st.markdown("""
        <style>
        /* Hide main menu and footer for native app feel */
        #MainMenu {visibility: hidden;}
        footer {visibility: hidden;}
        header {visibility: hidden;}
        
        /* Modern Button Styling */
        div.stButton > button {
            border-radius: 999px;
            font-weight: 600;
            transition: all 0.2s ease-in-out;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        div.stButton > button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        }
        
        /* Modern Primary Button Glow */
        div.stButton > button[kind="primary"] {
            background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
            border: none;
            color: white;
        }
        
        /* Smooth inputs */
        div.stTextInput > div > div > input {
            border-radius: 12px;
            border: 1px solid #334155;
        }
        div.stTextInput > div > div > input:focus {
            box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.5);
            border-color: #6366f1;
        }
        
        /* Containers */
        div[data-testid="stVerticalBlockBorderWrapper"] {
            border-radius: 16px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
            background-color: #1e293b;
            border: 1px solid #334155;
            transition: transform 0.2s ease-in-out;
        }
        div[data-testid="stVerticalBlockBorderWrapper"]:hover {
            transform: translateY(-2px);
        }
        
        /* Download Buttons in Columns */
        div[data-testid="stDownloadButton"] > button {
            border-radius: 999px;
            font-weight: 600;
        }
        
        /* Typography */
        h1, h2, h3, h4, h5, h6 {
            font-weight: 700 !important;
            letter-spacing: -0.02em !important;
        }
        </style>
    """, unsafe_allow_html=True)
    
    if 'login_type' not in st.session_state:
        st.session_state['login_type'] = None

    match st.session_state['login_type']:
        case 'teacher':
            teacher_screen()

        case 'student':
            student_screen()
        
        case None:
            home_screen()


    join_code = st.query_params.get('join-code')
    if join_code:
        if st.session_state.login_type != 'student':
            st.session_state.login_type = 'student'
            st.rerun()
        if st.session_state.get('is_logged_in') and st.session_state.get('user_role') == 'student':
            auto_enroll_dialog(join_code)
main()