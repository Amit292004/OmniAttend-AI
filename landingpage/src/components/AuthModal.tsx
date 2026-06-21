"use client";

import { useState, useRef, KeyboardEvent, ClipboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Eye, EyeOff, Loader2, CheckCircle, AlertCircle, User, Phone, ChevronDown, ArrowLeft, Shield, ShieldCheck } from "lucide-react";
import styles from "./AuthModal.module.css";
import { useAuth } from "@/contexts/AuthContext";

type Mode = "signin" | "signup" | "forgot" | "verify";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<Mode>("signin");

  // Form fields
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [showPass, setShowPass]   = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName]   = useState("");
  const [phone, setPhone]         = useState("");
  const [role, setRole]           = useState("");

  // OTP
  const [otp, setOtp]             = useState(["", "", "", "", "", ""]);
  const otpRefs                   = useRef<(HTMLInputElement | null)[]>([]);
  const [otpToken, setOtpToken]   = useState(""); // Added for stateless OTP
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState("");

  const { refreshUser } = useAuth();

  const [loading, setLoading]           = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const reset = () => {
    setEmail(""); setPassword(""); setConfirm(""); setShowPass(false);
    setFirstName(""); setLastName(""); setPhone(""); setRole("");
    setOtp(["", "", "", "", "", ""]); setOtpToken(""); setMsg(null); setLoading(false);
    setResendMsg("");
  };

  const switchMode = (m: Mode) => { setMode(m); reset(); };

  // ── Google ──
  const handleGoogleAuth = async () => {
    window.location.href = '/api/auth/google';
  };

  // ── Signup / Signin / Forgot ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    if (mode === "signup") {
      if (password !== confirm) {
        setMsg({ type: "error", text: "Passwords do not match." });
        setLoading(false); return;
      }
      if (!role) {
        setMsg({ type: "error", text: "Please select your role." });
        setLoading(false); return;
      }

      // 1. Call our custom API to send the OTP via nodemailer
      try {
        const res = await fetch('/api/auth/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
        
        // Save the stateless JWT token
        setOtpToken(data.token);
        
        // Move to OTP verification screen
        setMode("verify");
        setMsg(null);
      } catch (err: any) {
        setMsg({ type: "error", text: err.message });
      }

    } else if (mode === "signin") {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to sign in');

        setMsg({ type: "success", text: "Signed in successfully!" });
        await refreshUser();
        setTimeout(() => onClose(), 1200);
      } catch (err: any) {
        setMsg({ type: "error", text: err.message });
      }

    } else if (mode === "forgot") {
      // Logic for password reset...
    }
    setLoading(false);
  };

  // ── OTP input handlers ──
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // digits only
    const updated = [...otp];
    updated[index] = value.slice(-1);
    setOtp(updated);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      otpRefs.current[5]?.focus();
    }
  };

  // ── Verify OTP ──
  const handleVerifyOtp = async () => {
    const tokenStr = otp.join("");
    if (tokenStr.length < 6) {
      setMsg({ type: "error", text: "Please enter all 6 digits." });
      return;
    }
    setLoading(true);
    setMsg(null);

    try {
      // 1. Verify the OTP against our custom API (this also creates the user now!)
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          otp: tokenStr, 
          token: otpToken,
          password,
          firstName,
          lastName,
          phone,
          role
        }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Invalid OTP');

      // Refresh the context so the user is logged in
      await refreshUser();

      setMsg({ type: "success", text: "✅ Email verified! Signing you in…" });
      setTimeout(() => onClose(), 1200);

    } catch (err: any) {
      console.error("Verification caught error:", err);
      let errorText = err.message || "An unexpected error occurred.";
      if (errorText === "{}" || errorText === "[object Object]") {
        errorText = "A server error occurred while creating your account. Please check your Supabase logs.";
      }
      setMsg({ type: "error", text: errorText });
    }
    setLoading(false);
  };

  // ── Resend OTP ──
  const handleResend = async () => {
    setResendLoading(true);
    setResendMsg("");
    setMsg(null); // Clear any existing error messages
    setOtp(["", "", "", "", "", ""]); // Clear the input boxes for the new OTP
    
    // Focus the first box
    if (otpRefs.current[0]) {
      otpRefs.current[0].focus();
    }

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error();
      setOtpToken(data.token);
      setResendMsg("OTP resent to your email!");
    } catch {
      setResendMsg("Failed to resend. Try again.");
    }
    setResendLoading(false);
  };

  const titles: Record<Mode, string> = {
    signin: "Welcome Back", signup: "Create Account",
    forgot: "Reset Password", verify: "Verify Email",
  };
  const subs: Record<Mode, string> = {
    signin: "Sign in to access OmniAttend AI",
    signup: "Start taking AI-powered attendance today",
    forgot: "We'll send a reset link to your email",
    verify: `Enter the 6-digit OTP sent to`,
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className={styles.modal}
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
          >
            <button className={styles.closeBtn} onClick={onClose}><X size={18} /></button>

            {/* Logo */}
            <div className={styles.logoRow}>
              <img src="/img/logonew.png" alt="logo" className={styles.logoImg} />
              <span className={styles.logoText}>OmniAttend AI</span>
            </div>

            {/* ════════════════════════════════
                OTP VERIFICATION SCREEN
            ════════════════════════════════ */}
            {mode === "verify" ? (
              <motion.div
                key="verify"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className={styles.otpIcon}>
                  <ShieldCheck size={36} />
                </div>
                <h2 className={styles.title}>Verify Email</h2>
                <p className={styles.subtitle}>
                  We sent a 6-digit OTP to<br />
                  <strong style={{ color: "#c77dff" }}>{email}</strong>
                </p>

                {/* 6 OTP boxes */}
                <div className={styles.otpGrid}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      className={`${styles.otpBox} ${digit ? styles.otpBoxFilled : ""}`}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      onPaste={handleOtpPaste}
                      autoFocus={i === 0}
                    />
                  ))}
                </div>

                <AnimatePresence>
                  {msg && (
                    <motion.div
                      className={`${styles.message} ${styles[msg.type]}`}
                      initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    >
                      {msg.type === "success" ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                      {msg.text}
                    </motion.div>
                  )}
                </AnimatePresence>

                <button className={styles.submitBtn} onClick={handleVerifyOtp} disabled={loading} style={{ marginTop: "1rem" }}>
                  {loading ? <Loader2 size={17} className={styles.spin} /> : "Verify & Sign In"}
                </button>

                <div className={styles.otpFooter}>
                  <span>Didn&apos;t receive it?</span>
                  <button onClick={handleResend} disabled={resendLoading} className={styles.resendBtn}>
                    {resendLoading ? "Sending…" : "Resend OTP"}
                  </button>
                </div>
                {resendMsg && <p className={styles.resendNote}>{resendMsg}</p>}

                <button className={styles.backLink} onClick={() => switchMode("signup")}>
                  <ArrowLeft size={14} /> Back to signup
                </button>
              </motion.div>

            ) : (
              /* ════════════════════════════════
                 MAIN FORM (signin/signup/forgot)
              ════════════════════════════════ */
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h2 className={styles.title}>{titles[mode]}</h2>
                <p className={styles.subtitle}>{subs[mode]}</p>

                <form className={styles.form} onSubmit={handleSubmit}>
                  {mode === "signup" && (
                    <>
                      <div className={styles.row}>
                        <div className={styles.field}>
                          <label>First Name</label>
                          <div className={styles.inputWrap}>
                            <User size={14} className={styles.inputIcon} />
                            <input type="text" placeholder="Amit" value={firstName} onChange={e => setFirstName(e.target.value)} required autoComplete="given-name" />
                          </div>
                        </div>
                        <div className={styles.field}>
                          <label>Last Name</label>
                          <div className={styles.inputWrap}>
                            <User size={14} className={styles.inputIcon} />
                            <input type="text" placeholder="Sharma" value={lastName} onChange={e => setLastName(e.target.value)} required autoComplete="family-name" />
                          </div>
                        </div>
                      </div>

                      <div className={styles.field}>
                        <label>Phone Number</label>
                        <div className={styles.inputWrap}>
                          <Phone size={14} className={styles.inputIcon} />
                          <input type="tel" placeholder="+91 98765 43210" value={phone} onChange={e => setPhone(e.target.value)} required autoComplete="tel" />
                        </div>
                      </div>

                      <div className={styles.field}>
                        <label>I am a…</label>
                        <div className={styles.selectWrap}>
                          <select value={role} onChange={e => setRole(e.target.value)} className={`${styles.select} ${!role ? styles.selectPlaceholder : ""}`} required>
                            <option value="" disabled>Select your role</option>
                            <option value="student">🎓 Student</option>
                            <option value="teacher">📚 Teacher</option>
                            <option value="other">👤 Other</option>
                          </select>
                          <ChevronDown size={15} className={styles.selectIcon} />
                        </div>
                      </div>
                    </>
                  )}

                  <div className={styles.field}>
                    <label>Email Address</label>
                    <div className={styles.inputWrap}>
                      <Mail size={14} className={styles.inputIcon} />
                      <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
                    </div>
                  </div>

                  {mode !== "forgot" && (
                    <div className={styles.field}>
                      <label>Password</label>
                      <div className={styles.inputWrap}>
                        <input type={showPass ? "text" : "password"} placeholder="Min 6 characters" value={password} onChange={e => setPassword(e.target.value)} required autoComplete={mode === "signup" ? "new-password" : "current-password"} style={{ paddingLeft: "1rem" }} />
                        <button type="button" className={styles.eyeBtn} onClick={() => setShowPass(v => !v)}>
                          {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>
                  )}

                  {mode === "signup" && (
                    <div className={styles.field}>
                      <label>Confirm Password</label>
                      <div className={styles.inputWrap}>
                        <input type={showPass ? "text" : "password"} placeholder="Re-enter password" value={confirm} onChange={e => setConfirm(e.target.value)} required autoComplete="new-password" style={{ paddingLeft: "1rem" }} />
                      </div>
                    </div>
                  )}

                  {mode === "signin" && (
                    <button type="button" className={styles.forgotLink} onClick={() => switchMode("forgot")}>Forgot password?</button>
                  )}

                  <AnimatePresence>
                    {msg && (
                      <motion.div className={`${styles.message} ${styles[msg.type]}`} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        {msg.type === "success" ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                        {msg.text}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button type="submit" className={styles.submitBtn} disabled={loading}>
                    {loading
                      ? <Loader2 size={17} className={styles.spin} />
                      : mode === "signin" ? "Sign In"
                      : mode === "signup" ? "Create Account & Verify →"
                      : "Send Reset Link"}
                  </button>
                </form>

                <div className={styles.divider}><span>or</span></div>

                <button type="button" className={styles.googleBtn} onClick={handleGoogleAuth} disabled={googleLoading}>
                  {googleLoading ? <Loader2 size={19} className={styles.spin} /> : <GoogleIcon />}
                  {googleLoading ? "Redirecting…" : mode === "signin" ? "Sign in with Google" : "Continue with Google"}
                </button>

                <div className={styles.footerLinks}>
                  {mode === "signin"  && <p>Don&apos;t have an account? <button onClick={() => switchMode("signup")}>Create one</button></p>}
                  {mode === "signup"  && <p>Already have an account? <button onClick={() => switchMode("signin")}>Sign in</button></p>}
                  {mode === "forgot"  && <p>Remembered it? <button onClick={() => switchMode("signin")}>Back to sign in</button></p>}
                </div>
              </motion.div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
