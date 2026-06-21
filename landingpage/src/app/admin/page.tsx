"use client";

import { useState, useEffect, useRef } from "react";
import { LogOut, ArrowRight, Loader2, ShieldAlert, Image, Users, Search, Calendar, Phone, Mail, User } from "lucide-react";
import styles from "../page.module.css";
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

  const getRoleBadgeStyle = (role: string) => {
    const cleanRole = (role || "").toUpperCase();
    if (cleanRole === "ADMIN") {
      return {
        background: "rgba(247, 37, 133, 0.08)",
        border: "1px solid rgba(247, 37, 133, 0.22)",
        color: "#f72585",
      };
    } else if (cleanRole === "TEACHER") {
      return {
        background: "rgba(124, 93, 249, 0.08)",
        border: "1px solid rgba(124, 93, 249, 0.22)",
        color: "#9d4edd",
      };
    } else if (cleanRole === "STUDENT") {
      return {
        background: "rgba(0, 245, 212, 0.08)",
        border: "1px solid rgba(0, 245, 212, 0.22)",
        color: "#00f5d4",
      };
    } else if (cleanRole === "PARENT") {
      return {
        background: "rgba(251, 188, 5, 0.08)",
        border: "1px solid rgba(251, 188, 5, 0.22)",
        color: "#fbbc05",
      };
    }
    return {
      background: "rgba(255, 255, 255, 0.04)",
      border: "1px solid rgba(255, 255, 255, 0.08)",
      color: "rgba(255, 255, 255, 0.55)",
    };
  };

  if (loadingAdmin) {
    return (
      <div style={{
        minHeight: "100vh",
        backgroundColor: "#080718",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white"
      }}>
        <Loader2 size={36} className={styles.loadingSpinner} style={{ animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  // Admin Login Multi-Step Form
  if (!adminUser) {
    return (
      <div style={{
        minHeight: "100vh",
        backgroundColor: "#070617",
        backgroundImage: "radial-gradient(circle at center, #130f30 0%, #060512 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
        color: "white",
        fontFamily: "Inter, system-ui, sans-serif"
      }}>
        <div style={{
          width: "100%",
          maxWidth: "460px",
          backgroundColor: "#110f24",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 40px rgba(124, 93, 249, 0.1)",
          borderRadius: "24px",
          padding: "3rem 2.5rem 2.5rem",
          boxSizing: "border-box",
          position: "relative",
          overflow: "hidden"
        }}>
          {/* Subtle glow effect */}
          <div style={{
            position: "absolute",
            top: "-150px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "300px",
            height: "200px",
            background: "radial-gradient(ellipse, rgba(124, 93, 249, 0.15) 0%, transparent 70%)",
            pointerEvents: "none"
          }} />

          {/* Heading */}
          <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <h1 style={{
              fontSize: "2.25rem",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              margin: 0,
              background: "linear-gradient(135deg, #da70f2 0%, #7c5df9 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text"
            }}>
              Admin Portal
            </h1>
            <p style={{
              fontSize: "0.95rem",
              color: "rgba(255, 255, 255, 0.6)",
              marginTop: "0.5rem",
              marginBottom: 0
            }}>
              {step === 1 ? "Sign in with credentials" : "Step 2: Verify with Google"}
            </p>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              padding: "1rem",
              backgroundColor: "rgba(247, 37, 133, 0.07)",
              border: "1px solid rgba(247, 37, 133, 0.2)",
              borderRadius: "12px",
              color: "#f72585",
              fontSize: "0.85rem",
              marginBottom: "1.5rem"
            }}>
              <ShieldAlert size={18} style={{ flexShrink: 0, marginTop: "1px" }} />
              <div>{errorMsg}</div>
            </div>
          )}

          {step === 1 ? (
            /* Step 1: Credentials Form */
            <form onSubmit={handleStep1Submit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "rgba(255, 255, 255, 0.8)" }}>
                  Username
                </label>
                <input
                  type="text"
                  placeholder="admin@example.com"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "0.85rem 1rem",
                    backgroundColor: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "12px",
                    color: "white",
                    fontSize: "0.95rem",
                    outline: "none",
                    boxSizing: "border-box"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "rgba(124, 93, 249, 0.6)"}
                  onBlur={(e) => e.target.style.borderColor = "rgba(255, 255, 255, 0.1)"}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "rgba(255, 255, 255, 0.8)" }}>
                  Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "0.85rem 1rem",
                    backgroundColor: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "12px",
                    color: "white",
                    fontSize: "0.95rem",
                    outline: "none",
                    boxSizing: "border-box"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "rgba(124, 93, 249, 0.6)"}
                  onBlur={(e) => e.target.style.borderColor = "rgba(255, 255, 255, 0.1)"}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  marginTop: "1rem",
                  padding: "0.9rem",
                  backgroundColor: "#7c5df9",
                  border: "none",
                  borderRadius: "12px",
                  color: "white",
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  cursor: submitting ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "opacity 0.2s"
                }}
              >
                {submitting ? (
                  <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
                ) : (
                  <>
                    Next Step <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Step 2: Google Verification Form */
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem" }}>
              <p style={{
                textAlign: "center",
                color: "rgba(255, 255, 255, 0.7)",
                fontSize: "0.95rem",
                lineHeight: "1.5",
                margin: 0
              }}>
                To complete the login, please sign in with your associated Google account.
              </p>

              <button
                onClick={handleGoogleVerify}
                style={{
                  width: "100%",
                  padding: "0.85rem",
                  backgroundColor: "white",
                  border: "none",
                  borderRadius: "12px",
                  color: "#1f2937",
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "12px",
                  transition: "background-color 0.2s"
                }}
              >
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
                  cursor: "pointer"
                }}
              >
                Back to credentials
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Fully Logged In Admin Dashboard
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--background)", color: "white", fontFamily: "Inter, sans-serif" }}>
      <nav className="navbar" style={{ position: "fixed", top: 0, width: "100%", zIndex: 1000 }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none" }}>
          <img src="/img/logonew.png" alt="OmniAttend AI Logo" style={{ height: "32px" }} />
          <div className="brand-font text-gradient" style={{ fontSize: "1.5rem", fontWeight: 700 }}>Admin Panel</div>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.6)" }}>{adminUser.email} (Admin)</span>
          <button
            onClick={handleSignOut}
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              color: "rgba(255,255,255,0.6)",
              padding: "9px 14px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "0.85rem",
              transition: "all 0.2s"
            }}
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </nav>

      <main style={{ padding: "8rem 2rem 4rem", maxWidth: "1200px", margin: "0 auto" }}>
        
        {/* Navigation Tabs */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          gap: "1rem",
          marginBottom: "3rem",
          background: "rgba(255, 255, 255, 0.03)",
          padding: "6px",
          borderRadius: "14px",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          width: "fit-content",
          margin: "0 auto 3rem"
        }}>
          <button
            onClick={() => setActiveTab("images")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
              borderRadius: "10px",
              border: "none",
              background: activeTab === "images" ? "#7c5df9" : "transparent",
              color: activeTab === "images" ? "white" : "rgba(255, 255, 255, 0.6)",
              fontSize: "0.95rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            <Image size={18} /> Demo Images
          </button>
          <button
            onClick={() => setActiveTab("users")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
              borderRadius: "10px",
              border: "none",
              background: activeTab === "users" ? "#7c5df9" : "transparent",
              color: activeTab === "users" ? "white" : "rgba(255, 255, 255, 0.6)",
              fontSize: "0.95rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            <Users size={18} /> Registered Users
          </button>
        </div>

        {activeTab === "images" ? (
          /* Demo Photos Tab */
          <div>
            <h1 className={styles.sectionTitle} style={{ textAlign: "center", marginBottom: "3rem" }}>Manage Demo Photos</h1>
            
            {["Teacher", "Student"].map(type => (
              <div key={type} style={{ marginBottom: "4rem" }}>
                <h2 className="brand-font" style={{ fontSize: "2rem", marginBottom: "1.5rem", paddingBottom: "1rem", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>{type} Journey Images</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "2rem" }}>
                  {DEMO_IMAGES.filter(img => img.type === type).map((img) => (
                    <div key={img.id} className={styles.featureCard} style={{ display: "flex", flexDirection: "column" }}>
                      <h3 style={{ fontSize: "1.2rem", marginBottom: "1rem", fontWeight: 600 }}>{img.title}</h3>
                      <div style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.3)", borderRadius: "12px", overflow: "hidden", marginBottom: "1.5rem", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "200px" }}>
                        <img 
                          src={`${img.path}?v=${version}`} 
                          alt={img.title} 
                          style={{ maxWidth: "100%", maxHeight: "200px", objectFit: "contain" }} 
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        <input 
                          type="file" 
                          accept="image/png, image/jpeg, image/webp"
                          ref={(el) => { fileInputRefs.current[img.id] = el; }}
                          style={{ fontSize: "0.9rem" }}
                        />
                        <button 
                          className={styles.ctaPrimary} 
                          onClick={() => handleUpload(img.id, img.path)}
                          disabled={uploading === img.id}
                          style={{ padding: "0.75rem", fontSize: "0.95rem", justifyContent: "center" }}
                        >
                          {uploading === img.id ? "Uploading..." : "Upload Replacement"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* User Management Tab */
          <div>
            <h1 className={styles.sectionTitle} style={{ textAlign: "center", marginBottom: "2rem" }}>Registered Users Directory</h1>
            
            {/* Statistics Row */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "1.5rem",
              marginBottom: "3.5rem"
            }}>
              <div style={{
                backgroundColor: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.06)",
                borderRadius: "16px",
                padding: "1.5rem",
                display: "flex",
                alignItems: "center",
                gap: "1rem"
              }}>
                <div style={{ backgroundColor: "rgba(124, 93, 249, 0.1)", padding: "12px", borderRadius: "12px", color: "#7c5df9" }}>
                  <Users size={24} />
                </div>
                <div>
                  <div style={{ fontSize: "1.75rem", fontWeight: 800 }}>{totalCount}</div>
                  <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)" }}>Total Registered</div>
                </div>
              </div>

              <div style={{
                backgroundColor: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.06)",
                borderRadius: "16px",
                padding: "1.5rem",
                display: "flex",
                alignItems: "center",
                gap: "1rem"
              }}>
                <div style={{ backgroundColor: "rgba(247, 37, 133, 0.1)", padding: "12px", borderRadius: "12px", color: "#f72585" }}>
                  <User size={24} />
                </div>
                <div>
                  <div style={{ fontSize: "1.75rem", fontWeight: 800 }}>{adminCount}</div>
                  <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)" }}>Administrators</div>
                </div>
              </div>

              <div style={{
                backgroundColor: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.06)",
                borderRadius: "16px",
                padding: "1.5rem",
                display: "flex",
                alignItems: "center",
                gap: "1rem"
              }}>
                <div style={{ backgroundColor: "rgba(157, 78, 221, 0.1)", padding: "12px", borderRadius: "12px", color: "#9d4edd" }}>
                  <User size={24} />
                </div>
                <div>
                  <div style={{ fontSize: "1.75rem", fontWeight: 800 }}>{teacherCount}</div>
                  <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)" }}>Teachers</div>
                </div>
              </div>

              <div style={{
                backgroundColor: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.06)",
                borderRadius: "16px",
                padding: "1.5rem",
                display: "flex",
                alignItems: "center",
                gap: "1rem"
              }}>
                <div style={{ backgroundColor: "rgba(0, 245, 212, 0.1)", padding: "12px", borderRadius: "12px", color: "#00f5d4" }}>
                  <User size={24} />
                </div>
                <div>
                  <div style={{ fontSize: "1.75rem", fontWeight: 800 }}>{studentCount}</div>
                  <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)" }}>Students</div>
                </div>
              </div>
            </div>

            {/* Filter Card */}
            <div style={{
              backgroundColor: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "20px",
              padding: "1.5rem",
              marginBottom: "2rem"
            }}>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <Search size={18} style={{ position: "absolute", left: "14px", color: "rgba(255,255,255,0.3)" }} />
                <input
                  type="text"
                  placeholder="Filter users by name, email, role, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.9rem 1rem 0.9rem 2.8rem",
                    backgroundColor: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "12px",
                    color: "white",
                    fontSize: "0.95rem",
                    outline: "none",
                    boxSizing: "border-box"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "rgba(124, 93, 249, 0.5)"}
                  onBlur={(e) => e.target.style.borderColor = "rgba(255, 255, 255, 0.08)"}
                />
              </div>
            </div>

            {/* Users Directory Table */}
            <div style={{
              backgroundColor: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "20px",
              overflow: "hidden"
            }}>
              {loadingUsers ? (
                <div style={{ padding: "4rem", textAlign: "center" }}>
                  <Loader2 size={30} className={styles.loadingSpinner} style={{ animation: "spin 1s linear infinite", display: "inline-block" }} />
                  <p style={{ marginTop: "1rem", color: "rgba(255,255,255,0.5)" }}>Fetching users list...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div style={{ padding: "4rem", textAlign: "center", color: "rgba(255,255,255,0.5)" }}>
                  No users found matching your filter criteria.
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.9rem" }}>
                    <thead>
                      <tr style={{ backgroundColor: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                        <th style={{ padding: "1.2rem 1.5rem", fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>Name</th>
                        <th style={{ padding: "1.2rem 1.5rem", fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>Email</th>
                        <th style={{ padding: "1.2rem 1.5rem", fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>Phone</th>
                        <th style={{ padding: "1.2rem 1.5rem", fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>Role</th>
                        <th style={{ padding: "1.2rem 1.5rem", fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>Registered On</th>
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

                        return (
                          <tr key={u.id} style={{
                            borderBottom: "1px solid rgba(255,255,255,0.04)",
                            transition: "background-color 0.15s"
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(124, 93, 249, 0.03)"}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                          >
                            <td style={{ padding: "1.2rem 1.5rem", fontWeight: 600 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <div style={{
                                  backgroundColor: "rgba(255,255,255,0.06)",
                                  padding: "8px",
                                  borderRadius: "50%",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: "rgba(255,255,255,0.6)"
                                }}>
                                  <User size={16} />
                                </div>
                                <span>{fullName}</span>
                              </div>
                            </td>
                            <td style={{ padding: "1.2rem 1.5rem", color: "rgba(255,255,255,0.85)" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <Mail size={14} style={{ color: "rgba(255,255,255,0.3)" }} />
                                <span>{u.email}</span>
                              </div>
                            </td>
                            <td style={{ padding: "1.2rem 1.5rem", color: "rgba(255,255,255,0.8)" }}>
                              {u.phone ? (
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                  <Phone size={14} style={{ color: "rgba(255,255,255,0.3)" }} />
                                  <span>{u.phone}</span>
                                </div>
                              ) : (
                                <span style={{ opacity: 0.35, fontSize: "0.85rem" }}>N/A</span>
                              )}
                            </td>
                            <td style={{ padding: "1.2rem 1.5rem" }}>
                              <span style={{
                                display: "inline-block",
                                padding: "4px 10px",
                                borderRadius: "8px",
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                textTransform: "uppercase",
                                ...getRoleBadgeStyle(u.role)
                              }}>
                                {u.role || "N/A"}
                              </span>
                            </td>
                            <td style={{ padding: "1.2rem 1.5rem", color: "rgba(255,255,255,0.6)" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <Calendar size={14} style={{ color: "rgba(255,255,255,0.3)" }} />
                                <span>{regDate}</span>
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
      </main>
    </div>
  );
}
