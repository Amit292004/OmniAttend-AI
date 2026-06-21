"use client";

import { useState, useEffect, useRef } from "react";
import { LogOut, ArrowRight, Loader2, ShieldAlert, Image as ImageIcon, Users, Search, Calendar, Phone, Mail, User, Upload } from "lucide-react";
import Link from "next/link";

const DEMO_IMAGES = [
  { id: "t1", type: "Teacher", title: "Step 01: Secure Login", path: "/img/demo/snap-teacher-flow-1-login.png" },
  { id: "t2", type: "Teacher", title: "Step 02: Interactive Dashboard", path: "/img/demo/snap-teacher-flow-2-dashboard.png" },
  { id: "t3", type: "Teacher", title: "Step 03: Course Management", path: "/img/demo/snap-teacher-flow-3-create-course.png" },
  { id: "t4", type: "Teacher", title: "Step 04: FaceID Attendance", path: "/img/demo/snap-teacher-flow-5.2-photo-attendance.png" },
  { id: "t5", type: "Teacher", title: "Step 05: Voice ID Attendance", path: "/img/demo/snap-teacher-flow-5.1-voice-attendance.png" },
  { id: "s1", type: "Student", title: "Phase 01: Instant Enrollment", path: "/img/demo/snap-student-flow-1-login.png" },
  { id: "s2", type: "Student", title: "Phase 02: Biometric Registration", path: "/img/demo/snap-student-flow-2-enroll.png" },
  { id: "s3", type: "Student", title: "Phase 03: Personal Dashboard", path: "/img/demo/snap-student-flow-3-dashboard.png" }
];

export default function AdminPage() {
  const [adminUser, setAdminUser] = useState<any>(null);
  const [loadingAdmin, setLoadingAdmin] = useState(true);
  const [activeTab, setActiveTab] = useState("images"); // "images" or "users"
  const [step, setStep] = useState(1);
  
  // Credentials Step 1
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Upload fields
  const [uploading, setUploading] = useState<string | null>(null);
  const [version, setVersion] = useState(Date.now());
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // Users Management State
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Check URL query parameters for callback errors on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    if (err) {
      if (err === "credentials_expired") {
        setErrorMsg("Your credentials session expired. Please start over.");
      } else if (err === "email_mismatch") {
        setErrorMsg("Verification failed: The Google account does not match the credentials entered in Step 1.");
      } else if (err === "not_an_admin") {
        setErrorMsg("Access Denied: The authenticated account is not an administrator.");
      } else {
        setErrorMsg(`Authentication error: ${err}`);
      }
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Fetch admin session status
  const checkAdminSession = async () => {
    try {
      const res = await fetch("/api/admin/me");
      const data = await res.json();
      if (data.user) {
        setAdminUser(data.user);
      } else {
        setAdminUser(null);
      }
    } catch (err) {
      console.error(err);
      setAdminUser(null);
    } finally {
      setLoadingAdmin(false);
    }
  };

  // Fetch all registered users
  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (data.users) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    checkAdminSession();
  }, []);

  useEffect(() => {
    if (adminUser) {
      fetchUsers();
    }
  }, [adminUser]);

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/admin/step1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: username, password }),
      });

      const data = await res.json();
      if (res.ok) {
        setStep(2);
      } else {
        setErrorMsg(data.error || "Invalid username or password");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleVerify = () => {
    window.location.href = "/api/auth/google?admin=true";
  };

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setAdminUser(null);
      setStep(1);
      setUsername("");
      setPassword("");
      setErrorMsg("");
      window.location.reload();
    } catch (err) {
      console.error("Sign out failed", err);
    }
  };

  const handleUpload = async (id: string, targetPath: string) => {
    const fileInput = fileInputRefs.current[id];
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      alert("Please choose a file first using the 'Choose File' button!");
      return;
    }

    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append("file", file);
    formData.append("targetPath", targetPath);

    try {
      setUploading(id);
      const res = await fetch("/api/admin/upload-demo", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        alert("Image uploaded successfully!");
        setVersion(Date.now()); // refresh images
        fileInput.value = ""; // reset input
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert("Failed to upload image. Check console for details.");
      console.error(err);
    } finally {
      setUploading(null);
    }
  };

  // Filter users list based on search query
  const filteredUsers = users.filter(u => {
    const fullname = `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase();
    const email = (u.email || "").toLowerCase();
    const phone = (u.phone || "").toLowerCase();
    const role = (u.role || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullname.includes(query) || email.includes(query) || phone.includes(query) || role.includes(query);
  });

  // Calculate statistics for users
  const totalCount = users.length;
  const adminCount = users.filter(u => u.role?.toUpperCase() === "ADMIN").length;
  const teacherCount = users.filter(u => u.role?.toLowerCase() === "teacher").length;
  const studentCount = users.filter(u => u.role?.toLowerCase() === "student").length;

  const getRoleBadgeClass = (role: string) => {
    const cleanRole = (role || "").toUpperCase();
    if (cleanRole === "ADMIN") return "badge-admin";
    if (cleanRole === "TEACHER") return "badge-teacher";
    if (cleanRole === "STUDENT") return "badge-student";
    if (cleanRole === "PARENT") return "badge-parent";
    return "badge-default";
  };

  const getProfileGradient = (email: string) => {
    const charCode = (email || "A").charCodeAt(0);
    const index = charCode % 4;
    const gradients = [
      "linear-gradient(135deg, #ff007f 0%, #7c5df9 100%)",
      "linear-gradient(135deg, #00f5d4 0%, #7c5df9 100%)",
      "linear-gradient(135deg, #9d4edd 0%, #ff007f 100%)",
      "linear-gradient(135deg, #fbbc05 0%, #9d4edd 100%)"
    ];
    return gradients[index];
  };

  if (loadingAdmin) {
    return (
      <div className="loader-container">
        <Loader2 size={42} className="spinner" />
        <style jsx global>{`
          .loader-container {
            min-height: 100vh;
            background-color: #05040d;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
          }
          .spinner {
            animation: spin 1s linear infinite;
            color: #7c5df9;
          }
          @keyframes spin {
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="admin-body">
      {/* Dynamic styles injected for animations, hover states, and premium design system */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        .admin-body {
          min-height: 100vh;
          background-color: #070614;
          background-image: 
            radial-gradient(circle at 10% 20%, rgba(124, 93, 249, 0.08) 0%, transparent 40%),
            radial-gradient(circle at 90% 80%, rgba(247, 37, 133, 0.06) 0%, transparent 45%),
            radial-gradient(circle at center, #070614 0%, #030309 100%);
          color: white;
          font-family: 'Plus Jakarta Sans', sans-serif;
          overflow-x: hidden;
          position: relative;
        }

        /* Floating background blobs */
        .bg-glow-1 {
          position: fixed;
          top: 10%;
          left: 5%;
          width: 450px;
          height: 450px;
          background: radial-gradient(circle, rgba(124, 93, 249, 0.12) 0%, transparent 70%);
          filter: blur(50px);
          pointer-events: none;
          z-index: 0;
          animation: floatGlow 15s ease-in-out infinite alternate;
        }
        .bg-glow-2 {
          position: fixed;
          bottom: 10%;
          right: 5%;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(247, 37, 133, 0.08) 0%, transparent 70%);
          filter: blur(60px);
          pointer-events: none;
          z-index: 0;
          animation: floatGlow 18s ease-in-out infinite alternate-reverse;
        }

        @keyframes floatGlow {
          0% { transform: translateY(0px) scale(1); }
          100% { transform: translateY(40px) scale(1.1); }
        }

        /* Glassmorphic Navbar */
        .nav-glass {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          z-index: 1000;
          background: rgba(11, 9, 29, 0.65);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          padding: 1.1rem 2.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-sizing: border-box;
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.4);
        }

        .nav-logo {
          display: flex;
          align-items: center;
          gap: 14px;
          text-decoration: none;
        }
        .nav-logo-text {
          font-family: 'Outfit', sans-serif;
          font-size: 1.45rem;
          font-weight: 800;
          background: linear-gradient(135deg, #00f5d4 0%, #7c5df9 50%, #f72585 100%);
          -webkit-background-clip: text;
          -webkit-text-fillColor: transparent;
          background-clip: text;
        }

        .nav-user {
          display: flex;
          align-items: center;
          gap: 1.25rem;
        }
        .nav-email {
          font-size: 0.88rem;
          color: rgba(255, 255, 255, 0.65);
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          padding: 6px 14px;
          border-radius: 99px;
        }

        .btn-logout {
          background: rgba(247, 37, 133, 0.1);
          border: 1px solid rgba(247, 37, 133, 0.25);
          color: #ff3388;
          border-radius: 10px;
          padding: 9px 16px;
          cursor: pointer;
          font-family: inherit;
          font-weight: 600;
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .btn-logout:hover {
          background: #f72585;
          color: white;
          box-shadow: 0 0 15px rgba(247, 37, 133, 0.35);
          transform: translateY(-1px);
        }

        /* Glassmorphic Portal Login Card */
        .login-card {
          width: 100%;
          maxWidth: 440px;
          background: rgba(17, 14, 38, 0.7);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.06);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6), 0 0 40px rgba(124, 93, 249, 0.08);
          border-radius: 28px;
          padding: 3.5rem 2.5rem 2.8rem;
          box-sizing: border-box;
          text-align: center;
          position: relative;
        }

        .login-title {
          font-family: 'Outfit', sans-serif;
          font-size: 2.3rem;
          font-weight: 900;
          letter-spacing: -0.04em;
          margin: 0;
          background: linear-gradient(135deg, #ff007f 0%, #7c5df9 100%);
          -webkit-background-clip: text;
          -webkit-text-fillColor: transparent;
          background-clip: text;
        }

        .form-label {
          font-size: 0.82rem;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.75);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          text-align: left;
          margin-bottom: 0.45rem;
          display: block;
        }

        .form-input {
          width: 100%;
          padding: 0.9rem 1.1rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          color: white;
          font-family: inherit;
          font-size: 0.95rem;
          outline: none;
          box-sizing: border-box;
          transition: all 0.25s ease;
        }
        .form-input:focus {
          border-color: rgba(124, 93, 249, 0.6);
          background: rgba(124, 93, 249, 0.04);
          box-shadow: 0 0 15px rgba(124, 93, 249, 0.15);
        }

        .btn-primary {
          width: 100%;
          padding: 0.95rem;
          background: linear-gradient(135deg, #7c5df9 0%, #9d4edd 100%);
          border: none;
          border-radius: 14px;
          color: white;
          font-family: inherit;
          font-size: 0.98rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 20px rgba(124, 93, 249, 0.25);
        }
        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 25px rgba(124, 93, 249, 0.45);
          filter: brightness(1.1);
        }
        .btn-primary:active:not(:disabled) {
          transform: translateY(0px);
        }

        .btn-google {
          width: 100%;
          padding: 0.92rem;
          background: white;
          border: none;
          border-radius: 14px;
          color: #1f2937;
          font-family: inherit;
          font-size: 0.95rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          transition: all 0.25s ease;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
        }
        .btn-google:hover {
          background: #f3f4f6;
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
        }

        /* Glass Tabs Navigation */
        .tabs-container {
          display: flex;
          justify-content: center;
          gap: 0.5rem;
          background: rgba(255, 255, 255, 0.03);
          padding: 5px;
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          width: fit-content;
          margin: 0 auto 3.5rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          backdrop-filter: blur(10px);
        }
        .tab-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 22px;
          border-radius: 12px;
          border: none;
          background: transparent;
          color: rgba(255, 255, 255, 0.6);
          font-family: inherit;
          font-size: 0.92rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .tab-btn.active {
          background: #7c5df9;
          color: white;
          box-shadow: 0 4px 15px rgba(124, 93, 249, 0.35);
        }
        .tab-btn:hover:not(.active) {
          background: rgba(255, 255, 255, 0.05);
          color: white;
        }

        /* Premium Dashboard Card */
        .dashboard-card {
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 24px;
          padding: 2.2rem;
          box-shadow: 0 10px 30px rgba(0,0,0,0.25);
          box-sizing: border-box;
          transition: border-color 0.3s ease;
        }
        .dashboard-card:hover {
          border-color: rgba(124, 93, 249, 0.2);
        }

        /* Stats Cards */
        .stat-card {
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          padding: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1.2rem;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .stat-card:hover {
          transform: translateY(-3px);
          background: rgba(255, 255, 255, 0.03);
          border-color: rgba(255, 255, 255, 0.08);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.25);
        }

        /* Premium Search Input */
        .search-container {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }
        .search-input {
          width: 100%;
          padding: 0.95rem 1rem 0.95rem 2.8rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 14px;
          color: white;
          font-family: inherit;
          font-size: 0.95rem;
          outline: none;
          box-sizing: border-box;
          transition: all 0.25s ease;
        }
        .search-input:focus {
          border-color: rgba(124, 93, 249, 0.5);
          background: rgba(124, 93, 249, 0.04);
          box-shadow: 0 0 20px rgba(124, 93, 249, 0.15);
        }

        /* SaaS Styled Directory Table */
        .saas-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 0.88rem;
        }
        .saas-table th {
          padding: 1.1rem 1.5rem;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.55);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-size: 0.76rem;
          background: rgba(255, 255, 255, 0.01);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        .saas-table td {
          padding: 1.15rem 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          color: rgba(255, 255, 255, 0.85);
        }
        .saas-table tr {
          transition: background-color 0.15s ease;
        }
        .saas-table tr:hover {
          background-color: rgba(124, 93, 249, 0.025);
        }

        /* Profile avatar icon with gradients */
        .avatar-glow {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 0.78rem;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
        }

        /* Glowing Role Badges */
        .badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 8px;
          font-size: 0.72rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          box-shadow: 0 2px 10px rgba(0,0,0,0.15);
        }
        .badge-admin {
          background: rgba(247, 37, 133, 0.1);
          border: 1px solid rgba(247, 37, 133, 0.25);
          color: #f72585;
          box-shadow: 0 0 12px rgba(247, 37, 133, 0.15);
        }
        .badge-teacher {
          background: rgba(124, 93, 249, 0.1);
          border: 1px solid rgba(124, 93, 249, 0.25);
          color: #9d4edd;
          box-shadow: 0 0 12px rgba(124, 93, 249, 0.15);
        }
        .badge-student {
          background: rgba(0, 245, 212, 0.1);
          border: 1px solid rgba(0, 245, 212, 0.25);
          color: #00f5d4;
          box-shadow: 0 0 12px rgba(0, 245, 212, 0.15);
        }
        .badge-parent {
          background: rgba(251, 188, 5, 0.1);
          border: 1px solid rgba(251, 188, 5, 0.25);
          color: #fbbc05;
          box-shadow: 0 0 12px rgba(251, 188, 5, 0.15);
        }
        .badge-default {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.55);
        }

        /* Image Replace Grid Card */
        .image-card {
          background: rgba(255, 255, 255, 0.01);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 20px;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .image-card:hover {
          transform: translateY(-2px);
          background: rgba(255, 255, 255, 0.02);
          border-color: rgba(124, 93, 249, 0.15);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        }

        .image-preview-box {
          flex: 1;
          background-color: rgba(0,0,0,0.25);
          border: 1px dashed rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          overflow: hidden;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 200px;
          position: relative;
        }

        /* File Upload Picker Styling */
        .file-input-wrapper {
          position: relative;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .file-input-hidden {
          position: absolute;
          left: 0;
          top: 0;
          opacity: 0;
          width: 100%;
          height: 100%;
          cursor: pointer;
        }
        .file-input-label-btn {
          width: 100%;
          box-sizing: border-box;
          padding: 0.8rem 1rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px dashed rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.88rem;
          font-weight: 600;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .file-input-label-btn:hover {
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(124, 93, 249, 0.4);
          color: white;
        }
      `}</style>

      {/* Floating Glow Blobs */}
      <div className="bg-glow-1" />
      <div className="bg-glow-2" />

      {adminUser && (
        /* Glass Navbar only when logged in */
        <nav className="nav-glass">
          <Link href="/" className="nav-logo">
            <img src="/img/logonew.png" alt="OmniAttend AI Logo" style={{ height: "34px" }} />
            <span className="nav-logo-text">Admin Panel</span>
          </Link>
          <div className="nav-user">
            <span className="nav-email">{adminUser.email}</span>
            <button onClick={handleSignOut} className="btn-logout">
              <LogOut size={15} /> Sign out
            </button>
          </div>
        </nav>
      )}

      {/* Main Container */}
      <div style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: adminUser ? "flex-start" : "center",
        padding: adminUser ? "8rem 2rem 4rem" : "1.5rem 1.5rem 3rem",
        boxSizing: "border-box",
        width: "100%",
        position: "relative",
        zIndex: 1
      }}>
        
        {!adminUser ? (
          /* Multi-Step Glass Portal Login Card */
          <div className="login-card">
            {/* Upper Glow */}
            <div style={{
              position: "absolute",
              top: "-150px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "300px",
              height: "200px",
              background: "radial-gradient(ellipse, rgba(124, 93, 249, 0.18) 0%, transparent 70%)",
              pointerEvents: "none"
            }} />

            {/* Heading */}
            <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
              <h1 className="login-title">Admin Portal</h1>
              <p style={{ fontSize: "0.95rem", color: "rgba(255, 255, 255, 0.55)", marginTop: "0.5rem", marginBottom: 0 }}>
                {step === 1 ? "Sign in with credentials" : "Step 2: Verify with Google"}
              </p>
            </div>

            {/* Error Display */}
            {errorMsg && (
              <div style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                padding: "0.95rem 1.1rem",
                backgroundColor: "rgba(247, 37, 133, 0.06)",
                border: "1px solid rgba(247, 37, 133, 0.2)",
                borderRadius: "14px",
                color: "#f72585",
                fontSize: "0.85rem",
                marginBottom: "1.5rem",
                textAlign: "left"
              }}>
                <ShieldAlert size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
                <div>{errorMsg}</div>
              </div>
            )}

            {step === 1 ? (
              /* Step 1 Form */
              <form onSubmit={handleStep1Submit} style={{ display: "flex", flexDirection: "column", gap: "1.35rem" }}>
                <div>
                  <label className="form-label">Username</label>
                  <input
                    type="text"
                    placeholder="admin@example.com"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="form-input"
                  />
                </div>

                <button type="submit" disabled={submitting} className="btn-primary" style={{ marginTop: "1rem" }}>
                  {submitting ? (
                    <Loader2 size={19} style={{ animation: "spin 1s linear infinite" }} />
                  ) : (
                    <>
                      Next Step <ArrowRight size={17} />
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* Step 2 Verify */
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.6rem" }}>
                <p style={{ textAlign: "center", color: "rgba(255, 255, 255, 0.7)", fontSize: "0.96rem", lineHeight: "1.6", margin: 0 }}>
                  To complete the login, please sign in with your associated Google account.
                </p>

                <button onClick={handleGoogleVerify} className="btn-google">
                  <svg width="18" height="18" viewBox="0 0 18 18">
                    <path fill="#EA4335" d="M9 3.6c1.62 0 3.06.56 4.21 1.66l3.15-3.15C14.45.54 11.95 0 9 0 5.48 0 2.44 2.02.94 4.96l3.7 2.87C5.51 5.22 7.11 3.6 9 3.6z"/>
                    <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.47h4.84c-.21 1.09-.82 2.01-1.74 2.62l3.64 2.83c2.13-1.97 3.9-5.17 3.9-9.08z"/>
                    <path fill="#FBBC05" d="M4.64 10.17c-.22-.64-.34-1.32-.34-2.02s.12-1.38.34-2.02l-3.7-2.87C.34 5.2.01 6.55.01 8c0 1.45.33 2.8.93 4.74l3.7-2.57z"/>
                    <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-3.64-2.83c-1.01.68-2.31 1.08-3.9 1.08-3.41 0-6.3-2.3-7.34-5.39l-3.7 2.87C2.44 15.98 5.48 18 9 18z"/>
                  </svg>
                  Continue with Google
                </button>

                <button
                  onClick={() => {
                    setStep(1);
                    setErrorMsg("");
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "rgba(255, 255, 255, 0.45)",
                    fontSize: "0.85rem",
                    textDecoration: "underline",
                    cursor: "pointer",
                    fontFamily: "inherit"
                  }}
                >
                  Back to credentials
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Fully Logged In Admin Dashboard */
          <div style={{ width: "100%", maxWidth: "1200px" }}>
            
            {/* Pill Navigation Tabs */}
            <div className="tabs-container">
              <button
                onClick={() => setActiveTab("images")}
                className={`tab-btn ${activeTab === "images" ? "active" : ""}`}
              >
                <ImageIcon size={17} /> Demo Images
              </button>
              <button
                onClick={() => setActiveTab("users")}
                className={`tab-btn ${activeTab === "users" ? "active" : ""}`}
              >
                <Users size={17} /> Registered Users
              </button>
            </div>

            {activeTab === "images" ? (
              /* Demo Photos Tab */
              <div className="dashboard-card" style={{ animation: "fadeIn 0.4s ease" }}>
                <h1 style={{
                  fontSize: "2rem",
                  fontWeight: 800,
                  textAlign: "center",
                  marginBottom: "3.5rem",
                  letterSpacing: "-0.03em",
                  fontFamily: "Outfit, sans-serif"
                }}>
                  Manage Landing Page Demo Photos
                </h1>
                
                {["Teacher", "Student"].map(type => (
                  <div key={type} style={{ marginBottom: "4rem" }}>
                    <h2 style={{
                      fontFamily: "Outfit, sans-serif",
                      fontSize: "1.7rem",
                      fontWeight: 800,
                      color: "white",
                      marginBottom: "1.8rem",
                      paddingBottom: "0.8rem",
                      borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                      letterSpacing: "-0.02em",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px"
                    }}>
                      <div style={{ width: "8px", height: "18px", borderRadius: "4px", backgroundColor: "#7c5df9" }} />
                      {type} Journey Slides
                    </h2>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(330px, 1fr))", gap: "2rem" }}>
                      {DEMO_IMAGES.filter(img => img.type === type).map((img) => (
                        <div key={img.id} className="image-card">
                          <h3 style={{ fontSize: "1.1rem", marginBottom: "1.1rem", fontWeight: 700, letterSpacing: "-0.01em", opacity: 0.95 }}>
                            {img.title}
                          </h3>

                          {/* Image preview with smooth dashed borders */}
                          <div className="image-preview-box">
                            <img 
                              src={`${img.path}?v=${version}`} 
                              alt={img.title} 
                              style={{ maxWidth: "100%", maxHeight: "200px", objectFit: "contain" }} 
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          </div>

                          <div className="file-input-wrapper">
                            {/* Premium Custom File Input picker */}
                            <label className="file-input-label-btn">
                              <Upload size={15} />
                              Choose New Image
                              <input 
                                type="file" 
                                accept="image/png, image/jpeg, image/webp"
                                ref={(el) => { fileInputRefs.current[img.id] = el; }}
                                className="file-input-hidden"
                                onChange={(e) => {
                                  // Update the label text dynamically when a file is selected
                                  const labelEl = e.currentTarget.parentElement;
                                  const file = e.currentTarget.files?.[0];
                                  if (file && labelEl) {
                                    labelEl.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> Selected: ${file.name.slice(0, 16)}${file.name.length > 16 ? '...' : ''}`;
                                  }
                                }}
                              />
                            </label>

                            <button 
                              onClick={() => handleUpload(img.id, img.path)}
                              disabled={uploading === img.id}
                              className="btn-primary"
                              style={{ padding: "0.8rem", fontSize: "0.9rem" }}
                            >
                              {uploading === img.id ? (
                                <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                              ) : (
                                "Upload Replacement"
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* User Directory Tab */
              <div className="dashboard-card" style={{ animation: "fadeIn 0.4s ease" }}>
                <h1 style={{
                  fontSize: "2rem",
                  fontWeight: 800,
                  textAlign: "center",
                  marginBottom: "2.5rem",
                  letterSpacing: "-0.03em",
                  fontFamily: "Outfit, sans-serif"
                }}>
                  Registered Users Directory
                </h1>
                
                {/* Stats Summary Grid */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "1.5rem",
                  marginBottom: "3.5rem"
                }}>
                  <div className="stat-card">
                    <div style={{ backgroundColor: "rgba(124, 93, 249, 0.1)", padding: "12px", borderRadius: "14px", color: "#7c5df9" }}>
                      <Users size={22} />
                    </div>
                    <div>
                      <div style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.02em", fontFamily: "Outfit, sans-serif" }}>{totalCount}</div>
                      <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.45)", fontWeight: 600 }}>Total Registered</div>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div style={{ backgroundColor: "rgba(247, 37, 133, 0.1)", padding: "12px", borderRadius: "14px", color: "#f72585" }}>
                      <User size={22} />
                    </div>
                    <div>
                      <div style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.02em", fontFamily: "Outfit, sans-serif" }}>{adminCount}</div>
                      <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.45)", fontWeight: 600 }}>Administrators</div>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div style={{ backgroundColor: "rgba(157, 78, 221, 0.1)", padding: "12px", borderRadius: "14px", color: "#9d4edd" }}>
                      <User size={22} />
                    </div>
                    <div>
                      <div style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.02em", fontFamily: "Outfit, sans-serif" }}>{teacherCount}</div>
                      <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.45)", fontWeight: 600 }}>Teachers</div>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div style={{ backgroundColor: "rgba(0, 245, 212, 0.1)", padding: "12px", borderRadius: "14px", color: "#00f5d4" }}>
                      <User size={22} />
                    </div>
                    <div>
                      <div style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.02em", fontFamily: "Outfit, sans-serif" }}>{studentCount}</div>
                      <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.45)", fontWeight: 600 }}>Students</div>
                    </div>
                  </div>
                </div>

                {/* Filter and Search */}
                <div style={{ marginBottom: "2rem" }}>
                  <div className="search-container">
                    <Search size={18} style={{ position: "absolute", left: "14px", color: "rgba(255,255,255,0.3)" }} />
                    <input
                      type="text"
                      placeholder="Filter directory by name, email, phone, or role..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="search-input"
                    />
                  </div>
                </div>

                {/* Users Directory Table Container */}
                <div style={{
                  backgroundColor: "rgba(255,255,255,0.015)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  borderRadius: "20px",
                  overflow: "hidden",
                  boxShadow: "inset 0 0 20px rgba(0,0,0,0.1)"
                }}>
                  {loadingUsers ? (
                    <div style={{ padding: "5rem 0", textAlign: "center" }}>
                      <Loader2 size={32} className="spinner" style={{ display: "inline-block" }} />
                      <p style={{ marginTop: "1.2rem", color: "rgba(255,255,255,0.45)", fontSize: "0.9rem" }}>Fetching directory records...</p>
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div style={{ padding: "5rem 0", textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: "0.95rem" }}>
                      No matching records found.
                    </div>
                  ) : (
                    <div style={{ overflowX: "auto" }}>
                      <table className="saas-table">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Email Address</th>
                            <th>Phone Number</th>
                            <th>Account Role</th>
                            <th>Registration Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredUsers.map((u) => {
                            const hasName = u.firstName || u.lastName;
                            const fullName = hasName ? `${u.firstName || ""} ${u.lastName || ""}` : "Unnamed User";
                            const regDate = u.createdAt ? new Date(u.createdAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            }) : "Unknown";

                            const avatarLetter = (u.firstName || u.email || "U").charAt(0).toUpperCase();

                            return (
                              <tr key={u.id}>
                                <td style={{ fontWeight: 600 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    <div 
                                      className="avatar-glow"
                                      style={{ background: getProfileGradient(u.email) }}
                                    >
                                      {avatarLetter}
                                    </div>
                                    <span style={{ fontSize: "0.92rem" }}>{fullName}</span>
                                  </div>
                                </td>
                                <td>
                                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <Mail size={13} style={{ color: "rgba(255,255,255,0.25)" }} />
                                    <span style={{ opacity: 0.9 }}>{u.email}</span>
                                  </div>
                                </td>
                                <td>
                                  {u.phone ? (
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                      <Phone size={13} style={{ color: "rgba(255,255,255,0.25)" }} />
                                      <span style={{ opacity: 0.9 }}>{u.phone}</span>
                                    </div>
                                  ) : (
                                    <span style={{ opacity: 0.25, fontSize: "0.85rem" }}>N/A</span>
                                  )}
                                </td>
                                <td>
                                  <span className={`badge ${getRoleBadgeClass(u.role)}`}>
                                    {u.role || "N/A"}
                                  </span>
                                </td>
                                <td>
                                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <Calendar size={13} style={{ color: "rgba(255,255,255,0.25)" }} />
                                    <span style={{ opacity: 0.75 }}>{regDate}</span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
