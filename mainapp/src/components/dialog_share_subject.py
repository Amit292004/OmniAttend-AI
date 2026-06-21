import streamlit as st
import segno
import io
import urllib.parse


@st.dialog("Share Class Link")
def share_subject_dialog(subject_name, subject_code):
    app_domain = "omniattend-ai-main.streamlit.app"
    join_url = f"{app_domain}/?join-code={subject_code}"

    st.header("Scan to Join")

    qr = segno.make(join_url)

    out = io.BytesIO()

    qr.save(out, kind='png', scale=10, border=1)

    col1, col2 = st.columns(2)

    with col1:
        st.markdown('### Copy Link')
        st.code(join_url, language="text")
        st.code(subject_code, language="text")
        
        whatsapp_msg = f"Join my class *{subject_name} ({subject_code})* using this link:\n{join_url}"
        whatsapp_url = f"https://api.whatsapp.com/send?text={urllib.parse.quote(whatsapp_msg)}"
        
        st.link_button("Share on WhatsApp", url=whatsapp_url, use_container_width=True)

    with col2:
        st.markdown('### Scan to Join')
        st.image(out.getvalue(), caption='QR Code for class joining')
        st.download_button("Download QR Code", data=out.getvalue(), file_name=f"{subject_code}_QR.png", mime="image/png", use_container_width=True)

        
