"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { GlassCard } from "@/components/shared/GlassCard";
import { Button } from "@/components/ui/button";
import {
  Camera, Mic, Play, Pause, Square, ScanFace,
  CheckCircle2, AlertCircle, Clock, MicOff,
  StopCircle, Radio, Users, Trash2, UploadCloud, FileImage, Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";

interface LogEntry {
  name: string;
  studentId: number;
  type: "Face" | "Voice";
  time: string;
  success: boolean;
}

interface GalleryPhoto {
  id: string;
  url: string;
  blob: Blob;
  name: string;
}

function LiveAttendanceInner() {
  const searchParams = useSearchParams();
  const subjectId = searchParams?.get("subject") || "";

  // ─── Modes ────────────────────────────────────────────
  const [mode, setMode] = useState<"face" | "voice">("face");
  const [faceSubMode, setFaceSubMode] = useState<"camera" | "upload">("camera");

  // ─── Subject & enrolled students ──────────────────────
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState(subjectId);
  const [enrolledStudents, setEnrolledStudents] = useState<any[]>([]);
  const [presentIds, setPresentIds] = useState<Set<number>>(new Set());

  // ─── Face mode gallery ────────────────────────────────
  const [cameraOn, setCameraOn] = useState(false);
  const [gallery, setGallery] = useState<GalleryPhoto[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ─── Voice mode ───────────────────────────────────────
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [voiceProcessing, setVoiceProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // ─── Shared logs & loading ────────────────────────────
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [processing, setProcessing] = useState(false);
  const [elapsedSecs, setElapsedSecs] = useState(0);
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ─── Load teacher subjects ─────────────────────────────
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) return;
    const u = JSON.parse(stored);
    if (!u.teacher_id) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/subjects/teacher/${u.teacher_id}`)
      .then(r => r.json())
      .then(d => {
        setSubjects(d.subjects || []);
        if (!selectedSubject && d.subjects?.length > 0) {
          setSelectedSubject(String(d.subjects[0].subject_id));
        }
      });
  }, []);

  // ─── Load enrolled students when subject changes ───────
  useEffect(() => {
    if (!selectedSubject) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/subjects/${selectedSubject}/students`)
      .then(r => r.ok ? r.json() : { students: [] })
      .then(d => setEnrolledStudents(d.students || []))
      .catch(() => {});
  }, [selectedSubject]);

  // ─── Session timer ─────────────────────────────────────
  useEffect(() => {
    sessionTimerRef.current = setInterval(() => setElapsedSecs(s => s + 1), 1000);
    return () => { if (sessionTimerRef.current) clearInterval(sessionTimerRef.current); };
  }, []);

  const fmtTime = (s: number) =>
    `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // ─── Camera stream lifecycle ───────────────────────────
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (cameraOn && mode === "face" && faceSubMode === "camera") {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(s => { stream = s; if (videoRef.current) videoRef.current.srcObject = s; })
        .catch(() => alert("Camera access denied."));
    } else {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
        videoRef.current.srcObject = null;
      }
    }
    return () => { if (stream) stream.getTracks().forEach(t => t.stop()); };
  }, [cameraOn, mode, faceSubMode]);

  // ─── Camera Snapshot Capture ───────────────────────────
  const takeSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const photoId = `snap_${Date.now()}`;
      const url = URL.createObjectURL(blob);
      setGallery(prev => [...prev, {
        id: photoId,
        url,
        blob,
        name: `Snapshot ${prev.length + 1}`
      }]);
    }, "image/jpeg");
  };

  // ─── File Upload Handler ───────────────────────────────
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newPhotos: GalleryPhoto[] = [];
    Array.from(files).forEach((file, idx) => {
      const url = URL.createObjectURL(file);
      newPhotos.push({
        id: `upload_${Date.now()}_${idx}`,
        url,
        blob: file,
        name: file.name
      });
    });
    setGallery(prev => [...prev, ...newPhotos]);
    e.target.value = ""; // reset file input
  };

  // ─── Remove Photo from Gallery ─────────────────────────
  const removePhoto = (id: string, url: string) => {
    URL.revokeObjectURL(url);
    setGallery(prev => prev.filter(p => p.id !== id));
  };

  // ─── Run Face Analysis (Bulk / Single list) ────────────
  const runFaceAnalysis = async () => {
    if (gallery.length === 0 || !selectedSubject) return;
    setProcessing(true);

    const fd = new FormData();
    fd.append("subject_id", selectedSubject);
    gallery.forEach(p => {
      fd.append("images", p.blob, p.name);
    });

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/attendance/face/bulk`, {
        method: "POST",
        body: fd
      });

      if (res.ok) {
        const data = await res.json();
        
        // Map detected students into UI logs
        const newLogs: LogEntry[] = data.results
          .filter((r: any) => r.is_present)
          .map((r: any) => ({
            name: r.name,
            studentId: r.student_id,
            type: "Face",
            time: "Just now",
            success: true
          }));

        setLogs(prev => [...newLogs, ...prev]);
        setPresentIds(prev => {
          const next = new Set(prev);
          newLogs.forEach(l => next.add(l.studentId));
          return next;
        });

        // Clean up URLs and empty gallery
        gallery.forEach(p => URL.revokeObjectURL(p.url));
        setGallery([]);
        alert(`Face Analysis Complete. Recognized ${newLogs.length} students!`);
      } else {
        const e = await res.json();
        alert(e.detail || "Analysis failed.");
      }
    } catch {
      alert("Connection error executing face analysis.");
    } finally {
      setProcessing(false);
    }
  };

  // ─── Voice recording flows ──────────────────────────────
  const startVoiceRecording = async () => {
    audioChunksRef.current = [];
    setRecordedBlob(null);
    setRecordingTime(0);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      mr.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        setRecordedBlob(blob);
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      setIsRecording(true);
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch { alert("Microphone access denied."); }
  };

  const stopVoiceRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const submitVoice = async () => {
    if (!recordedBlob || !selectedSubject) return;
    setVoiceProcessing(true);
    const fd = new FormData();
    fd.append("subject_id", selectedSubject);
    fd.append("audio", recordedBlob, "voice.wav");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/attendance/voice`, { method: "POST", body: fd });
      if (res.ok) {
        const data = await res.json();
        if (data.detected_count === 0) {
          alert("No student voices recognized. Make sure students have voice samples saved.");
        } else {
          const newLogs: LogEntry[] = data.logs.map((l: any) => {
            const stu = enrolledStudents.find((s: any) => s.student_id === l.student_id);
            return { name: stu?.name || `Student #${l.student_id}`, studentId: l.student_id, type: "Voice", time: "Just now", success: true };
          });
          setLogs(prev => [...newLogs, ...prev]);
          setPresentIds(prev => { const next = new Set(prev); newLogs.forEach(l => next.add(l.studentId)); return next; });
        }
        setRecordedBlob(null);
        setRecordingTime(0);
      } else {
        const e = await res.json();
        alert(e.detail || "Voice processing failed.");
      }
    } catch { alert("Connection error."); }
    finally { setVoiceProcessing(false); }
  };

  const subjectObj = subjects.find(s => String(s.subject_id) === selectedSubject);

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Live Attendance</h1>
            <p className="text-muted-foreground mt-1 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Session: {fmtTime(elapsedSecs)}
              {subjectObj && <span className="ml-2 text-foreground font-medium">&mdash; {subjectObj.subject_code}: {subjectObj.name}</span>}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={selectedSubject}
              onChange={e => setSelectedSubject(e.target.value)}
              className="text-sm bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary/50"
            >
              {subjects.map(s => (
                <option key={s.subject_id} value={s.subject_id}>{s.subject_code} — {s.name}</option>
              ))}
            </select>
            <Button variant="destructive" onClick={() => { setCameraOn(false); window.location.href = "/portal/dashboard/subjects"; }}>
              <Square className="w-4 h-4 mr-2" /> End Session
            </Button>
          </div>
        </div>

        {/* Primary Face/Voice Toggle Tabs */}
        <div className="flex bg-black/40 p-1 rounded-xl border border-white/5 w-fit gap-1">
          <button
            onClick={() => { setMode("face"); setIsRecording(false); mediaRecorderRef.current?.stop(); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${mode === "face" ? "bg-primary text-white shadow-md" : "text-muted-foreground hover:text-white"}`}
          >
            <Camera className="w-4 h-4" /> Face Recognition
          </button>
          <button
            onClick={() => { setMode("voice"); setCameraOn(false); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${mode === "voice" ? "bg-secondary text-white shadow-md" : "text-muted-foreground hover:text-white"}`}
          >
            <Mic className="w-4 h-4" /> Voice Biometrics
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">

          {/* Left Panel: Biometrics Processing Feed */}
          <GlassCard className="lg:col-span-2 p-0 overflow-hidden border-white/5 flex flex-col min-h-[520px]">

            <AnimatePresence mode="wait">
              {/* ── FACE MODE ── */}
              {mode === "face" && (
                <motion.div key="face" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col flex-1">
                  
                  {/* Sub-mode navigation for Face (Camera capture vs File Upload) */}
                  <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/20">
                    <div className="flex bg-white/5 p-0.5 rounded-lg border border-white/5">
                      <button
                        onClick={() => { setFaceSubMode("camera"); setCameraOn(true); }}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${faceSubMode === "camera" ? "bg-primary/20 text-white" : "text-muted-foreground hover:text-white"}`}
                      >
                        Webcam Snap
                      </button>
                      <button
                        onClick={() => { setFaceSubMode("upload"); setCameraOn(false); }}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${faceSubMode === "upload" ? "bg-primary/20 text-white" : "text-muted-foreground hover:text-white"}`}
                      >
                        Upload Photos
                      </button>
                    </div>

                    <div className="flex gap-2">
                      {faceSubMode === "camera" && (
                        <>
                          <Button size="sm" variant="outline" className={`border-white/10 ${cameraOn ? "text-warning border-warning/30" : "text-success border-success/30"}`}
                            onClick={() => setCameraOn(!cameraOn)}>
                            {cameraOn ? "Pause Camera" : "Start Camera"}
                          </Button>
                          {cameraOn && (
                            <Button size="sm" onClick={takeSnapshot} className="bg-primary text-white hover:bg-primary/90">
                              <Camera className="w-3.5 h-3.5 mr-1.5" /> Capture Snapshot
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Dynamic Face Input Panel */}
                  <div className="flex-1 bg-zinc-900 relative flex items-center justify-center min-h-[360px]">
                    {faceSubMode === "camera" ? (
                      <>
                        <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${!cameraOn && "hidden"}`} />
                        <canvas ref={canvasRef} className="hidden" />
                        {!cameraOn && (
                          <div className="flex flex-col items-center gap-3 text-muted-foreground/30">
                            <Camera className="w-16 h-16" />
                            <p className="text-sm font-mono">Camera Paused</p>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-8 w-full h-full">
                        <label className="flex flex-col items-center justify-center w-full max-w-md aspect-video border-2 border-dashed border-white/10 rounded-xl hover:border-primary/50 cursor-pointer bg-black/20 transition-all">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center space-y-2 px-4">
                            <UploadCloud className="w-12 h-12 text-muted-foreground opacity-50" />
                            <p className="text-sm font-medium">Click to select files, or Drag & Drop</p>
                            <p className="text-xs text-muted-foreground">Select multiple classroom photos (JPG, PNG)</p>
                          </div>
                          <input type="file" multiple accept="image/*" onChange={handleFileUpload} className="hidden" />
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Gallery Preview section (Visible whenever images exist) */}
                  {gallery.length > 0 && (
                    <div className="p-4 border-t border-white/5 bg-black/35 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Added Photos ({gallery.length})</span>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => { gallery.forEach(p => URL.revokeObjectURL(p.url)); setGallery([]); }} className="text-xs text-error hover:bg-error/10">
                            Clear all
                          </Button>
                          <Button size="sm" onClick={runFaceAnalysis} disabled={processing} className="bg-success text-white hover:bg-success/90">
                            {processing ? (
                              <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Analyzing…</>
                            ) : (
                              <><ScanFace className="w-3.5 h-3.5 mr-1" /> Run Face Analysis</>
                            )}
                          </Button>
                        </div>
                      </div>
                      <div className="flex gap-3 overflow-x-auto py-1 no-scrollbar max-h-[100px]">
                        {gallery.map((photo) => (
                          <div key={photo.id} className="relative w-20 h-14 rounded-lg overflow-hidden shrink-0 border border-white/10 group">
                            <img src={photo.url} alt={photo.name} className="w-full h-full object-contain bg-black/40" />
                            <button
                              onClick={() => removePhoto(photo.id, photo.url)}
                              className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="w-4 h-4 text-error" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Status Info Footer */}
                  <div className="h-14 border-t border-white/10 bg-black/40 flex items-center justify-between px-5">
                    <div className="flex items-center gap-2 text-sm">
                      <ScanFace className="w-4 h-4 text-primary" />
                      <span>{presentIds.size} student(s) marked present</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {enrolledStudents.length} enrolled student(s)
                    </div>
                  </div>

                </motion.div>
              )}

              {/* ── VOICE MODE ── */}
              {mode === "voice" && (
                <motion.div key="voice" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col flex-1">
                  <div className="p-4 border-b border-white/5 bg-black/20">
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${isRecording ? "bg-error/10 border-error/20 text-error" : "bg-white/5 border-white/10 text-muted-foreground"}`}>
                        <div className={`w-2 h-2 rounded-full ${isRecording ? "bg-error animate-pulse" : "bg-muted-foreground"}`} />
                        {isRecording ? `RECORDING — ${fmtTime(recordingTime)}` : recordedBlob ? "RECORDING READY" : "READY TO RECORD"}
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col items-center justify-center gap-8 p-8 bg-gradient-to-b from-secondary/5 to-transparent min-h-[360px]">
                    <div className="relative flex items-center justify-center">
                      {isRecording && (
                        <>
                          <div className="absolute w-40 h-40 rounded-full bg-secondary/10 animate-ping" />
                          <div className="absolute w-32 h-32 rounded-full bg-secondary/15 animate-pulse" />
                        </>
                      )}
                      <div className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${isRecording ? "bg-error/20 border-error shadow-[0_0_30px_rgba(239,68,68,0.3)]" : recordedBlob ? "bg-success/20 border-success" : "bg-secondary/10 border-secondary/40"}`}>
                        {isRecording ? <MicOff className="w-10 h-10 text-error" /> : recordedBlob ? <CheckCircle2 className="w-10 h-10 text-success" /> : <Mic className="w-10 h-10 text-secondary" />}
                      </div>
                    </div>

                    <div className="text-center space-y-2">
                      <h3 className="text-lg font-semibold">
                        {isRecording ? "Recording voice… Ask students to speak" : recordedBlob ? "Recording ready — Submit to identify students" : "Start recording classroom audio"}
                      </h3>
                      <p className="text-sm text-muted-foreground max-w-md">
                        {isRecording
                          ? "The AI is capturing audio. For best results, have each student say their name or any sentence clearly."
                          : recordedBlob
                          ? `Audio captured (${fmtTime(recordingTime)}). Click Submit to run voice biometric identification.`
                          : "Students must have registered their voice sample during sign-up. Recording identifies speakers automatically."}
                      </p>
                    </div>

                    <div className="flex gap-4">
                      {!isRecording && !recordedBlob && (
                        <Button onClick={startVoiceRecording} className="bg-secondary text-white hover:bg-secondary/90 h-12 px-8 text-base">
                          <Radio className="w-4 h-4 mr-2" /> Start Recording
                        </Button>
                      )}
                      {isRecording && (
                        <Button onClick={stopVoiceRecording} variant="outline" className="border-error text-error hover:bg-error/10 h-12 px-8 text-base">
                          <StopCircle className="w-4 h-4 mr-2" /> Stop Recording
                        </Button>
                      )}
                      {recordedBlob && !isRecording && (
                        <>
                          <Button variant="outline" onClick={() => { setRecordedBlob(null); setRecordingTime(0); }} className="border-white/10 text-muted-foreground">
                            Discard & Re-record
                          </Button>
                          <Button onClick={submitVoice} disabled={voiceProcessing} className="bg-secondary text-white hover:bg-secondary/90 h-12 px-8 text-base">
                            {voiceProcessing ? "Identifying…" : "Submit & Identify"}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="h-14 border-t border-white/10 bg-black/40 flex items-center justify-between px-5">
                    <div className="flex items-center gap-2 text-sm">
                      <Mic className="w-4 h-4 text-secondary" />
                      <span>{presentIds.size} students marked present via Voice</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {enrolledStudents.filter((s: any) => s.voice_embedding).length} students have voice samples
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </GlassCard>

          {/* Right Panel: Logs & Roster */}
          <div className="flex flex-col gap-4">
            {/* Logs */}
            <GlassCard className="p-0 flex flex-col border-white/5 h-[230px]">
              <div className="p-4 border-b border-white/10 bg-black/20 flex items-center justify-between">
                <h3 className="font-semibold text-sm">Recognition Log</h3>
                <span className="text-xs text-muted-foreground">{logs.length} events</span>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2 no-scrollbar">
                {logs.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center pt-8">No detections yet.</p>
                ) : logs.map((log, idx) => (
                  <div key={idx} className={`flex items-start gap-3 p-3 rounded-lg ${log.type === "Face" ? "bg-primary/5 border border-primary/10" : "bg-secondary/5 border border-secondary/10"}`}>
                    <div className="mt-0.5 shrink-0">
                      {log.success ? <CheckCircle2 className="w-4 h-4 text-success" /> : <AlertCircle className="w-4 h-4 text-warning" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{log.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${log.type === "Face" ? "bg-primary/20 text-primary" : "bg-secondary/20 text-secondary"}`}>
                          {log.type}
                        </span>
                        <span className="text-xs text-muted-foreground">{log.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Roster */}
            <GlassCard className="p-4 border-white/5 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm flex items-center gap-2"><Users className="w-4 h-4" />Student Roster</h3>
                  <span className="text-xs text-muted-foreground">{presentIds.size}/{enrolledStudents.length} present</span>
                </div>
                <div className="space-y-1.5 max-h-[220px] overflow-y-auto no-scrollbar">
                  {enrolledStudents.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      {selectedSubject ? "No students enrolled." : "Select a subject to see roster."}
                    </p>
                  ) : enrolledStudents.map((stu: any) => {
                    const isPresent = presentIds.has(stu.student_id);
                    return (
                      <div key={stu.student_id} className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${isPresent ? "bg-success/10 border border-success/20" : "bg-black/20 border border-white/5"}`}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${isPresent ? "bg-success" : "bg-muted-foreground/30"}`} />
                          <span className="text-sm font-medium truncate max-w-[130px]">{stu.name}</span>
                        </div>
                        <span className={`text-xs font-bold ${isPresent ? "text-success" : "text-muted-foreground"}`}>
                          {isPresent ? "P" : "—"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {enrolledStudents.length > 0 && (
                <div className="mt-3 border-t border-white/5 pt-3">
                  <div className="w-full h-1.5 bg-black/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-success rounded-full transition-all duration-500"
                      style={{ width: `${Math.round((presentIds.size / enrolledStudents.length) * 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-right mt-1">
                    {Math.round((presentIds.size / enrolledStudents.length) * 100)}% attendance
                  </p>
                </div>
              )}
            </GlassCard>

          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function LiveAttendance() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="text-muted-foreground">Loading…</div></div>}>
      <LiveAttendanceInner />
    </Suspense>
  );
}
