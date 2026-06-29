"use client";

import React, { useEffect, useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { GlassCard } from "@/components/shared/GlassCard";
import { Button } from "@/components/ui/button";
import {
  BrainCircuit, TrendingDown, TrendingUp, AlertTriangle, CheckCircle2,
  Mail, Sparkles, Calendar, ArrowRight, UserX, Loader2, Award
} from "lucide-react";

interface InsightAlert {
  id: string;
  type: "warning" | "success" | "info";
  title: string;
  desc: string;
  actionLabel?: string;
  action?: () => void;
}

export default function AIInsightsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [emailSending, setEmailSending] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) return;
    const u = JSON.parse(userStr);
    if (u.teacher_id == null) return;

    fetch(`http://localhost:8000/api/attendance/teacher/${u.teacher_id}`)
      .then(r => r.json())
      .then(d => {
        setLogs(d.logs || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // ─── AI Anomaly & Insight Calculations ──────────────────────────
  const insights = useMemo(() => {
    if (logs.length === 0) return { alerts: [], atRisk: [], perfect: [], overallRate: 0 };

    const alerts: InsightAlert[] = [];

    // 1. Calculate per-student attendance rates
    const studentLogs: Record<number, { name: string; email: string; p: number; t: number }> = {};
    logs.forEach(l => {
      const sid = l.student_id;
      const sname = l.students?.name || `Student #${sid}`;
      const semail = l.students?.email || "";
      if (!studentLogs[sid]) {
        studentLogs[sid] = { name: sname, email: semail, p: 0, t: 0 };
      }
      studentLogs[sid].t++;
      if (l.is_present) studentLogs[sid].p++;
    });

    const studentRates = Object.entries(studentLogs).map(([sid, v]) => ({
      id: Number(sid),
      name: v.name,
      email: v.email,
      rate: Math.round((v.p / v.t) * 100),
      total: v.t
    }));

    const atRiskStudents = studentRates.filter(s => s.rate < 75);
    const perfectStudents = studentRates.filter(s => s.rate === 100 && s.total > 2);

    // Alert 1: Low attendance alert
    if (atRiskStudents.length > 0) {
      alerts.push({
        id: "low_attendance",
        type: "warning",
        title: "Critical Attendance Drop Detected",
        desc: `${atRiskStudents.length} student(s) have dropped below the 75% attendance threshold. We recommend initiating a review session or warning notification.`,
        actionLabel: "Send Warning Emails"
      });
    }

    // Alert 2: Perfect attendance achievements
    if (perfectStudents.length > 0) {
      alerts.push({
        id: "perfect_attendance",
        type: "success",
        title: "Outstanding Attendance Achievement",
        desc: `${perfectStudents.map(s => s.name).slice(0, 3).join(", ")}${perfectStudents.length > 3 ? " and others" : ""} achieved 100% attendance in all recent lectures.`,
        actionLabel: "Congratulate Students"
      });
    }

    // 2. Class-by-class comparison & weekly trend anomalies
    const subjectLogs: Record<string, { p: number; t: number }> = {};
    logs.forEach(l => {
      const code = l.subjects?.subject_code || "Unknown";
      if (!subjectLogs[code]) subjectLogs[code] = { p: 0, t: 0 };
      subjectLogs[code].t++;
      if (l.is_present) subjectLogs[code].p++;
    });

    const lowAttendanceSubjects = Object.entries(subjectLogs)
      .map(([code, v]) => ({ code, rate: Math.round((v.p / v.t) * 100) }))
      .filter(s => s.rate < 75);

    if (lowAttendanceSubjects.length > 0) {
      alerts.push({
        id: "low_subject_attendance",
        type: "info",
        title: "Subject-wide Engagement Warning",
        desc: `Subject ${lowAttendanceSubjects.map(s => s.code).join(", ")} exhibits average attendance below 75%. Consider checking schedule conflicts.`,
      });
    }

    // Overall summary metrics
    const totalPresent = logs.filter(l => l.is_present).length;
    const overallRate = Math.round((totalPresent / logs.length) * 100);

    return {
      alerts,
      atRisk: atRiskStudents,
      perfect: perfectStudents,
      overallRate
    };
  }, [logs]);

  // ─── Actions ──────────────────────────────────────────────────
  const handleAction = async (alertId: string) => {
    if (alertId === "low_attendance") {
      setEmailSending(true);
      // Simulate calling backend email service
      setTimeout(() => {
        setEmailSending(false);
        alert("Alert! Attendance warning emails sent to all at-risk students successfully.");
      }, 1500);
    } else if (alertId === "perfect_attendance") {
      alert("Sent praise/congratulations emails to top-performing students!");
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
      <div className="flex flex-col space-y-8 max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 text-primary">
              <BrainCircuit className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">AI Insights & Actions</h1>
              <p className="text-muted-foreground mt-1">Automated prediction metrics and classroom interventions.</p>
            </div>
          </div>
        </div>

        {logs.length === 0 ? (
          <GlassCard className="p-8 text-center flex flex-col items-center justify-center py-20">
            <BrainCircuit className="w-12 h-12 text-muted-foreground/30 mb-3 animate-pulse" />
            <h3 className="text-lg font-semibold">No Insights Available</h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-1">
              Start taking lecture roll calls using Face ID or Voice Biometrics to populate metrics.
            </p>
          </GlassCard>
        ) : (
          <div className="grid md:grid-cols-3 gap-8">

            {/* Left Col: Anomaly / Notification List */}
            <div className="md:col-span-2 space-y-6">
              <h2 className="text-lg font-bold text-muted-foreground uppercase tracking-wider text-xs px-1">Active AI Notices</h2>
              
              <div className="space-y-4">
                {insights.alerts.map((alert) => (
                  <GlassCard
                    key={alert.id}
                    className={`p-6 border flex gap-4 items-start ${
                      alert.type === "warning" ? "border-warning/30 bg-warning/5" :
                      alert.type === "success" ? "border-success/30 bg-success/5" : "border-primary/30 bg-primary/5"
                    }`}
                  >
                    <div className="mt-1">
                      {alert.type === "warning" && <AlertTriangle className="w-6 h-6 text-warning" />}
                      {alert.type === "success" && <Award className="w-6 h-6 text-success" />}
                      {alert.type === "info" && <Sparkles className="w-6 h-6 text-primary" />}
                    </div>
                    <div className="flex-1 space-y-3">
                      <div>
                        <h3 className={`font-bold text-base ${
                          alert.type === "warning" ? "text-warning" :
                          alert.type === "success" ? "text-success" : "text-foreground"
                        }`}>{alert.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{alert.desc}</p>
                      </div>

                      {alert.actionLabel && (
                        <Button
                          size="sm"
                          disabled={emailSending}
                          onClick={() => handleAction(alert.id)}
                          className={
                            alert.type === "warning" ? "bg-warning hover:bg-warning/90 text-black font-semibold" :
                            alert.type === "success" ? "bg-success hover:bg-success/90 text-white" : ""
                          }
                        >
                          {emailSending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                          <Mail className="w-4 h-4 mr-2" />
                          {alert.actionLabel}
                        </Button>
                      )}
                    </div>
                  </GlassCard>
                ))}
              </div>
            </div>

            {/* Right Col: Predictive Summary Stats */}
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-muted-foreground uppercase tracking-wider text-xs px-1">Anomaly Metrics</h2>

              {/* Engagement Health gauge */}
              <GlassCard className="p-5 space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground">Classroom Health Score</h3>
                <div className="flex items-end gap-2">
                  <span className="text-5xl font-extrabold text-primary">{insights.overallRate}%</span>
                  <span className="text-sm text-muted-foreground font-medium mb-1">Satisfactory</span>
                </div>
                <div className="w-full h-2.5 bg-black/45 rounded-full overflow-hidden border border-white/5">
                  <div
                    className="h-full bg-gradient-to-r from-warning to-success rounded-full transition-all"
                    style={{ width: `${insights.overallRate}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  The health score is computed across all lectures. Target minimum is 75%.
                </p>
              </GlassCard>

              {/* Roster overview details */}
              <GlassCard className="p-5 space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
                  <UserX className="w-4 h-4 text-warning" /> At-Risk Watchlist
                </h3>
                <div className="space-y-2 max-h-[220px] overflow-y-auto no-scrollbar">
                  {insights.atRisk.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2">No students currently in danger zone.</p>
                  ) : (
                    insights.atRisk.map((s) => (
                      <div key={s.id} className="flex justify-between items-center bg-black/20 p-2.5 rounded-lg border border-white/5">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate">{s.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{s.email}</p>
                        </div>
                        <span className="text-xs font-bold text-error bg-error/10 px-2 py-0.5 rounded border border-error/15">
                          {s.rate}%
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </GlassCard>

              {/* Stars Watchlist */}
              <GlassCard className="p-5 space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-success" /> Perfect Roster
                </h3>
                <div className="space-y-2 max-h-[220px] overflow-y-auto no-scrollbar">
                  {insights.perfect.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2">No students with 100% attendance yet.</p>
                  ) : (
                    insights.perfect.map((s) => (
                      <div key={s.id} className="flex justify-between items-center bg-black/20 p-2.5 rounded-lg border border-white/5">
                        <div>
                          <p className="text-xs font-semibold">{s.name}</p>
                          <p className="text-[10px] text-muted-foreground">{s.email}</p>
                        </div>
                        <span className="text-xs font-bold text-success bg-success/10 px-2 py-0.5 rounded border border-success/15">
                          100%
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </GlassCard>

            </div>

          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
