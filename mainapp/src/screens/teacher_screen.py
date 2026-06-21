import streamlit as st

from src.ui.base_layout import style_background_dashboard, style_base_layout

from src.components.header import header_dashboard
from src.components.footer import footer_dashboard
from src.components.subject_card import subject_card
from src.database.db import check_teacher_exists, create_teacher, teacher_login, get_teacher_subjects, get_attendance_for_teacher, delete_subject, delete_attendance_session
from src.components.dialog_create_subject import create_subject_dialog
from src.components.dialog_manage_students import manage_students_dialog

import sys
if 'src.components.dialog_share_subject' in sys.modules:
    del sys.modules['src.components.dialog_share_subject']
from src.components.dialog_share_subject import share_subject_dialog
from src.components.dialog_add_photo import add_photos_dialog
from src.components.dialog_edit_profile import edit_teacher_profile_dialog

from src.pipelines.face_pipeline import predict_attendance
from src.components.dialog_attendance_results import attendance_result_dialog
import numpy as np
import io
from datetime import datetime

import pandas as pd

from src.database.config import supabase


from src.components.dialog_voice_attendance import voice_attendance_dialog
def teacher_screen():

    style_background_dashboard()
    style_base_layout()

    if "teacher_data" in st.session_state:
        teacher_dashboard()
    elif 'teacher_login_type' not in st.session_state or st.session_state.teacher_login_type=="login":
        teacher_screen_login()
    elif st.session_state.teacher_login_type == "register":
        teacher_screen_register()





def teacher_dashboard():
    teacher_data = st.session_state.teacher_data
    c1, c2 = st.columns(2, vertical_alignment='center', gap='xxlarge')
    with c1:
        header_dashboard()
    with c2:
        st.subheader(f"""Welcome, {teacher_data['name']} """)
        
        b1, b2 = st.columns(2)
        with b1:
            if st.button("Edit Profile", type='secondary', icon=':material/edit:', use_container_width=True):
                edit_teacher_profile_dialog()
        with b2:
            if st.button("Logout", type='primary', icon=':material/logout:', key='loginbackbtn', use_container_width=True):
                st.session_state['is_logged_in'] = False
                del st.session_state.teacher_data 
                st.rerun()


    st.space()

    if "current_teacher_tab" not in st.session_state:
        st.session_state.current_teacher_tab = 'take_attendance'
    tab1, tab2, tab3 = st.columns(3)


    with tab1:
        type1 = "primary" if st.session_state.current_teacher_tab == 'take_attendance' else "tertiary"
        if st.button('Take Attendance',type=type1, width='stretch', icon=':material/ar_on_you:'):
            st.session_state.current_teacher_tab = 'take_attendance'
            st.rerun()

    with tab2:
        type2 = "primary" if st.session_state.current_teacher_tab == 'manage_subjects' else "tertiary"
        if st.button('Manage Subjects', type=type2, width='stretch', icon=':material/book_ribbon:'):
            st.session_state.current_teacher_tab = 'manage_subjects'
            st.rerun()

    with tab3:
        type3 = "primary" if st.session_state.current_teacher_tab == 'attendance_records' else "tertiary"
        if st.button('Attendance Records',type=type3, width='stretch', icon=':material/cards_stack:'):
            st.session_state.current_teacher_tab = 'attendance_records'
            st.rerun()


    st.divider()

    if st.session_state.current_teacher_tab == "take_attendance":
        teacher_tab_take_attendance()
    if st.session_state.current_teacher_tab == "manage_subjects":
        teacher_tab_manage_subjects()
    if st.session_state.current_teacher_tab == "attendance_records":
        teacher_tab_attendance_records()

    


    footer_dashboard()

def teacher_tab_take_attendance():
    teacher_id = st.session_state.teacher_data['teacher_id']
    st.header('Take AI Attendance')


    if 'attendance_images' not in st.session_state:
        st.session_state.attendance_images = []

    subjects = get_teacher_subjects(teacher_id)

    if not subjects:
        st.warning('You havent created any subjects yet! Please create one to begin!')
        return
    
    subject_options = {f"{s['name']} - {s['subject_code']}": s['subject_id'] for s in subjects}

    col1, col2 = st.columns([3,1], vertical_alignment='bottom')

    with col1:
        selected_subject_label = st.selectbox('Select Subject', options=list(subject_options.keys()))

    with col2:
        if st.button('Add Photos', type='primary', icon=':material/photo_prints:', width='stretch'):
            add_photos_dialog()

    selected_subject_id = subject_options[selected_subject_label]

    st.divider()

    if st.session_state.attendance_images:
        st.header('Added Photos')
        gallery_cols = st.columns(4)

        for idx, img in enumerate(st.session_state.attendance_images):
            with gallery_cols[idx % 4 ]:
                st.image(img, width='stretch', caption=f'Photo {idx+1}')
    has_photos = bool(st.session_state.attendance_images)
    c1, c2, c3 = st.columns(3)

    with c1:
        if st.button('Clear all photos', width='stretch', type='tertiary', icon=':material/delete:', disabled=not has_photos):
            st.session_state.attendance_images = []
            st.rerun()


    with c2:
        
        if st.button('Run Face Analysis', width='stretch', type='secondary', icon=':material/analytics:', disabled=not has_photos):
            with st.spinner('Deep scanning classroom photos...'):
                all_detected_ids = {}

                for idx, img in enumerate(st.session_state.attendance_images):
                    img_np = np.array(img.convert('RGB'))
                    detected, _, _ = predict_attendance(img_np)


                    if detected:
                        for sid in detected.keys():
                            student_id = int(sid)

                            all_detected_ids.setdefault(student_id, []).append(f"Photo {idx+1}")

                enrolled_res = supabase.table('subject_students').select("*, students(*)").eq('subject_id',selected_subject_id ).execute()
                enrolled_students = enrolled_res.data

                if not enrolled_students:
                    st.warning('No students enrolled in this course')
                else:

                    results, attendance_to_log  = [], []

                    current_timestamp = datetime.now().strftime("%Y-%m-%dT%H:%M:%S")


                    for node in enrolled_students:
                        student = node['students']
                        sources = all_detected_ids.get(int(student['student_id']), [])
                        is_present= len(sources) > 0

                        results.append({
                            "Name": student['name'],
                            "ID": student['student_id'],
                            "Source": ", ".join(sources) if is_present else "-",
                            "Status": "✅ Present" if is_present else "❌ Absent"
                        })

                        attendance_to_log.append({
                            'student_id': student['student_id'],
                            'subject_id': selected_subject_id,
                            'timestamp': current_timestamp,
                            'is_present': bool(is_present)
                        })

                    attendance_result_dialog(pd.DataFrame(results), attendance_to_log)

    with c3:
        if st.button('Use Voice Attendance', type='primary', width='stretch', icon=':material/mic:'):
            voice_attendance_dialog(selected_subject_id)











def teacher_tab_manage_subjects():
    teacher_id = st.session_state.teacher_data['teacher_id']
    col1, col2 = st.columns(2)
    with col1:
        st.header('Manage Subjects', width='stretch')

    with col2:
        if st.button('Create New Subject', width='stretch'):
            create_subject_dialog(teacher_id)


    # LIST all SUBJECTS
    subjects = get_teacher_subjects(teacher_id)
    if subjects:
        for sub in subjects:
            stats = [
                ("🫂", "Students", sub['total_students']),
                ("🕰️", "Classes", sub['total_classes']),
            ]
            def share_btn(current_sub=sub):
                b1, b2, b3 = st.columns([2, 2, 2])
                with b1:
                    if st.button(f"Share Code", key=f"share_{current_sub['subject_code']}", icon=":material/share:", use_container_width=True):
                        share_subject_dialog(current_sub['name'], current_sub['subject_code'])
                with b2:
                    if st.button("Manage Students", key=f"manage_{current_sub['subject_code']}", icon=":material/group:", use_container_width=True):
                        manage_students_dialog(current_sub['subject_id'])
                with b3:
                    if st.button("Delete Subject", key=f"del_{current_sub['subject_code']}", icon=":material/delete:", use_container_width=True, type="primary"):
                        delete_subject(current_sub['subject_id'])
                        st.toast(f"Deleted {current_sub['name']}")
                        import time
                        time.sleep(1)
                        st.rerun()
                st.space()

            subject_card(
                name = sub['name'],
                code = sub['subject_code'],
                section = sub['section'],
                stats=stats,
                footer_callback=share_btn
            )
    else:
        st.info("NO SUBJECTS FOUND. CREATE ONE ABOVE")


def teacher_tab_attendance_records():
    st.header('Attendance Records')

    teacher_id = st.session_state.teacher_data['teacher_id']

    records = get_attendance_for_teacher(teacher_id)

    if not records:
        st.info("No attendance records found.")
        return
    
    data = []

    for r in records:
        ts = r.get('timestamp')
        
        student_name = "Unknown"
        if 'students' in r and r['students']:
            student_name = r['students'].get('name', 'Unknown')

        data.append({
            "ts_group": ts.split(".")[0] if ts else None,
            "Time": datetime.fromisoformat(ts).strftime(" %Y-%m-%d %I:%M %p") if ts else "N/A",
            "Subject": r['subjects']['name'],
            "Subject Code":r['subjects']['subject_code'],
            "is_present": bool(r.get('is_present', False)),
            "Student": student_name,
            "subject_id": r.get('subject_id')
        })


    df = pd.DataFrame(data)

    # -----------------------------
    # CUSTOM REPORT EXPORT SECTION
    # -----------------------------
    with st.expander("📊 Export Custom Attendance Report"):
        st.write("Generate and download attendance reports for specific date ranges and subjects.")
        
        # Convert timestamp to date for filtering
        df['Date'] = pd.to_datetime(df['ts_group']).dt.date
        
        rc1, rc2 = st.columns(2)
        with rc1:
            subject_options = list(df['Subject Code'].unique())
            selected_report_sub = st.selectbox("Select Subject", subject_options, key="report_sub")
        with rc2:
            min_date = df['Date'].min()
            max_date = df['Date'].max()
            date_range = st.date_input("Select Date Range", value=(min_date, max_date), min_value=min_date, max_value=max_date, key="report_dates")
        
        if len(date_range) == 2:
            start_date, end_date = date_range
            
            # Filter Data
            mask = (df['Date'] >= start_date) & (df['Date'] <= end_date) & (df['Subject Code'] == selected_report_sub)
            report_df = df[mask].copy()
            if report_df.empty:
                st.warning("No records found for the selected criteria.")
            else:
                

                export_df = report_df[['Date', 'Subject', 'Subject Code', 'Student', 'ts_group']].copy()
                export_df['Date'] = export_df['Date'].astype(str)
                export_df['TimeOnly'] = pd.to_datetime(export_df['ts_group']).dt.strftime('%I:%M %p')
                export_df['Status'] = report_df['is_present'].apply(lambda x: 'P' if x else 'A')
                
                # Handle multiple sessions per day cleanly
                date_counts = export_df.groupby(['Subject Code', 'Date'])['ts_group'].nunique()
                
                def get_session_label(row):
                    if date_counts.get((row['Subject Code'], row['Date']), 0) > 1:
                        return f"{row['Date']} ({row['TimeOnly']})"
                    return row['Date']
                    
                export_df['Session_Label'] = export_df.apply(get_session_label, axis=1)
                
                # Create pivot table for "School Register" view
                is_single_subject = report_df['Subject Code'].nunique() == 1
                pivot_index = ['Student'] if is_single_subject else ['Subject Code', 'Student']
                
                pivot_df = export_df.pivot_table(
                    index=pivot_index,
                    columns='Session_Label',
                    values='Status',
                    aggfunc='first',
                    fill_value='-'
                ).reset_index()
                
                # Calculate Attendance Percentage
                date_cols = [c for c in pivot_df.columns if c not in pivot_index]
                def calc_att(row):
                    if not date_cols: return '0%'
                    p_count = sum(1 for c in date_cols if row[c] == 'P')
                    a_count = sum(1 for c in date_cols if row[c] == 'A')
                    total = p_count + a_count
                    if total == 0: return '0%'
                    return f"{int((p_count / total) * 100)}%"
                
                pivot_df['Attendance %'] = pivot_df.apply(calc_att, axis=1)
                
                output = io.BytesIO()
                with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
                    pivot_df.to_excel(writer, index=False, sheet_name='Register', startrow=1)
                    worksheet = writer.sheets['Register']
                    workbook = writer.book
                    
                    # Formats
                    title_format = workbook.add_format({'bold': True, 'align': 'center', 'valign': 'vcenter', 'font_size': 14, 'bg_color': '#e2e8f0', 'border': 1})
                    header_format = workbook.add_format({'bold': True, 'bg_color': '#6366f1', 'font_color': 'white', 'border': 1})
                    present_format = workbook.add_format({'font_color': '#10b981', 'bold': True, 'align': 'center'})
                    absent_format = workbook.add_format({'font_color': '#ef4444', 'bold': True, 'align': 'center'})
                    dash_format = workbook.add_format({'font_color': '#9ca3af', 'align': 'center'})
                    
                    # Write Title Row
                    if is_single_subject:
                        subject_title = f"{report_df['Subject Code'].iloc[0]} ({report_df['Subject'].iloc[0]}) Attendance Register"
                    else:
                        subject_title = "Master Attendance Register (Multiple Subjects)"
                    
                    num_cols = len(pivot_df.columns)
                    worksheet.merge_range(0, 0, 0, num_cols - 1, subject_title, title_format)
                    worksheet.set_row(0, 30) # Make title row taller
                    
                    # Write Headers
                    for col_num, value in enumerate(pivot_df.columns.values):
                        worksheet.write(1, col_num, value, header_format)
                        
                    # Column widths
                    if len(pivot_index) == 1:
                        worksheet.set_column('A:A', 25) # Student
                        date_start_col = 1
                    else:
                        worksheet.set_column('A:A', 15) # Subject Code
                        worksheet.set_column('B:B', 25) # Student
                        date_start_col = 2
                    
                    # Data formatting
                    if len(date_cols) > 0:
                        last_date_col_idx = date_start_col + len(date_cols) - 1
                        worksheet.set_column(date_start_col, last_date_col_idx, 15) # Dates
                        
                        worksheet.conditional_format(2, date_start_col, 10000, last_date_col_idx, {'type': 'cell', 'criteria': '==', 'value': '"P"', 'format': present_format})
                        worksheet.conditional_format(2, date_start_col, 10000, last_date_col_idx, {'type': 'cell', 'criteria': '==', 'value': '"A"', 'format': absent_format})
                        worksheet.conditional_format(2, date_start_col, 10000, last_date_col_idx, {'type': 'cell', 'criteria': '==', 'value': '"-"', 'format': dash_format})
                        
                        # Set Attendance % column width
                        att_col_idx = len(pivot_df.columns) - 1
                        worksheet.set_column(att_col_idx, att_col_idx, 15)
                
                excel_data = output.getvalue()
                
                st.download_button(
                    label="Download Report (Excel)",
                    data=excel_data,
                    file_name=f"Attendance_Report_{start_date}_to_{end_date}.xlsx",
                    mime='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    type='primary',
                    icon=':material/download:'
                )
        else:
            st.info("Please select both a start and end date.")
            
    st.divider()

    summary = (
        df.groupby(['ts_group', 'Time', 'Subject', 'Subject Code'])
        .agg(
            Present_Count = ('is_present', 'sum'),
            Total_Count =('is_present', 'count')
        ).reset_index()

    )

    summary['Attendance Stats'] = (
        "✅ " + summary['Present_Count'].astype(str) + " / "
        + summary['Total_Count'].astype(str) + ' Students'
    )

    display_df = summary.sort_values(by='ts_group', ascending=False).reset_index(drop=True)
    
    fc1, fc2 = st.columns([3, 1], vertical_alignment="center")
    with fc1:
        st.write("👉 **Select a row** to view the detailed list of present and absent students.")
    with fc2:
        filter_options = ["All Subjects"] + list(display_df['Subject Code'].unique())
        selected_filter = st.selectbox("Filter Sessions", filter_options, label_visibility="collapsed", key="session_table_filter")
        
    if selected_filter != "All Subjects":
        display_df = display_df[display_df['Subject Code'] == selected_filter].reset_index(drop=True)
        
    table_df = display_df[['Time', 'Subject', 'Subject Code', 'Attendance Stats']]
    
    st.markdown("<br>", unsafe_allow_html=True)
    
    if table_df.empty:
        st.info("No attendance sessions recorded yet.")
    else:
        dynamic_height = min(400, len(table_df) * 36 + 43)
        event = st.dataframe(table_df, width='stretch', height=dynamic_height, hide_index=True, on_select="rerun", selection_mode="single-row")
        
        if event.selection.rows:
            selected_idx = event.selection.rows[0]
            selected_ts = display_df.iloc[selected_idx]['ts_group']
            
            st.markdown("<br>", unsafe_allow_html=True)
        
            with st.container(border=True):
                hc1, hc2 = st.columns([3, 1], vertical_alignment="bottom")
                with hc1:
                    st.subheader(f"Session Details: {display_df.iloc[selected_idx]['Subject Code']}")
                    st.caption(f"Recorded on {display_df.iloc[selected_idx]['Time']}")
                
                details_df = df[df['ts_group'] == selected_ts]
                
                # Display DF
                display_details = details_df[['Student', 'is_present']].copy()
                display_details['Status'] = display_details['is_present'].apply(lambda x: '✅ Present' if x else '❌ Absent')
                
                # Export DF (Formatted like Master Register)
                csv_df = details_df[['Student']].copy()
                session_time = details_df.iloc[0]['Time'].strip()
                csv_df[session_time] = details_df['is_present'].apply(lambda x: 'P' if x else 'A')
                
                with hc2:
                    output = io.BytesIO()
                    with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
                        csv_df.to_excel(writer, index=False, sheet_name='Register', startrow=1)
                        worksheet = writer.sheets['Register']
                        workbook = writer.book
                        
                        title_format = workbook.add_format({
                            'bold': True, 'font_size': 14, 'align': 'center', 
                            'valign': 'vcenter', 'fg_color': '#312e81', 'font_color': 'white', 'text_wrap': True
                        })
                        header_format = workbook.add_format({'bold': True, 'fg_color': '#6366f1', 'font_color': 'white', 'border': 1})
                        present_format = workbook.add_format({'font_color': '#10b981', 'bold': True})
                        absent_format = workbook.add_format({'font_color': '#ef4444', 'bold': True})
                        
                        subject_code = details_df.iloc[0]['Subject Code']
                        subject_name = details_df.iloc[0]['Subject']
                        subject_title = f"{subject_code} ({subject_name}) Attendance Register"
                        
                        worksheet.merge_range(0, 0, 0, 1, subject_title, title_format)
                        worksheet.set_row(0, 60)
                        
                        for col_num, value in enumerate(csv_df.columns.values):
                            worksheet.write(1, col_num, value, header_format)
                            
                        worksheet.set_column('A:A', 25)
                        worksheet.set_column('B:B', 20)
                        
                        worksheet.conditional_format('B3:B1000', {'type': 'cell', 'criteria': '==', 'value': '"P"', 'format': present_format})
                        worksheet.conditional_format('B3:B1000', {'type': 'cell', 'criteria': '==', 'value': '"A"', 'format': absent_format})
                    
                    excel_data = output.getvalue()
                    
                    st.download_button(
                        label="Export to Excel",
                        data=excel_data,
                        file_name=f"Attendance_{display_df.iloc[selected_idx]['Subject Code']}_{selected_ts}.xlsx",
                        mime='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                        icon=':material/download:',
                        use_container_width=True,
                        type="primary"
                    )
                    
                    if st.button("Delete Session", icon=":material/delete:", use_container_width=True):
                        delete_attendance_session(details_df.iloc[0]['subject_id'], selected_ts)
                        st.toast("Attendance session deleted successfully!", icon="✅")
                        import time
                        time.sleep(1)
                        st.rerun()
                    
                st.divider()
                
                st.dataframe(display_details[['Student', 'Status']], use_container_width=True, hide_index=True)


def login_teacher(username, password):
    if not username or not password:
        return False
    
    teacher = teacher_login(username, password)

    if teacher:
        st.session_state.user_role ='teacher'
        st.session_state.teacher_data = teacher
        st.session_state.is_logged_in = True
        return True
    

    return False
def teacher_screen_login():
    c1, c2 = st.columns(2, vertical_alignment='center', gap='xxlarge')
    with c1:
        header_dashboard()
    with c2:
        if st.button("Go back to Home", type='secondary', key='loginbackbtn', shortcut="control+backspace"):
            st.session_state['login_type'] = None
            st.rerun()

    with st.container(border=True):
        st.header('Login using password', text_alignment='center')
        st.space()
        st.space()

        teacher_username = st.text_input("Enter username", placeholder='amit@2004')

        teacher_pass = st.text_input("Enter password", type='password', placeholder="Enter password")

        st.divider()

        btnc1, btnc2 = st.columns(2)

        with btnc1:
            if st.button('Login', icon=':material/passkey:', shortcut='control+enter', width='stretch'):
                if login_teacher(teacher_username, teacher_pass):
                    st.toast("welcome back!", icon="👋")
                    import time
                    time.sleep(1)
                    st.rerun()
                else:
                    st.error("Invalid username and password combo")

        with btnc2:
            if st.button('Register Instead', type="primary", icon=':material/passkey:', width='stretch'):
                st.session_state.teacher_login_type = 'register'

    footer_dashboard()



def register_teacher(teacher_username, teacher_name, teacher_pass, teacher_pass_confirm):
    if not teacher_username or not teacher_name or not teacher_pass:
        return False, "All Fields are required!"
    if check_teacher_exists(teacher_username):
        return False, "Username already taken"
    if teacher_pass != teacher_pass_confirm:
        return False, "Password doesn't match"
    
    try:
        create_teacher(teacher_username, teacher_pass, teacher_name)
        return True, "Sucessfully Created! Login Now"
    except Exception as e:
        return False, "Unexpected Error!"
    

def teacher_screen_register():
    c1, c2 = st.columns(2, vertical_alignment='center', gap='xxlarge')
    with c1:
        header_dashboard()
    with c2:
        if st.button("Go back to Home", type='secondary', key='loginbackbtn', shortcut="control+backspace"):
            st.session_state['login_type'] = None
            st.rerun()



    with st.container(border=True):
        st.header('Register your teacher profile')

        st.space()
        st.space()

        
        teacher_username = st.text_input("Enter username", placeholder='amit@2004')

        teacher_name = st.text_input("Enter name", placeholder='Amit Sharma')

        teacher_pass = st.text_input("Enter password", type='password', placeholder="Enter password")

        teacher_pass_confirm = st.text_input("Confirm your password", type='password', placeholder="Enter password")

        st.divider()

        btnc1, btnc2 = st.columns(2)

        with btnc1:
            if st.button('Register now', icon=':material/passkey:', shortcut='control+enter', width='stretch'):
                success, message = register_teacher(teacher_username, teacher_name, teacher_pass, teacher_pass_confirm)
                if success:
                    st.success(message)
                    import time
                    time.sleep(2)
                    st.session_state.teacher_login_type = "login"
                    st.rerun()
                else:
                    st.error(message)


        with btnc2:
            if st.button('Login Instead', type="primary", icon=':material/passkey:', width='stretch'):
                st.session_state.teacher_login_type = 'login'

    footer_dashboard()