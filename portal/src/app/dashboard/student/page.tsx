"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { GlassCard } from "@/components/shared/GlassCard";
import { AnimatedCounter } from "@/components/shared/AnimatedCounter";
import {
  Trophy, BrainCircuit, Target, Sparkles, BookOpen, Clock,
  CheckCircle, XCircle, TrendingUp, AlertTriangle
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function StudentDashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  // Computed stats
  const totalClasses = attendanceLogs.length;
  const presentClasses = attendanceLogs.filter(l => l.is_present).length;
  const attendancePercent = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0;
  const absentClasses = totalClasses - presentClasses;

  // Per-subject breakdown
  const subjectBreakdown = subjects.reduce((acc: any[], sub: any) => {
    const logs = attendanceLogs.filter(l => l.subject_id === sub.subject_id);
    if (logs.length === 0) return acc;
    const present = logs.filter(l => l.is_present).length;
    acc.push({
      ...sub,
      total: logs.length,
      present,
      percent: Math.round((present / logs.length) * 100)
    });
    return acc;
  }, []);

  // Recent logs (last 5)
  const recentLogs = [...attendanceLogs]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  // Low attendance warning
  const atRiskSubjects = subjectBreakdown.filter(s => s.percent < 75);

  useEffect(() => {
    async function resolveSession() {
      let currentUser: any = null;

      // 1. Check for existing portal session
      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          currentUser = JSON.parse(userStr);
        } catch {
          localStorage.removeItem("user");
          localStorage.removeItem("token");
        }
      }

      // 2. No local session — try SSO bridge from landing page
      if (!currentUser) {
        try {
          const meRes = await fetch("http://localhost:3000/api/auth/me", {
            credentials: "include",
          });
          if (meRes.ok) {
            const { user: landingUser } = await meRes.json();
            if (landingUser?.email) {
              const profileRes = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/auth/profile-by-email`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ email: landingUser.email }),
                }
              );
              if (profileRes.ok) {
                const { role, token, user } = await profileRes.json();
                localStorage.setItem("token", token);
                localStorage.setItem("user", JSON.stringify(user));
                if (role === "teacher") {
                  window.location.href = "/portal/dashboard/teacher";
                  return;
                }
                currentUser = user;
              }
            }
          }
        } catch {
          // SSO bridge unavailable, fall through to login redirect
        }
      }

      // 3. Still no user — redirect to student login
      if (!currentUser) {
        window.location.href = "/portal/login/student";
        return;
      }

      // 4. Wrong role — redirect teachers away
      if (currentUser.teacher_id != null) {
        window.location.href = "/portal/dashboard/teacher";
        return;
      }

      setUser(currentUser);

      const fetchData = async () => {
        try {
          setLoading(true);
          const [attRes, subRes] = await Promise.all([
            fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/attendance/student/${currentUser.student_id}`),
            fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/subjects/student/${currentUser.student_id}`)
          ]);
          if (attRes.ok) {
            const data = await attRes.json();
            setAttendanceLogs(data.logs || []);
          }
          if (subRes.ok) {
            const data = await subRes.json();
            setSubjects(data.subjects?.map((s: any) => s.subjects).filter(Boolean) || []);
          }
        } catch (err) {
          console.error("Failed to fetch student dashboard data", err);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }

    resolveSession();
  }, []);

  const formatTime = (ts: string) => {
    try {
      const date = new Date(ts);
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
        " " + date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    } catch { return ts; }
  };

  const firstName = user?.name?.split(" ")[0] || "Student";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{greeting}, {firstName} 👋</h1>
            <p className="text-muted-foreground mt-1">Here is your attendance overview for this semester.</p>
          </div>
          <div className="flex items-center gap-2 bg-black/20 border border-white/5 rounded-full px-4 py-2 self-start">
            <Trophy className="w-4 h-4 text-warning" />
            <span className="text-sm font-medium">
              {attendancePercent >= 90 ? "Excellent Attendance 🏆" : attendancePercent >= 75 ? "Good Standing ✅" : "Needs Improvement ⚠️"}
            </span>
          </div>
        </div>

        {/* At-Risk Warning */}
        {!loading && atRiskSubjects.length > 0 && (
          <GlassCard className="p-4 border-warning/30 bg-warning/5 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-warning">Low Attendance Warning</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                You are below 75% in: <span className="text-foreground font-medium">{atRiskSubjects.map(s => s.subject_code).join(", ")}</span>. Attend upcoming classes to improve.
              </p>
            </div>
          </GlassCard>
        )}

        <div className="grid gap-6 md:grid-cols-3">

          {/* Circular Progress */}
          <GlassCard className="col-span-1 p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
            <h3 className="text-sm font-medium text-muted-foreground mb-6">Overall Attendance</h3>

            <div className="relative w-48 h-48 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-white/5" />
                <motion.circle
                  cx="96" cy="96" r="88"
                  stroke="currentColor" strokeWidth="12" fill="transparent"
                  strokeDasharray={2 * Math.PI * 88}
                  initial={{ strokeDashoffset: 2 * Math.PI * 88 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 88 * (1 - attendancePercent / 100) }}
                  transition={{ duration: 2, ease: "easeOut" }}
                  strokeLinecap="round"
                  className={attendancePercent >= 75 ? "text-primary drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" : "text-warning drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]"}
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-5xl font-bold text-foreground">
                  {loading ? "..." : <><AnimatedCounter value={attendancePercent} />%</>}
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  {loading ? "" : attendancePercent >= 90 ? "Excellent" : attendancePercent >= 75 ? "On Track" : "At Risk"}
                </span>
              </div>
            </div>

            {/* Stats below circle */}
            <div className="mt-6 w-full grid grid-cols-2 gap-3">
              <div className="bg-success/10 rounded-xl p-3 text-center border border-success/20">
                <p className="text-lg font-bold text-success"><AnimatedCounter value={presentClasses} /></p>
                <p className="text-xs text-muted-foreground">Present</p>
              </div>
              <div className="bg-error/10 rounded-xl p-3 text-center border border-error/20">
                <p className="text-lg font-bold text-error"><AnimatedCounter value={absentClasses} /></p>
                <p className="text-xs text-muted-foreground">Absent</p>
              </div>
            </div>

            {/* AI Prediction */}
            <div className="mt-4 w-full">
              <div className="flex items-start gap-3 bg-primary/10 rounded-xl p-4 text-left border border-primary/20">
                <BrainCircuit className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">AI Insight</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {attendancePercent < 75
                      ? `You need to attend ${Math.ceil((0.75 * totalClasses - presentClasses) / 0.25)} more consecutive classes to reach 75%.`
                      : attendancePercent < 90
                      ? `Attend your next ${Math.ceil((0.90 * totalClasses - presentClasses) / 0.10)} classes to reach 90%.`
                      : "Great job! Keep attending to maintain your excellent record."}
                  </p>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Right Column */}
          <div className="col-span-1 md:col-span-2 flex flex-col gap-6">

            {/* Per-Subject Breakdown */}
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold">Subject-wise Attendance</h3>
                <Link href="/dashboard/subjects" className="text-sm text-primary hover:underline">View Subjects</Link>
              </div>
              {loading ? (
                <p className="text-muted-foreground text-sm">Loading...</p>
              ) : subjectBreakdown.length === 0 ? (
                <p className="text-muted-foreground text-sm">No subjects enrolled yet.</p>
              ) : (
                <div className="space-y-4">
                  {subjectBreakdown.map((sub) => (
                    <div key={sub.subject_id}>
                      <div className="flex justify-between items-center mb-1">
                        <div>
                          <span className="text-sm font-medium">{sub.subject_code}</span>
                          <span className="text-xs text-muted-foreground ml-2">{sub.name}</span>
                        </div>
                        <span className={`text-sm font-bold ${sub.percent >= 75 ? "text-success" : "text-warning"}`}>
                          {sub.percent}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${sub.percent >= 75 ? "bg-success" : "bg-warning"}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${sub.percent}%` }}
                          transition={{ duration: 1, ease: "easeOut", delay: 0.1 }}
                        />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-muted-foreground">{sub.present} of {sub.total} classes attended</span>
                        {sub.percent < 75 && (
                          <span className="text-xs text-warning flex items-center gap-0.5">
                            <TrendingUp className="w-3 h-3" /> Below threshold
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>

            {/* Recent Activity */}
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold">Recent Attendance</h3>
                <Link href="/dashboard/attendance" className="text-sm text-primary hover:underline">View All</Link>
              </div>
              {loading ? (
                <p className="text-muted-foreground text-sm">Loading...</p>
              ) : recentLogs.length === 0 ? (
                <p className="text-muted-foreground text-sm">No attendance records yet.</p>
              ) : (
                <div className="space-y-3">
                  {recentLogs.map((log) => (
                    <div key={log.attendance_id} className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-black/20 hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${log.is_present ? "bg-success/20 text-success" : "bg-error/20 text-error"}`}>
                          {log.is_present ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{log.subjects?.subject_code || "Unknown"}</p>
                          <p className="text-xs text-muted-foreground">{log.subjects?.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">{formatTime(log.timestamp)}</p>
                        <span className={`text-xs font-medium ${log.is_present ? "text-success" : "text-error"}`}>
                          {log.is_present ? "Present" : "Absent"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>

            {/* Gamification Row */}
            <div className="grid grid-cols-2 gap-4">
              <GlassCard className="p-5 bg-gradient-to-br from-secondary/10 to-transparent border-secondary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-secondary" />
                  <h3 className="font-semibold text-sm">Achievement</h3>
                </div>
                <p className="text-xl font-bold">
                  {attendancePercent >= 90 ? "Perfect Attendance 🏆" : attendancePercent >= 75 ? "Good Standing ✅" : "Keep It Up 💪"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{totalClasses} total classes tracked</p>
              </GlassCard>

              <GlassCard className="p-5 bg-gradient-to-br from-accent/10 to-transparent border-accent/20">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-4 h-4 text-accent" />
                  <h3 className="font-semibold text-sm">Enrolled Subjects</h3>
                </div>
                <p className="text-3xl font-bold text-accent">{subjects.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Active this semester</p>
              </GlassCard>
            </div>

          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
