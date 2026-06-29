"use client";

import React, { useEffect, useState, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { GlassCard } from "@/components/shared/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  User, Mail, Phone, Lock, Camera, Mic, Play, Square,
  CheckCircle2, AlertTriangle, RefreshCw, ScanFace, Loader2, Sparkles, ShieldCheck, UploadCloud
} from "lucide-react";

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [isTeacher, setIsTeacher] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI state
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  // Student Biometrics Status
  const [hasFace, setHasFace] = useState(false);
  const [hasVoice, setHasVoice] = useState(false);

  // Camera handling for Face update
  const [faceSubMode, setFaceSubMode] = useState<"camera" | "upload">("camera");
  const [cameraActive, setCameraActive] = useState(false);
  const [capturingFace, setCapturingFace] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Voice recording for Voice update
  const [recordingActive, setRecordingActive] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);
  const [uploadingVoice, setUploadingVoice] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const voiceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Voice testing ("check whether voice is working")
  const [testRecordingActive, setTestRecordingActive] = useState(false);
  const [testRecordingTime, setTestRecordingTime] = useState(0);
  const [testVoiceBlob, setTestVoiceBlob] = useState<Blob | null>(null);
  const [testingVoice, setTestingVoice] = useState(false);
  const [testResult, setTestResult] = useState<{ match?: boolean; msg: string } | null>(null);
  const testMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const testAudioChunksRef = useRef<Blob[]>([]);
  const testTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      window.location.href = "/";
      return;
    }
    const currentUser = JSON.parse(userStr);
    setUser(currentUser);

    const isT = currentUser.teacher_id != null;
    setIsTeacher(isT);

    setName(currentUser.name || "");
    setEmail(currentUser.email || "");
    setPhone(currentUser.phone || "");

    if (!isT) {
      setHasFace(!!currentUser.face_embedding);
      setHasVoice(!!currentUser.voice_embedding);
    }
    setLoading(false);
  }, []);

  // ── Camera stream controls ──────────────────────────────────────
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (cameraActive) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(s => {
          stream = s;
          if (videoRef.current) videoRef.current.srcObject = s;
        })
        .catch(err => {
          console.error("Camera error:", err);
          setMessage({ text: "Camera access denied or unavailable.", type: "error" });
          setCameraActive(false);
        });
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const s = videoRef.current.srcObject as MediaStream;
        s.getTracks().forEach(t => t.stop());
        videoRef.current.srcObject = null;
      }
    }
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [cameraActive]);

  // ── Update Profile Handler (Teacher or Student text info) ──────
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });

    if (password && password !== confirmPassword) {
      setMessage({ text: "Passwords do not match.", type: "error" });
      return;
    }

    setUpdatingProfile(true);
    try {
      if (isTeacher) {
        // Teacher profile text update
        const res = await fetch(`http://localhost:8000/api/profile/teacher/${user.teacher_id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            teacher_id: user.teacher_id,
            name,
            email,
            phone,
            password: password || undefined
          })
        });

        if (res.ok) {
          const data = await res.json();
          localStorage.setItem("user", JSON.stringify(data.user));
          setUser(data.user);
          setMessage({ text: "Teacher profile updated successfully!", type: "success" });
          setPassword("");
          setConfirmPassword("");
        } else {
          const err = await res.json();
          setMessage({ text: err.detail || "Update failed.", type: "error" });
        }
      } else {
        // Student profile text update (via Multipart/form-data)
        const fd = new FormData();
        fd.append("name", name);
        fd.append("email", email);
        fd.append("phone", phone);

        const res = await fetch(`http://localhost:8000/api/profile/student/${user.student_id}`, {
          method: "PUT",
          body: fd
        });

        if (res.ok) {
          const data = await res.json();
          localStorage.setItem("user", JSON.stringify(data.user));
          setUser(data.user);
          setMessage({ text: "Student profile updated successfully!", type: "success" });
        } else {
          const err = await res.json();
          setMessage({ text: err.detail || "Update failed.", type: "error" });
        }
      }
    } catch {
      setMessage({ text: "Connection error. Please try again.", type: "error" });
    } finally {
      setUpdatingProfile(false);
    }
  };

  // ── Capture and Upload Student Face ID ──────────────────────────
  const handleCaptureFace = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setCapturingFace(true);
    setMessage({ text: "", type: "" });

    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);

    canvas.toBlob(async (blob) => {
      if (!blob) {
        setCapturingFace(false);
        return;
      }
      const fd = new FormData();
      fd.append("name", name);
      fd.append("email", email);
      fd.append("phone", phone);
      fd.append("images", blob, "new_face.jpg");

      try {
        const res = await fetch(`http://localhost:8000/api/profile/student/${user.student_id}`, {
          method: "PUT",
          body: fd
        });

        if (res.ok) {
          const data = await res.json();
          localStorage.setItem("user", JSON.stringify(data.user));
          setUser(data.user);
          setHasFace(true);
          setCameraActive(false);
          setMessage({ text: "Face ID registered and updated successfully!", type: "success" });
        } else {
          const err = await res.json();
          setMessage({ text: err.detail || "Failed to parse face from image. Try again.", type: "error" });
        }
      } catch {
        setMessage({ text: "Connection error updating Face ID.", type: "error" });
      } finally {
        setCapturingFace(false);
      }
    }, "image/jpeg");
  };

  const handleFilesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const filesArray = Array.from(e.target.files);
    
    setCapturingFace(true);
    setMessage({ text: "", type: "" });
    const fd = new FormData();
    fd.append("name", name);
    fd.append("email", email);
    fd.append("phone", phone);
    filesArray.forEach(file => fd.append("images", file, file.name));

    try {
      const res = await fetch(`http://localhost:8000/api/profile/student/${user.student_id}`, {
        method: "PUT",
        body: fd
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("user", JSON.stringify(data.user));
        setUser(data.user);
        setHasFace(true);
        setMessage({ text: "Face ID registered from uploaded photos!", type: "success" });
      } else {
        const err = await res.json();
        setMessage({ text: err.detail || "Failed to parse face from images. Try again.", type: "error" });
      }
    } catch {
      setMessage({ text: "Connection error uploading photos.", type: "error" });
    } finally {
      setCapturingFace(false);
    }
  };

  // ── Student Voice Recording ──────────────────────────────────────
  const startRecordingVoice = async () => {
    audioChunksRef.current = [];
    setVoiceBlob(null);
    setRecordingTime(0);
    setMessage({ text: "", type: "" });

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;

      mr.ondataavailable = e => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mr.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        setVoiceBlob(blob);
        stream.getTracks().forEach(t => t.stop());
      };

      mr.start();
      setRecordingActive(true);
      voiceTimerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch {
      setMessage({ text: "Microphone access denied.", type: "error" });
    }
  };

  const stopRecordingVoice = () => {
    if (mediaRecorderRef.current && recordingActive) {
      mediaRecorderRef.current.stop();
      setRecordingActive(false);
      if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);
    }
  };

  const handleUploadVoice = async () => {
    if (!voiceBlob) return;
    setUploadingVoice(true);
    setMessage({ text: "", type: "" });

    const fd = new FormData();
    fd.append("name", name);
    fd.append("email", email);
    fd.append("phone", phone);
    fd.append("audio", voiceBlob, "new_voice.wav");

    try {
      const res = await fetch(`http://localhost:8000/api/profile/student/${user.student_id}`, {
        method: "PUT",
        body: fd
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("user", JSON.stringify(data.user));
        setUser(data.user);
        setHasVoice(true);
        setVoiceBlob(null);
        setRecordingTime(0);
        setMessage({ text: "Voice print registered successfully!", type: "success" });
      } else {
        const err = await res.json();
        setMessage({ text: err.detail || "Failed to register voice.", type: "error" });
      }
    } catch {
      setMessage({ text: "Connection error registering voice.", type: "error" });
    } finally {
      setUploadingVoice(false);
    }
  };

  // ── Student Voice Testing ("check whether voice is working") ──────
  const startRecordingTest = async () => {
    testAudioChunksRef.current = [];
    setTestVoiceBlob(null);
    setTestRecordingTime(0);
    setTestResult(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      testMediaRecorderRef.current = mr;

      mr.ondataavailable = e => {
        if (e.data.size > 0) testAudioChunksRef.current.push(e.data);
      };

      mr.onstop = () => {
        const blob = new Blob(testAudioChunksRef.current, { type: "audio/wav" });
        setTestVoiceBlob(blob);
        stream.getTracks().forEach(t => t.stop());
      };

      mr.start();
      setTestRecordingActive(true);
      testTimerRef.current = setInterval(() => setTestRecordingTime(t => t + 1), 1000);
    } catch {
      setTestResult({ match: false, msg: "Microphone access denied." });
    }
  };

  const stopRecordingTest = () => {
    if (testMediaRecorderRef.current && testRecordingActive) {
      testMediaRecorderRef.current.stop();
      setTestRecordingActive(false);
      if (testTimerRef.current) clearInterval(testTimerRef.current);
    }
  };

  const handleTestVoiceMatch = async () => {
    if (!testVoiceBlob) return;
    setTestingVoice(true);
    setTestResult(null);

    const fd = new FormData();
    fd.append("audio", testVoiceBlob, "test.wav");

    try {
      const res = await fetch(`http://localhost:8000/api/profile/student/${user.student_id}/test-voice`, {
        method: "POST",
        body: fd
      });

      if (res.ok) {
        const data = await res.json();
        setTestResult({
          match: data.match,
          msg: data.match
            ? "Voice Match Verified! Your Voice ID is configured correctly and functioning."
            : "No Match. Voice sample did not match your registered voice print. Please try again or re-register your voice."
        });
      } else {
        const err = await res.json();
        setTestResult({ match: false, msg: err.detail || "Voice analysis failed. Please try again." });
      }
    } catch {
      setTestResult({ match: false, msg: "Unable to reach verification server." });
    } finally {
      setTestingVoice(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto flex flex-col space-y-8">

        {/* Title */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Profile</h1>
          <p className="text-muted-foreground mt-1">Manage your identity, login details, and biometric voice/face keys.</p>
        </div>

        {/* Global Notifications */}
        {message.text && (
          <div className={`p-4 rounded-xl text-sm border flex items-center gap-3 ${message.type === "success" ? "bg-success/10 border-success/20 text-success" : "bg-error/10 border-error/20 text-error"}`}>
            {message.type === "success" ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
            {message.text}
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-8">

          {/* Left Column: Basic Info Form */}
          <div className="md:col-span-2 space-y-6">
            <GlassCard className="p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-primary" /> General Information
              </h2>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input value={name} onChange={e => setName(e.target.value)} placeholder="Full Name" className="pl-10" required />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@university.edu" className="pl-10" required />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone Number" className="pl-10" required />
                  </div>
                </div>

                {isTeacher && (
                  <>
                    <div className="my-6 border-t border-white/5" />
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3">Change Password (Optional)</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">New Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="pl-10" minLength={6} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Confirm New Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" className="pl-10" minLength={6} />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <Button type="submit" disabled={updatingProfile} className="w-full mt-4 bg-primary text-white hover:bg-primary/90">
                  {updatingProfile ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving Changes…</> : "Save Changes"}
                </Button>
              </form>
            </GlassCard>

            {/* Student Biometrics verification/testing panel */}
            {!isTeacher && (
              <GlassCard className="p-6 border-primary/20 bg-primary/5">
                <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" /> Test Voice Verification
                </h2>
                <p className="text-xs text-muted-foreground mb-6">
                  Check whether your voice print is working correctly with the biometric matching pipeline.
                </p>

                <div className="flex flex-col items-center justify-center p-6 bg-black/30 rounded-xl border border-white/5 space-y-4 text-center">
                  <div className="relative flex items-center justify-center">
                    {testRecordingActive && (
                      <>
                        <div className="absolute w-24 h-24 rounded-full bg-primary/15 animate-ping" />
                        <div className="absolute w-20 h-20 rounded-full bg-primary/20 animate-pulse" />
                      </>
                    )}
                    <div className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center border transition-all ${testRecordingActive ? "bg-error/10 border-error" : testVoiceBlob ? "bg-success/10 border-success" : "bg-white/5 border-white/10"}`}>
                      {testRecordingActive ? <Mic className="w-6 h-6 text-error animate-pulse" /> : <Mic className="w-6 h-6 text-muted-foreground" />}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold">
                      {testRecordingActive ? `Recording… 00:${String(testRecordingTime).padStart(2, "0")}` : testVoiceBlob ? "Audio Sample Captured" : "Test Your Voice Print"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-[280px]">
                      {testRecordingActive ? "Speak clearly: say your name or a test phrase." : "Record a short clip of your voice to test matches against Supabase."}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {!testRecordingActive && !testVoiceBlob && (
                      <Button size="sm" onClick={startRecordingTest} className="bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30">
                        <Play className="w-3.5 h-3.5 mr-1" /> Record Test
                      </Button>
                    )}
                    {testRecordingActive && (
                      <Button size="sm" onClick={stopRecordingTest} variant="destructive" className="bg-error hover:bg-error/90 text-white">
                        <Square className="w-3.5 h-3.5 mr-1" /> Stop Recording
                      </Button>
                    )}
                    {testVoiceBlob && !testRecordingActive && (
                      <>
                        <Button size="sm" variant="ghost" onClick={() => { setTestVoiceBlob(null); setTestResult(null); }} className="text-muted-foreground">
                          Reset
                        </Button>
                        <Button size="sm" onClick={handleTestVoiceMatch} disabled={testingVoice} className="bg-success text-white hover:bg-success/90">
                          {testingVoice ? "Verifying…" : "Verify Voice Match"}
                        </Button>
                      </>
                    )}
                  </div>

                  {testResult && (
                    <div className={`mt-4 p-3 rounded-lg border text-xs text-left w-full flex items-start gap-2 ${testResult.match ? "bg-success/15 border-success/30 text-success" : "bg-warning/15 border-warning/30 text-warning"}`}>
                      {testResult.match ? <ShieldCheck className="w-4 h-4 shrink-0 text-success mt-0.5" /> : <AlertTriangle className="w-4 h-4 shrink-0 text-warning mt-0.5" />}
                      <span>{testResult.msg}</span>
                    </div>
                  )}
                </div>
              </GlassCard>
            )}
          </div>

          {/* Right Column: Student Biometrics Capture */}
          {!isTeacher && (
            <div className="space-y-6">

              {/* Status Info */}
              <GlassCard className="p-5 flex flex-col gap-4">
                <h3 className="text-sm font-semibold text-muted-foreground">Biometrics Status</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Face ID Profile</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${hasFace ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}>
                      {hasFace ? "Configured" : "Missing"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Voice ID Profile</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${hasVoice ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}>
                      {hasVoice ? "Configured" : "Missing"}
                    </span>
                  </div>
                </div>
              </GlassCard>

              {/* Camera Update Card */}
              <GlassCard className="p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <h3 className="font-bold text-sm flex items-center gap-1.5"><Camera className="w-4 h-4 text-primary" /> Update Face ID</h3>
                  <div className="flex bg-white/5 p-0.5 rounded-lg border border-white/5">
                    <button
                      onClick={() => { setFaceSubMode("camera"); }}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${faceSubMode === "camera" ? "bg-primary/20 text-white" : "text-muted-foreground hover:text-white"}`}
                    >
                      Webcam
                    </button>
                    <button
                      onClick={() => { setFaceSubMode("upload"); setCameraActive(false); }}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${faceSubMode === "upload" ? "bg-primary/20 text-white" : "text-muted-foreground hover:text-white"}`}
                    >
                      Upload Photos
                    </button>
                  </div>
                </div>

                {faceSubMode === "camera" ? (
                  <>
                    <div className="relative aspect-video bg-black/40 rounded-lg overflow-hidden flex items-center justify-center border border-white/5">
                      <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${!cameraActive && "hidden"}`} />
                      <canvas ref={canvasRef} className="hidden" />
                      {!cameraActive && (
                        <div className="flex flex-col items-center text-muted-foreground/30 text-center p-3">
                          <ScanFace className="w-10 h-10 mb-1" />
                          <span className="text-xs">Camera is offline</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {!cameraActive ? (
                        <Button size="sm" className="w-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"
                          onClick={() => setCameraActive(true)}>
                          Start Webcam
                        </Button>
                      ) : (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => setCameraActive(false)} className="w-1/2">
                            Cancel
                          </Button>
                          <Button size="sm" disabled={capturingFace} onClick={handleCaptureFace} className="w-1/2 bg-success text-white hover:bg-success/90">
                            {capturingFace ? "Saving…" : "Capture Snapshot"}
                          </Button>
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center p-4 w-full h-full min-h-[220px]">
                    <label className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed border-white/10 rounded-xl hover:border-primary/50 cursor-pointer bg-black/20 transition-all">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center space-y-2 px-4">
                        <UploadCloud className="w-10 h-10 text-muted-foreground opacity-50" />
                        <p className="text-sm font-medium">Click to select files, or Drag & Drop</p>
                        <p className="text-xs text-muted-foreground">Select multiple photos of your face for better accuracy</p>
                      </div>
                      <input type="file" multiple accept="image/*" onChange={handleFilesUpload} className="hidden" disabled={capturingFace} />
                    </label>
                    {capturingFace && (
                      <div className="mt-3 text-sm text-primary animate-pulse flex items-center gap-2">
                        Processing and saving face data…
                      </div>
                    )}
                  </div>
                )}
              </GlassCard>

              {/* Voice Update Card */}
              <GlassCard className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm flex items-center gap-1.5"><Mic className="w-4 h-4 text-secondary" /> Update Voice Print</h3>
                </div>

                <div className="p-4 rounded-lg bg-black/40 border border-white/5 flex flex-col items-center justify-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${recordingActive ? "bg-error/20 text-error border border-error animate-pulse" : voiceBlob ? "bg-success/20 text-success" : "bg-white/5 text-muted-foreground"}`}>
                    <Mic className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-medium text-center">
                    {recordingActive ? `Recording… 00:${String(recordingTime).padStart(2, "0")}` : voiceBlob ? "New Audio snippet saved" : "Record voice snippet"}
                  </span>
                </div>

                <div className="flex gap-2">
                  {!recordingActive && !voiceBlob && (
                    <Button size="sm" onClick={startRecordingVoice} className="w-full bg-secondary/10 text-secondary border border-secondary/20 hover:bg-secondary/20">
                      Record Snippet
                    </Button>
                  )}
                  {recordingActive && (
                    <Button size="sm" onClick={stopRecordingVoice} variant="destructive" className="w-full bg-error text-white hover:bg-error/90">
                      Stop
                    </Button>
                  )}
                  {voiceBlob && !recordingActive && (
                    <>
                      <Button size="sm" variant="ghost" onClick={() => { setVoiceBlob(null); setRecordingTime(0); }} className="w-1/2 text-muted-foreground">
                        Discard
                      </Button>
                      <Button size="sm" onClick={handleUploadVoice} disabled={uploadingVoice} className="w-1/2 bg-success text-white hover:bg-success/90">
                        {uploadingVoice ? "Saving…" : "Save Voice"}
                      </Button>
                    </>
                  )}
                </div>
              </GlassCard>

            </div>
          )}

        </div>

      </div>
    </DashboardLayout>
  );
}
