# OmniAttend AI — Feature Demonstration & Documentation Guide

Welcome to the feature documentation of **OmniAttend AI**, a premium, state-of-the-art AI-powered attendance tracking ecosystem. This guide explores every user flow, interface feature, and backend mechanism designed to make classroom management fast, accurate, and completely seamless.

---

## 🌟 Ecosystem Overview
OmniAttend AI is built as a multi-tier platform targeting three distinct spaces:
1. **The Marketing Landing Page**: A homepage highlighting features, pricing, and system details.
2. **The Portal (Next.js Application)**:
   - **Teacher Dashboard**: Management of classes, subjects, analytics, and live AI-powered attendance detection.
   - **Student Dashboard**: Real-time attendance history, progress tracking, warning indicators, and AI insights.
3. **The FastAPI Backend**: Houses the core AI models (Face Recognition and Voice Verification) and handles the database (Supabase) operations.
4. **The Streamlit Admin App**: A backup/parallel interface for immediate data testing and rapid AI profiling.

---

## 🚀 Key Features and Demonstrations

### 1. 🔑 Multi-Role Authentication & Access
OmniAttend AI securely manages two separate user roles (Teachers & Students) using modern, role-specific authentication workflows:
- **Teacher Registration**: Secure email sign-up using dynamic **OTP (One-Time Password) email verification** to prevent fake registrations.
- **Teacher Login**: Secure username and password login.
- **Student Login (Passwordless Face Login)**: Students log in by simply looking at their webcam. The system detects their face, extracts features, runs them against the AI model, and logs them in automatically.
- **Student Registration**: Students provide their name, email, phone number, a face photo (to generate facial embeddings), and an optional voice recording (for voice profiling).

---

### 2. 📸 Live Face Attendance (Teacher Portal)
The hallmark feature of the platform is the bulk face analysis system:
- **Bulk Photo Upload**: Teachers can upload one or multiple class photos containing multiple students.
- **AI Face Detection & Recognition**: The backend runs the image through a deep learning pipeline (Multi-task Cascaded Convolutional Networks for detection and FaceNet/SVM for matching).
- **Roster Review Dialog**: Instead of writing directly to the database, a visual grid displays **all enrolled students** in the class.
  - ✅ **Present Students**: Marked automatically based on face matching with detection confidence.
  - ❌ **Absent Students**: Listed clearly.
  - **Manual Overrides**: Teachers can click on any row to toggle a student's status between Present and Absent.
  - **Confirm & Save**: Clicking this persists the finalized logs securely to the database.

---

### 3. 🎙️ Voice Verification Attendance
For environments where photo uploads aren't suitable or as an added layer of confirmation, the system supports voice-based attendance:
- **Audio Recording / Upload**: Teachers capture a voice snippet where students speak a phrase.
- **Voice Recognition (Pyannote / Speaker Embedding)**: The backend compares the audio features with the voice embeddings registered by students.
- **Interactive Review**: Recognized students are highlighted in a visual roster modal for teacher confirmation before saving.

---

### 4. 📊 Teacher Dashboard & Analytics
Provides a command center for teachers to analyze attendance metrics:
- **Class Attendance Rates**: Real-time visual metrics (cards, progress bars, HSL graphs) showing overall student turnout.
- **Subject Management**: Teachers can create new subjects, generate unique **Join Codes** for student self-enrollment, and view all registered students.
- **Detailed Subject Breakdown**: Toggle through classes to see who is attending regularly and who is falling behind.
- **AI Insights Panel**: Automatically identifies "At-Risk" students (whose attendance is below the 75% threshold) and suggests preventive measures.

---

### 5. 📥 Attendance History & Reports Export
Ensures compliance and record-keeping are effortless:
- **Detailed Attendance Table**: View logs filtered by subject, student, and date ranges.
- **Excel Report Export**: Teachers can click **"Export Excel"** to instantly generate and download a clean, formatted spreadsheet (`.xlsx`) containing tabular attendance records, dates, and presence flags.

---

### 6. 🎓 Student Dashboard
Designed to keep students engaged and informed about their academic standing:
- **Overall Attendance Gauge**: A dynamic circular SVG gauge demonstrating the student's cumulative attendance percentage.
- **At-Risk Warning banner**: If a student's attendance falls below 75% in any subject, a warning card highlights the specific subjects.
- **AI Attendance Predictor**: The platform computes the exact number of consecutive classes a student must attend to cross the 75% (or 90%) target.
- **Recent Logs Activity**: A feed showing when and how the student was marked present (e.g., via face analysis or manual teacher override).
- **Voice Profile Registration**: Under Settings, students can record and verify their voice samples to keep their biometric login active.

---

## 🛠️ Technical Stack Breakdown
- **Frontend**: Next.js 16 (app router), TypeScript, Tailwind CSS / Vanilla CSS, Framer Motion.
- **Backend API**: FastAPI (Python), Uvicorn, Pandas, Scikit-learn, PIL.
- **Database & Storage**: Supabase (PostgreSQL) + Supabase Buckets (for profile storage).
- **AI Pipelines**:
  - **Face**: OpenCV + MTCNN (Face Detection) + FaceNet/ResNet (Feature Extraction) + SVM/KNN Classifier (Prediction).
  - **Voice**: SpeechBrain / ECAPA-TDNN speaker embeddings.
