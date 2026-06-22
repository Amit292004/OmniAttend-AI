# OmniAttend AI: Comprehensive Project Manual

## 1. Project Overview
**OmniAttend AI** is a state-of-the-art, AI-powered attendance tracking system designed to automate and secure the attendance process in educational institutions. Leveraging advanced Machine Learning algorithms for both Facial and Voice Recognition, the system eliminates manual roll-calls, prevents proxy attendance, and provides a seamless, secure experience for both educators and students.

## 2. Core Features & Functions

### 2.1 Teacher Module
The Teacher Module provides educators with the tools needed to manage classes and record attendance efficiently.
*   **Secure Authentication:** Teachers can register and log in securely. Passwords are cryptographically hashed before being stored in the database to ensure high security.
*   **Subject & Class Management:** Teachers can create distinct "Subjects" (e.g., Mathematics, Computer Science) and generate unique joining codes to easily onboard students into their specific classes.
*   **Multimodal AI Attendance:**
    *   **Facial Recognition Attendance:** Teachers can upload a group photograph of the classroom. The system's AI will detect all faces, classify them against enrolled students, and automatically log the present students.
    *   **Voice Recognition Attendance:** Teachers can upload an audio recording of the class (e.g., a roll-call or discussion). The system segments the audio by speaker and identifies students based on their unique voice signatures.
*   **Analytics & Reporting:** The system generates comprehensive attendance reports. Teachers can export formatted "School Registers" (Excel format) detailing attendance percentages, session-wise records, and aggregate statistics.

### 2.2 Student Module
The Student Module focuses on a frictionless onboarding and daily login experience using biometrics.
*   **Biometric Onboarding:** Upon joining a class via a teacher's code, students register their biometric data. They capture a live photo (for facial embeddings) and record a short audio clip (for voice embeddings).
*   **FaceID Login:** Students log into their dashboard securely using a live webcam feed, acting as a seamless, password-less authentication mechanism.
*   **Attendance Tracking:** Students can view a personalized dashboard showing all enrolled subjects and their real-time attendance statistics and percentages.

## 3. Technology Stack in Detail

### 3.1 Frontend & User Interface
*   **Streamlit (Main Web Application):** Used as the core framework for the application logic and UI rendering in Python. It handles session state (`st.session_state`) for seamless navigation between teacher and student portals.
*   **Custom CSS Integration:** Extensive CSS is injected into the Streamlit app to hide default elements and provide a modern, native-application feel with polished gradients, responsive containers, and interactive buttons.
*   **Next.js & Prisma (Landing Page):** A high-performance, React-based web framework used for the project's marketing and entry-point website (`landingpage` directory), providing SEO optimization and fast loading speeds.

### 3.2 Backend & Database Layer
*   **Supabase (Database-as-a-Service):** Functions as the primary backend, utilizing a highly scalable PostgreSQL database under the hood. It securely stores relational data such as user profiles, subjects, enrollment mapping, attendance logs, and complex high-dimensional biometric vectors.
*   **bcrypt:** A robust password-hashing function used to salt and hash teacher passwords, ensuring data security and adherence to modern authentication best practices.

### 3.3 Artificial Intelligence & Machine Learning Pipelines
The system utilizes entirely local, server-side inference for AI processing, ensuring data privacy and eliminating reliance on paid external APIs.

*   **Facial Recognition Pipeline:**
    *   **`dlib`:** A modern C++ toolkit containing machine learning algorithms. It is used to detect bounding boxes for faces and locate 68 distinct facial landmarks to align the face. Finally, a pre-trained ResNet network converts the face into a unique 128-dimensional mathematical vector (embedding).
    *   **`scikit-learn` (Support Vector Machine - SVC):** When taking attendance, an SVC with a linear kernel is dynamically trained on the embeddings of the enrolled students. This classifier accurately predicts identities from a group photo.
    *   **`numpy`:** Used extensively for vector mathematics, specifically to calculate the Euclidean distance between the predicted face and the stored database face to verify the prediction and prevent false positives (threshold-based verification).

*   **Voice Recognition Pipeline:**
    *   **`librosa`:** A Python package for music and audio analysis. Used to load audio files at a 16kHz sample rate and perform crucial preprocessing, primarily splitting the continuous audio into isolated spoken segments by removing silence (decibel-thresholding).
    *   **`resemblyzer`:** A deep learning library that uses a pre-trained Voice Encoder to convert each isolated audio segment into a high-dimensional voice embedding representing the speaker's unique vocal characteristics.
    *   **Cosine Similarity (Dot Product):** The system uses vector math via `numpy` to calculate the cosine similarity between the detected voice segment and the stored student voice embeddings, registering a match if the score exceeds a high-confidence threshold (e.g., `>= 0.65`).

## 4. System Architecture & Data Flow

1.  **Entry Point:** Users access the Next.js landing page, which markets the product and directs them to the main Streamlit application.
2.  **User Interaction (UI Layer):** The Streamlit UI captures user inputs, forms, webcam images, and microphone audio.
3.  **AI Processing (In-Memory Layer):**
    *   *During Registration:* Media is passed to the AI pipelines (`face_pipeline.py`, `voice_pipeline.py`) to generate structural embeddings.
    *   *During Attendance:* Uploaded group media is processed. The AI models (SVC for face, Cosine Similarity for voice) cross-reference the extracted vectors against those stored in the database.
4.  **Data Storage (Database Layer):** The application communicates securely with the Supabase PostgreSQL database via REST APIs to store and retrieve user credentials, relationships, and the heavy biometric embedding arrays.

---
*Generated for the OmniAttend AI Final Year Project Submission.*
