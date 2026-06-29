"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Mail, Lock, User, Phone, ShieldCheck, RefreshCw, CheckCircle2, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GlassCard } from "@/components/shared/GlassCard";

type Mode = "login" | "register";
type RegStep = "form" | "otp" | "done";

export default function TeacherLogin() {
  const [mode, setMode] = useState<Mode>("login");
  const [regStep, setRegStep] = useState<RegStep>("form");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  }, []);

  // Registration form data held in state so it survives the OTP step
  const [regForm, setRegForm] = useState({
    username: "", name: "", email: "", phone: "", password: ""
  });
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [registering, setRegistering] = useState(false);

  const resetToLogin = () => {
    setMode("login");
    setRegStep("form");
    setErrorMsg("");
    setSuccessMsg("");
    setOtp(["", "", "", "", "", ""]);
    setRegForm({ username: "", name: "", email: "", phone: "", password: "" });
  };

  // ── Login ────────────────────────────────────────────────────
  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(""); setSuccessMsg("");
    const formData = new FormData(e.currentTarget);
    try {
      const res = await fetch("http://localhost:8000/api/auth/teacher/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.get("username"),
          password: formData.get("password")
        })
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        window.location.href = "/portal/dashboard/teacher";
      } else {
        const errData = await res.json();
        setErrorMsg(errData.detail || "Invalid credentials");
      }
    } catch {
      setErrorMsg("Login failed. Could not connect to server.");
    }
  };

  // ── OTP Handlers ─────────────────────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const updated = [...otp];
    updated[index] = value.slice(-1);
    setOtp(updated);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      otpRefs.current[5]?.focus();
    }
  };

  // ── Step 1: Send OTP ─────────────────────────────────────────
  const handleSendOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(""); setSendingOtp(true);
    const fd = new FormData(e.currentTarget);
    const newForm = {
      username: fd.get("username") as string,
      name: fd.get("name") as string,
      email: fd.get("email") as string,
      phone: fd.get("phone") as string,
      password: fd.get("password") as string,
    };
    setRegForm(newForm);

    try {
      const res = await fetch("http://localhost:8000/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newForm.email, name: newForm.name })
      });
      if (res.ok) {
        setRegStep("otp");
      } else {
        const err = await res.json();
        setErrorMsg(err.detail || "Failed to send OTP. Check your email address.");
      }
    } catch {
      setErrorMsg("Could not connect to server. Please try again.");
    } finally {
      setSendingOtp(false);
    }
  };

  // ── Resend OTP ────────────────────────────────────────────────
  const handleResendOtp = async () => {
    setErrorMsg(""); setSendingOtp(true);
    try {
      const res = await fetch("http://localhost:8000/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: regForm.email, name: regForm.name })
      });
      if (res.ok) {
        setSuccessMsg("New OTP sent! Check your inbox.");
      } else {
        const err = await res.json();
        setErrorMsg(err.detail || "Failed to resend OTP.");
      }
    } catch {
      setErrorMsg("Could not connect to server.");
    } finally {
      setSendingOtp(false);
    }
  };

  // ── Step 2: Verify OTP → Register ────────────────────────────
  const handleVerifyAndRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(""); setVerifyingOtp(true);
    const otpValue = otp.join("");

    try {
      // 1. Verify OTP
      const verRes = await fetch("http://localhost:8000/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: regForm.email, otp: otpValue })
      });
      if (!verRes.ok) {
        const err = await verRes.json();
        setErrorMsg(err.detail || "Invalid OTP. Please try again.");
        setVerifyingOtp(false);
        return;
      }

      // 2. Create account
      setVerifyingOtp(false);
      setRegistering(true);
      const regRes = await fetch("http://localhost:8000/api/auth/teacher/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(regForm)
      });
      if (regRes.ok) {
        const data = await regRes.json();
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setRegStep("done");
        setTimeout(() => { window.location.href = "/portal/dashboard/teacher"; }, 1500);
      } else {
        const err = await regRes.json();
        setErrorMsg(err.detail || "Registration failed.");
      }
    } catch {
      setErrorMsg("Server error. Please try again.");
    } finally {
      setVerifyingOtp(false);
      setRegistering(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
      
      <div className="w-full max-w-md z-10 px-6 py-12 relative">
        {/* Vercel Glow Aura directly behind the card */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[60%] bg-gradient-to-tr from-primary via-purple-500 to-blue-500 rounded-full blur-[100px] opacity-40 z-0" />

        <div className="flex justify-center mb-8 relative z-10">
          <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Portal
          </Link>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative z-10">
          <GlassCard className="p-8">

            {/* Header */}
            <div className="flex flex-col items-center text-center mb-6">
              <Image src="/logo.png" alt="OmniAttend AI" width={48} height={48} className="rounded-xl shadow-lg mb-4" />
              <h1 className="text-2xl font-bold tracking-tight">Welcome, Teacher</h1>
              <p className="text-sm text-muted-foreground mt-2">
                Sign in to your account<br />or create one if you're new.
              </p>
            </div>

            {/* Mode Tabs — hidden on OTP / done steps */}
            {regStep === "form" && (
              <div className="flex bg-[#0a0a0a] p-1 rounded-lg border border-[#222] mb-8 relative">
                <div 
                  className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-[#222] rounded-md transition-all duration-200 ease-out ${mode === "login" ? "left-1" : "left-[calc(50%+2px)]"}`} 
                />
                <button
                  className={`relative flex-1 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 z-10 ${mode === "login" ? "text-white" : "text-neutral-400 hover:text-neutral-200"}`}
                  onClick={() => { setMode("login"); setErrorMsg(""); setSuccessMsg(""); }}
                >Login</button>
                <button
                  className={`relative flex-1 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 z-10 ${mode === "register" ? "text-white" : "text-neutral-400 hover:text-neutral-200"}`}
                  onClick={() => { setMode("register"); setErrorMsg(""); setSuccessMsg(""); }}
                >Register</button>
              </div>
            )}

            {/* Messages */}
            {errorMsg && (
              <div className="bg-error/10 border border-error/20 text-error text-sm p-3 rounded-lg mb-4 text-center">{errorMsg}</div>
            )}
            {successMsg && (
              <div className="bg-success/10 border border-success/20 text-success text-sm p-3 rounded-lg mb-4 text-center">{successMsg}</div>
            )}

            <AnimatePresence mode="wait">

              {/* ── LOGIN FORM ── */}
              {mode === "login" && regStep === "form" && (
                <motion.form key="login" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                  className="space-y-4" onSubmit={handleLoginSubmit}>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email / Username</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input type="text" name="username" placeholder="teacher@university.edu" className="pl-10" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input type="password" name="password" placeholder="••••••••" className="pl-10" required />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Link href="#" className="text-xs text-primary hover:underline">Forgot Password?</Link>
                  </div>
                  <Button type="submit" className="w-full h-12 text-base">Login</Button>
                </motion.form>
              )}

              {/* ── REGISTER STEP 1: FORM ── */}
              {mode === "register" && regStep === "form" && (
                <motion.form key="reg-form" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                  className="space-y-4" onSubmit={handleSendOtp}>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Username</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input type="text" name="username" placeholder="amit_teacher" className="pl-10" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input type="text" name="name" placeholder="Amit Sharma" className="pl-10" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input type="email" name="email" placeholder="teacher@university.edu" className="pl-10" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input type="text" name="phone" placeholder="+91 98765 43210" className="pl-10" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input type="password" name="password" placeholder="••••••••" className="pl-10" required minLength={6} />
                    </div>
                  </div>

                  <Button type="submit" disabled={sendingOtp} className="w-full h-12 text-base bg-secondary hover:bg-secondary/90">
                    {sendingOtp ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending OTP…</> : <>Continue & Verify Email →</>}
                  </Button>
                </motion.form>
              )}

              {/* ── REGISTER STEP 2: OTP ── */}
              {regStep === "otp" && (
                <motion.div key="otp-step" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="space-y-6">
                  <div className="text-center p-4 rounded-xl bg-primary/5 border border-primary/10">
                    <ShieldCheck className="w-10 h-10 text-primary mx-auto mb-2" />
                    <p className="text-sm font-medium">Verify Your Email</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      We sent a 6-digit code to <span className="text-foreground font-medium">{regForm.email}</span>
                    </p>
                  </div>

                  <form onSubmit={handleVerifyAndRegister} className="space-y-6">
                    <div className="space-y-3 text-center">
                      <label className="text-sm font-medium text-muted-foreground">6-Digit OTP Code</label>
                      <div className="flex justify-center gap-2 sm:gap-3">
                        {otp.map((digit, i) => (
                          <input
                            key={i}
                            ref={el => { otpRefs.current[i] = el; }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={e => { handleOtpChange(i, e.target.value); setErrorMsg(""); }}
                            onKeyDown={e => handleOtpKeyDown(i, e)}
                            onPaste={handleOtpPaste}
                            autoFocus={i === 0}
                            className={`w-11 h-12 sm:w-12 sm:h-14 rounded-xl border-2 text-center text-xl font-bold bg-black/20 text-foreground outline-none transition-all shadow-inner
                              ${digit ? "border-white/40" : "border-white/10"}
                              focus:border-primary focus:bg-primary/5 focus:ring-4 focus:ring-primary/20 focus:-translate-y-0.5`}
                            required
                          />
                        ))}
                      </div>
                    </div>
                    <Button type="submit" disabled={otp.join("").length !== 6 || verifyingOtp || registering} className="w-full h-12 text-base">
                      {verifyingOtp ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying…</>
                        : registering ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating Account…</>
                        : "Verify & Create Account"}
                    </Button>
                  </form>

                  <div className="flex items-center justify-between text-sm pt-2 border-t border-white/10">
                    <button onClick={() => { setRegStep("form"); setOtp(["", "", "", "", "", ""]); setErrorMsg(""); setSuccessMsg(""); }}
                      className="text-muted-foreground hover:text-foreground transition-colors">
                      ← Edit Details
                    </button>
                    <button onClick={handleResendOtp} disabled={sendingOtp}
                      className="flex items-center gap-1.5 text-primary hover:underline disabled:opacity-50">
                      <RefreshCw className={`w-3.5 h-3.5 ${sendingOtp ? "animate-spin" : ""}`} />
                      {sendingOtp ? "Sending…" : "Resend Code"}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ── DONE ── */}
              {regStep === "done" && (
                <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center text-center py-6 space-y-4">
                  <CheckCircle2 className="w-16 h-16 text-success" />
                  <h3 className="text-xl font-bold">Account Created!</h3>
                  <p className="text-sm text-muted-foreground">Redirecting you to the dashboard…</p>
                </motion.div>
              )}

            </AnimatePresence>

            {/* Bottom switch */}
            {regStep === "form" && (
              <>
                <div className="my-6 border-t border-white/10" />
                {mode === "login" ? (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Need an account?</span>
                    <button onClick={() => { setMode("register"); setErrorMsg(""); }}
                      className="text-sm text-primary hover:underline">Register →</button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Already have an account?</span>
                    <button onClick={resetToLogin}
                      className="text-sm text-primary hover:underline">Login →</button>
                  </div>
                )}
              </>
            )}

          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
