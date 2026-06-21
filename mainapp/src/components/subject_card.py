import streamlit as st
def subject_card(name, code, section, stats=None, footer_callback=None):
    html = f"""
        <div style="background: rgba(255, 255, 255, 0.04); border-left: 8px solid #A855F7; padding:25px; border-radius: 20px; border: 1px solid rgba(255, 255, 255, 0.08); border-left-color: #A855F7; margin-bottom:20px; backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); height: 230px; box-sizing: border-box;">
        <h3 style="margin:0; color: #F8FAFC; font-size: 1.5rem; font-family: 'Inter', sans-serif; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis;">{name}</h3>
        <p style="color:#94A3B8; margin:10px 0; font-family: 'Outfit', sans-serif;">Code: <span style="background:rgba(99, 102, 241, 0.2); color:#A855F7; padding:2px 8px; border-radius:5px;">{code}</span> | Section: {section}</p>
        
        """
    
    if stats:
        html+= """
        <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top: 15px;">
        """
        for icon, label, value in stats:
            html+= f'<div style="background: rgba(168, 85, 247, 0.1); padding:5px 12px; border-radius:12px; font-size:0.9rem; color:#E2E8F0; font-family: \'Outfit\', sans-serif;">{icon} <b style="color:#F8FAFC;">{value}</b> {label} </div>'
        
        html+= "</div>"

    st.markdown(html, unsafe_allow_html=True)

    if footer_callback:
        footer_callback()
