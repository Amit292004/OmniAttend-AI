import streamlit as st



def style_background_home():

    st.markdown("""
        <style>

                .stApp {
                    background: linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%) !important;
                }

                .stApp div[data-testid="stVerticalBlockBorderWrapper"] {
                    background: rgba(255, 255, 255, 0.04) !important;
                    border: 1px solid rgba(255, 255, 255, 0.08) !important;
                    backdrop-filter: blur(16px) !important;
                    -webkit-backdrop-filter: blur(16px) !important;
                    padding: 2.5rem !important;
                    border-radius: 1.5rem !important;
                    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3) !important;
                    transition: transform 0.3s ease, box-shadow 0.3s ease !important;
                }
                
                .stApp div[data-testid="stVerticalBlockBorderWrapper"]:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 12px 40px 0 rgba(0, 0, 0, 0.4) !important;
                }
        </style>  

                """
            ,unsafe_allow_html=True)
    

def style_background_dashboard():

    st.markdown("""
        <style>

                .stApp {
                    background: linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%) !important;
                }
                
                .stApp div[data-testid="stVerticalBlockBorderWrapper"] {
                    background: rgba(255, 255, 255, 0.04) !important;
                    border: 1px solid rgba(255, 255, 255, 0.08) !important;
                    backdrop-filter: blur(16px) !important;
                    -webkit-backdrop-filter: blur(16px) !important;
                    padding: 1.5rem !important;
                    border-radius: 1.5rem !important;
                    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3) !important;
                    transition: transform 0.3s ease, box-shadow 0.3s ease !important;
                }
                
                .stApp div[data-testid="stVerticalBlockBorderWrapper"]:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 30px 0 rgba(0, 0, 0, 0.4) !important;
                }

        </style>  

                """
            ,unsafe_allow_html=True)
    

    

def style_base_layout():
    st.markdown("""
        <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=Outfit:wght@300;500;700&display=swap');

                
         /* Hide Top Bar of streamlit */
                
            #MainMenu, footer, header {
                visibility: hidden;
            }
                
            .block-container {
                padding-top:1.5rem !important;    
            }

            h1 {
                font-family: 'Inter', sans-serif !important;
                font-size: 3.5rem !important;
                font-weight: 800 !important;
                line-height: 1.1 !important;
                margin-bottom: 0rem !important;
                color: #F8FAFC !important;
                letter-spacing: -0.02em !important;
            }
                

            h2 {
                font-family: 'Inter', sans-serif !important;
                font-size: 2rem !important;
                font-weight: 600 !important;
                line-height: 1.2 !important;
                margin-bottom: 0rem !important;
                color: #E2E8F0 !important;
                letter-spacing: -0.01em !important;
            }
                
            h3, h4, p, span, div, label {
                font-family: 'Outfit', sans-serif;    
                color: #CBD5E1 !important;
            }
            
            p {
                color: #94A3B8 !important;
            }
                

            button{
                border-radius: 1.5rem !important;
                background: linear-gradient(90deg, #6366F1 0%, #A855F7 100%) !important;
                color: white !important;
                padding: 10px 20px !important;
                border: none !important;
                box-shadow: 0 4px 14px 0 rgba(99, 102, 241, 0.39) !important;
                transition: transform 0.25s ease-in-out, box-shadow 0.25s ease-in-out !important;
                font-family: 'Inter', sans-serif !important;
                font-weight: 600 !important;
            }

            button[kind="secondary"]{
                background: rgba(255, 255, 255, 0.05) !important;
                border: 1px solid rgba(255, 255, 255, 0.1) !important;
                color: #F8FAFC !important;
                box-shadow: none !important;
            }

            button[kind="tertiary"]{
                background: transparent !important;
                color: #A855F7 !important;
                border: 1px solid #A855F7 !important;
                box-shadow: none !important;
            }

            button:hover{
                transform: scale(1.03) !important;
                box-shadow: 0 6px 20px rgba(99, 102, 241, 0.6) !important;
            }
            
            button[kind="secondary"]:hover{
                background: rgba(255, 255, 255, 0.1) !important;
                box-shadow: 0 4px 12px rgba(255, 255, 255, 0.1) !important;
            }
            
            button[kind="tertiary"]:hover{
                background: rgba(168, 85, 247, 0.1) !important;
                box-shadow: 0 4px 12px rgba(168, 85, 247, 0.2) !important;
            }
            
            /* Input fields styling */
            input, select, textarea {
                background-color: rgba(0, 0, 0, 0.2) !important;
                border: 1px solid rgba(255, 255, 255, 0.1) !important;
                color: #F8FAFC !important;
                border-radius: 0.75rem !important;
            }
            
            input:focus, select:focus, textarea:focus {
                border-color: #6366F1 !important;
                box-shadow: 0 0 0 1px #6366F1 !important;
            }
            
        </style>  

                """
            ,unsafe_allow_html=True)