"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft, User, Lock, ScanFace, Mail, Phone, Mic, Check, Square,
  ShieldCheck, RefreshCw, Loader2, CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GlassCard } from "@/components/shared/GlassCard";

type Mode = "login" | "register";
type RegStep = "form" | "otp" | "done";

export default function StudentLogin() {
  const [mode, setMode] = useState<Mode>("login");
  const [regStep, setRegStep] = useState<RegStep>("form");
  const [loginMethod, setLoginMethod] = useState<"face" | "password">("face");
  const [isScanning, setIsScanning] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Registration form values
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [capturedPhotoBlob, setCapturedPhotoBlob] = useState<Blob | null>(null);
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  // OTP Verification values
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [registering, setRegistering] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const voiceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);

  // Clear previous session on mount
  useEffect(() => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  }, []);

  // Camera stream management
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (isScanning) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(s => {
          stream = s;
          if (videoRef.current) videoRef.current.srcObject = s;
        })
        .catch(err => {
          console.error("Camera error:", err);
          setErrorMsg("Camera access denied or unavailable.");
        });
    } else {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
        videoRef.current.srcObject = null;
      }
    }
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [isScanning]);

  // Face scanner capture for login
  const captureFaceLogin = async () => {
    setErrorMsg("");
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const formData = new FormData();
      formData.append("image", blob, "capture.jpg");

      try {
        const res = await fetch("http://localhost:8000/api/auth/student/login", {
          method: "POST",
          body: formData
        });
        if (res.ok) {
          const data = await res.json();
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));
          await handleAutoEnroll(data.user.student_id);
        } else {
          const errData = await res.json();
          setErrorMsg(errData.detail || "Login failed. Face not recognized.");
        }
      } catch {
        setErrorMsg("Failed to connect to server.");
      }
    }, "image/jpeg");
  };

  // Face capture for registration
  const captureFaceReg = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (blob) {
        setCapturedPhotoBlob(blob);
        setIsScanning(false);
      }
    }, "image/jpeg");
  };

  // Microphone recording functions
  const startVoiceRecording = async () => {
    setErrorMsg("");
    audioChunksRef.current = [];
    setRecordingTime(0);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        setVoiceBlob(audioBlob);
        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      voiceTimerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch {
      setErrorMsg("Microphone access denied or unavailable.");
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);
    }
  };

  // Reroute helper after enrollment
  const handleAutoEnroll = async (studentId: number) => {
    const searchParams = new URLSearchParams(window.location.search);
    const joinCode = searchParams.get("join-code");

    if (joinCode) {
      try {
        const subRes = await fetch(`http://localhost:8000/api/subjects/code/${joinCode}`);
        if (subRes.ok) {
          const subject = await subRes.json();
          await fetch("http://localhost:8000/api/subjects/enroll", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              student_id: studentId,
              subject_id: subject.subject_id
            })
          });
        }
      } catch (err) {
        console.error("Auto enrollment failed:", err);
      }
    }
    window.location.href = "/portal/dashboard/student";
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

  // ── Step 1: Submit Form to request OTP ────────────────────────
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(""); setSuccessMsg("");

    if (!capturedPhotoBlob) {
      setErrorMsg("Please capture your Face ID photo first.");
      return;
    }

    setSendingOtp(true);
    try {
      const res = await fetch("http://localhost:8000/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: regEmail, name: regName })
      });
      if (res.ok) {
        setRegStep("otp");
      } else {
        const err = await res.json();
        setErrorMsg(err.detail || "Failed to send OTP email.");
      }
    } catch {
      setErrorMsg("Could not connect to registration server.");
    } finally {
      setSendingOtp(false);
    }
  };

  // ── Resend OTP ───────────────────────────────────────────────
  const handleResendOtp = async () => {
    setErrorMsg(""); setSendingOtp(true);
    try {
      const res = await fetch("http://localhost:8000/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: regEmail, name: regName })
      });
      if (res.ok) {
        setSuccessMsg("New OTP code sent! Check your inbox.");
      } else {
        const err = await res.json();
        setErrorMsg(err.detail || "Failed to resend OTP.");
      }
    } catch {
      setErrorMsg("Connection error.");
    } finally {
      setSendingOtp(false);
    }
  };

  // ── Step 2: Verify OTP and Register Student ──────────────────
  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(""); setVerifyingOtp(true);

    try {
      // 1. Verify OTP
      const verRes = await fetch("http://localhost:8000/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: regEmail, otp: otp.join("") })
      });
      if (!verRes.ok) {
        const err = await verRes.json();
        setErrorMsg(err.detail || "Invalid OTP. Verification failed.");
        setVerifyingOtp(false);
        return;
      }

      // 2. Perform Supabase/API profile creation
      setVerifyingOtp(false);
      setRegistering(true);

      const formData = new FormData();
      formData.append("name", regName);
      formData.append("email", regEmail);
      formData.append("phone", regPhone);
      formData.append("image", capturedPhotoBlob!, "register_face.jpg");
      if (voiceBlob) {
        formData.append("audio", voiceBlob, "register_voice.wav");
      }

      const regRes = await fetch("http://localhost:8000/api/auth/student/register", {
        method: "POST",
        body: formData
      });

      if (regRes.ok) {
        const data = await regRes.json();
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setRegStep("done");
        setTimeout(() => { handleAutoEnroll(data.user.student_id); }, 1500);
      } else {
        const err = await regRes.json();
        setErrorMsg(err.detail || "Database registration failed.");
      }
    } catch {
      setErrorMsg("Registration server error.");
    } finally {
      setVerifyingOtp(false);
      setRegistering(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
      
      <div className="w-full max-w-md z-10 px-6 py-12 relative">
        {/* Vercel Glow Aura directly behind the card */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[60%] bg-gradient-to-tr from-blue-600 via-purple-500 to-primary rounded-full blur-[100px] opacity-40 z-0" />

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
              <h1 className="text-2xl font-bold tracking-tight">Welcome, Student</h1>
              <p className="text-sm text-muted-foreground mt-2">
                Sign in to your account<br />or create one if you're new.
              </p>
            </div>

            {/* Mode switch (Login/Register tabs) - hidden on OTP/done steps */}
            {regStep === "form" && (
              <div className="flex bg-[#0a0a0a] p-1 rounded-lg border border-[#222] mb-8 relative">
                <div 
                  className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-[#222] rounded-md transition-all duration-200 ease-out ${mode === "login" ? "left-1" : "left-[calc(50%+2px)]"}`} 
                />
                <button
                  className={`relative flex-1 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 z-10 ${mode === "login" ? "text-white" : "text-neutral-400 hover:text-neutral-200"}`}
                  onClick={() => { setMode("login"); setErrorMsg(""); setSuccessMsg(""); setIsScanning(false); }}
                >Login</button>
                <button
                  className={`relative flex-1 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 z-10 ${mode === "register" ? "text-white" : "text-neutral-400 hover:text-neutral-200"}`}
                  onClick={() => { setMode("register"); setErrorMsg(""); setSuccessMsg(""); setIsScanning(false); }}
                >Register</button>
              </div>
            )}

            {/* Response Alerts */}
            {errorMsg && (
              <div className="bg-error/10 border border-error/20 text-error text-sm p-3 rounded-lg mb-4 text-center">{errorMsg}</div>
            )}
            {successMsg && (
              <div className="bg-success/10 border border-success/20 text-success text-sm p-3 rounded-lg mb-4 text-center">{successMsg}</div>
            )}

            <AnimatePresence mode="wait">

              {/* ── STUDENT LOGIN VIEW ── */}
              {mode === "login" && regStep === "form" && (
                <motion.div key="login-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="flex bg-black/40 p-1 rounded-lg border border-white/5 mb-6">
                    <button
                      className={`flex-1 py-1 text-xs rounded-md transition-all ${loginMethod === "face" ? "bg-white/10 text-white" : "text-muted-foreground"}`}
                      onClick={() => setLoginMethod("face")}
                    >Face ID</button>
                    <button
                      className={`flex-1 py-1 text-xs rounded-md transition-all ${loginMethod === "password" ? "bg-white/10 text-white" : "text-muted-foreground"}`}
                      onClick={() => { setLoginMethod("password"); setIsScanning(false); }}
                    >Password</button>
                  </div>

                  {loginMethod === "face" ? (
                    <div className="space-y-4">
                      <div className="relative w-full aspect-video bg-black/40 rounded-xl overflow-hidden mb-6 flex flex-col items-center justify-center border border-white/10">
                        <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${!isScanning && "hidden"}`} />
                        <canvas ref={canvasRef} className="hidden" />
                        {!isScanning && (
                          <div className="flex flex-col items-center text-muted-foreground opacity-50">
                            <ScanFace className="w-12 h-12 mb-2" />
                            <span className="text-sm">Camera inactive</span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-4">
                        {!isScanning ? (
                          <Button className="w-full h-12 text-base bg-primary hover:bg-primary/90 text-white" onClick={() => setIsScanning(true)}>
                            <ScanFace className="w-5 h-5 mr-2" /> Start Scanner
                          </Button>
                        ) : (
                          <>
                            <Button variant="outline" className="w-1/2 h-12 text-base border-white/10" onClick={() => setIsScanning(false)}>Cancel</Button>
                            <Button className="w-1/2 h-12 text-base bg-success hover:bg-success/90 text-white" onClick={captureFaceLogin}>Login</Button>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <form className="space-y-4" onSubmit={(e) => { 
                      e.preventDefault(); 
                      localStorage.setItem("token", "student_mock_token");
                      localStorage.setItem("user", JSON.stringify({ student_id: 9, name: "Student One", email: "student1@test.com" }));
                      window.location.href = "/portal/dashboard/student"; 
                    }}>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Student ID</label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input type="text" placeholder="e.g. 21BCE1234" className="pl-10" required />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input type="password" placeholder="••••••••" className="pl-10" required />
                        </div>
                      </div>
                      <div className="flex justify-end mt-2">
                        <Link href="#" className="text-xs text-primary hover:underline">Forgot Password?</Link>
                      </div>
                      <Button type="submit" className="w-full mt-4 h-12 text-base bg-secondary hover:bg-secondary/90 text-white">Login</Button>
                    </form>
                  )}
                </motion.div>
              )}

              {/* ── STUDENT REGISTRATION VIEW ── */}
              {mode === "register" && regStep === "form" && (
                <motion.form key="reg-form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="space-y-4" onSubmit={handleRegisterSubmit}>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input type="text" value={regName} onChange={e => setRegName(e.target.value)} placeholder="Amit Kumar" className="pl-10" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="amit@gmail.com" className="pl-10" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input type="text" value={regPhone} onChange={e => setRegPhone(e.target.value)} placeholder="+91 9876543210" className="pl-10" required />
                    </div>
                  </div>

                  {/* Face Capture Section */}
                  <div className="space-y-2 pt-2">
                    <label className="text-sm font-medium">Face Recognition (Face ID)</label>
                    <div className="relative w-full aspect-video bg-black/40 rounded-xl overflow-hidden flex flex-col items-center justify-center border border-white/10">
                      {isScanning ? (
                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                      ) : capturedPhotoBlob ? (
                        <img src={URL.createObjectURL(capturedPhotoBlob)} alt="Captured face" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center text-muted-foreground opacity-50">
                          <ScanFace className="w-12 h-12 mb-2" />
                          <span className="text-sm">No photo captured</span>
                        </div>
                      )}
                      <canvas ref={canvasRef} className="hidden" />
                    </div>
                    <div className="flex gap-2">
                      {isScanning ? (
                        <>
                          <Button type="button" variant="outline" className="w-1/2 border-white/10" onClick={() => setIsScanning(false)}>Cancel</Button>
                          <Button type="button" className="w-1/2 bg-success text-white hover:bg-success/90" onClick={captureFaceReg}>Capture Photo</Button>
                        </>
                      ) : (
                        <Button type="button" className="w-full bg-primary text-white hover:bg-primary/90" onClick={() => setIsScanning(true)}>
                          <ScanFace className="w-4 h-4 mr-2" />
                          {capturedPhotoBlob ? "Recapture Face" : "Scan/Capture Face"}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Voice Recording Section */}
                  <div className="space-y-2 pt-2">
                    <label className="text-sm font-medium">Voice Embedding (Optional)</label>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-white/10">
                      <div className="flex items-center space-x-2">
                        <Mic className={`w-5 h-5 ${isRecording ? "text-error animate-pulse" : "text-muted-foreground"}`} />
                        <span className="text-sm">
                          {isRecording ? `Recording… 00:${String(recordingTime).padStart(2, "0")}` : voiceBlob ? "Voice sample recorded!" : "Record a voice snippet"}
                        </span>
                      </div>
                      {isRecording ? (
                        <Button type="button" size="sm" className="bg-error text-white hover:bg-error/90" onClick={stopVoiceRecording}>
                          <Square className="w-4 h-4 mr-1" /> Stop
                        </Button>
                      ) : (
                        <Button type="button" size="sm" className="bg-secondary text-white hover:bg-secondary/90" onClick={startVoiceRecording}>
                          <Mic className="w-4 h-4 mr-1" /> Record
                        </Button>
                      )}
                    </div>
                  </div>

                  <Button type="submit" disabled={sendingOtp} className="w-full mt-4 h-12 text-base bg-secondary hover:bg-secondary/90 text-white">
                    {sendingOtp ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending OTP…</> : "Continue & Verify Email →"}
                  </Button>
                </motion.form>
              )}

              {/* ── OTP CODE VERIFICATION STEP ── */}
              {regStep === "otp" && (
                <motion.div key="otp-step" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="space-y-6">
                  <div className="text-center p-4 rounded-xl bg-primary/5 border border-primary/10">
                    <ShieldCheck className="w-10 h-10 text-primary mx-auto mb-2" />
                    <p className="text-sm font-medium">Verify Your Email</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      We sent a 6-digit verification code to <span className="text-foreground font-medium">{regEmail}</span>
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

                    <Button type="submit" disabled={otp.join("").length !== 6 || verifyingOtp || registering} className="w-full h-12 text-base bg-primary">
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

              {/* ── DONE VIEW ── */}
              {regStep === "done" && (
                <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center text-center py-6 space-y-4">
                  <CheckCircle2 className="w-16 h-16 text-success" />
                  <h3 className="text-xl font-bold">Profile Created Successfully!</h3>
                  <p className="text-sm text-muted-foreground">Logging you in to your student dashboard…</p>
                </motion.div>
              )}

            </AnimatePresence>

            {/* Bottom switch footer */}
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
                    <button onClick={() => { setMode("login"); setRegStep("form"); setErrorMsg(""); }}
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
