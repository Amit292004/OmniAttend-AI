"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { GlassCard } from "@/components/shared/GlassCard";
import { Button } from "@/components/ui/button";
import {
  Camera, Mic, Play, Pause, Square, ScanFace,
  CheckCircle2, AlertCircle, Clock, MicOff,
  StopCircle, Radio, Users, Trash2, UploadCloud, Loader2,
  XCircle, CheckCircle, Save, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";

// ─── Types ───────────────────────────────────────────────────────────────────

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

interface ReviewRow {
  student_id: number;
  name: string;
  source: string;
  is_present: boolean;
}

interface ReviewDialogProps {
  rows: ReviewRow[];
  logs: Array<{ student_id: number; subject_id: number; timestamp: string; is_present: boolean }>;
  analysisType: "Face" | "Voice";
  onConfirm: (finalLogs: Array<{ student_id: number; subject_id: number; timestamp: string; is_present: boolean }>) => Promise<void>;
  onDiscard: () => void;
  saving: boolean;
}

// ─── Review Dialog Component ─────────────────────────────────────────────────

function ReviewDialog({ rows: initialRows, logs: initialLogs, analysisType, onConfirm, onDiscard, saving }: ReviewDialogProps) {
  const [rows, setRows] = useState<ReviewRow[]>(initialRows);

  const toggleStatus = (studentId: number) => {
    setRows(prev => prev.map(r =>
      r.student_id === studentId ? { ...r, is_present: !r.is_present } : r
    ));
  };

  const handleConfirm = async () => {
    // Build final logs based on the (possibly edited) rows
    const finalLogs = initialLogs.map(log => ({
      ...log,
      is_present: rows.find(r => r.student_id === log.student_id)?.is_present ?? log.is_present
    }));
    await onConfirm(finalLogs);
  };

  const presentCount = rows.filter(r => r.is_present).length;
  const absentCount = rows.length - presentCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        className="bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]"
      >
        {/* Dialog Header */}
        <div className="flex items-start justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              {analysisType === "Face" ? <ScanFace className="w-5 h-5 text-primary" /> : <Mic className="w-5 h-5 text-secondary" />}
              Review {analysisType} Attendance
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Review results below. You can toggle statuses before confirming.
            </p>
          </div>
          <button onClick={onDiscard} className="text-muted-foreground hover:text-white transition-colors mt-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary Chips */}
        <div className="flex gap-4 px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/20">
            <CheckCircle className="w-4 h-4 text-success" />
            <span className="text-sm font-semibold text-success">{presentCount} Present</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-error/10 border border-error/20">
            <XCircle className="w-4 h-4 text-error" />
            <span className="text-sm font-semibold text-error">{absentCount} Absent</span>
          </div>
          <div className="ml-auto text-xs text-muted-foreground flex items-center">
            Click any row to toggle status
          </div>
        </div>

        {/* Roster Table */}
        <div className="overflow-y-auto flex-1">
          <table className="w-full border-collapse text-left">
            <thead className="sticky top-0 bg-zinc-900 z-10">
              <tr className="border-b border-white/10 text-xs font-semibold text-muted-foreground uppercase">
                <th className="px-6 py-3">Student Name</th>
                <th className="px-6 py-3">Detection Source</th>
                <th className="px-6 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.map((row) => (
                <tr
                  key={row.student_id}
                  onClick={() => toggleStatus(row.student_id)}
                  className={`cursor-pointer transition-colors hover:bg-white/5 ${row.is_present ? "bg-success/5" : ""}`}
                >
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${row.is_present ? "bg-success" : "bg-muted-foreground/30"}`} />
                      <span className="text-sm font-medium">{row.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-sm text-muted-foreground">{row.source || "—"}</td>
                  <td className="px-6 py-3 text-right">
                    {row.is_present ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-success/15 text-success border border-success/20">
                        <CheckCircle className="w-3 h-3" /> Present
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-error/15 text-error border border-error/20">
                        <XCircle className="w-3 h-3" /> Absent
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between p-6 border-t border-white/10">
          <Button variant="ghost" onClick={onDiscard} disabled={saving} className="text-muted-foreground">
            <X className="w-4 h-4 mr-2" /> Discard
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={saving}
            className="bg-success text-white hover:bg-success/90 px-6"
          >
            {saving ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</>
            ) : (
              <><Save className="w-4 h-4 mr-2" /> Confirm & Save</>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Toast Component ──────────────────────────────────────────────────────────

function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl border ${
        type === "success"
          ? "bg-success/10 border-success/30 text-success"
          : "bg-error/10 border-error/30 text-error"
      }`}
    >
      {type === "success" ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100"><X className="w-4 h-4" /></button>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

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

  // ─── Review Dialog State ───────────────────────────────
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewRows, setReviewRows] = useState<ReviewRow[]>([]);
  const [pendingLogs, setPendingLogs] = useState<any[]>([]);
  const [pendingAnalysisType, setPendingAnalysisType] = useState<"Face" | "Voice">("Face");
  const [saving, setSaving] = useState(false);

  // ─── Toast ─────────────────────────────────────────────
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const showToast = (message: string, type: "success" | "error") => setToast({ message, type });

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

  // ─── Run Face Analysis → open Review Dialog ────────────
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
        // Clean up URLs and empty gallery
        gallery.forEach(p => URL.revokeObjectURL(p.url));
        setGallery([]);
        // Open Review Dialog
        setReviewRows(data.results || []);
        setPendingLogs(data.logs || []);
        setPendingAnalysisType("Face");
        setReviewOpen(true);
      } else {
        const e = await res.json();
        showToast(e.detail || "Face analysis failed.", "error");
      }
    } catch {
      showToast("Connection error executing face analysis.", "error");
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
    } catch { showToast("Microphone access denied.", "error"); }
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
        setRecordedBlob(null);
        setRecordingTime(0);
        // Open Review Dialog
        setReviewRows(data.results || []);
        setPendingLogs(data.logs || []);
        setPendingAnalysisType("Voice");
        setReviewOpen(true);
      } else {
        const e = await res.json();
        showToast(e.detail || "Voice processing failed.", "error");
      }
    } catch { showToast("Connection error.", "error"); }
    finally { setVoiceProcessing(false); }
  };

  // ─── Confirm & Save ────────────────────────────────────
  const handleConfirmSave = async (finalLogs: any[]) => {
    setSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/attendance/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logs: finalLogs })
      });
      if (res.ok) {
        // Update the local roster
        const presentSet = new Set(finalLogs.filter(l => l.is_present).map(l => l.student_id as number));
        setPresentIds(prev => { const next = new Set(prev); presentSet.forEach(id => next.add(id)); return next; });

        // Add entries to the recognition log
        const newLogEntries: LogEntry[] = finalLogs
          .filter(l => l.is_present)
          .map(l => {
            const stu = enrolledStudents.find((s: any) => s.student_id === l.student_id);
            return {
              name: stu?.name || `Student #${l.student_id}`,
              studentId: l.student_id,
              type: pendingAnalysisType,
              time: "Just now",
              success: true
            };
          });
        setLogs(prev => [...newLogEntries, ...prev]);

        setReviewOpen(false);
        showToast(`✅ Attendance saved! ${finalLogs.filter(l => l.is_present).length} students marked present.`, "success");
      } else {
        const errorText = await res.text();
        showToast(`Failed to save: ${res.status} ${errorText.substring(0, 50)}`, "error");
      }
    } catch (err: any) {
      showToast(`Connection error: ${err.message}`, "error");
    } finally {
      setSaving(false);
    }
  };

  const subjectObj = subjects.find(s => String(s.subject_id) === selectedSubject);

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">

        {/* Review Dialog (shown on top when open) */}
        <AnimatePresence>
          {reviewOpen && (
            <ReviewDialog
              rows={reviewRows}
              logs={pendingLogs}
              analysisType={pendingAnalysisType}
              onConfirm={handleConfirmSave}
              onDiscard={() => setReviewOpen(false)}
              saving={saving}
            />
          )}
        </AnimatePresence>

        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
          )}
        </AnimatePresence>

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
                  <p className="text-sm text-muted-foreground text-center pt-8">No confirmed sessions yet.</p>
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
