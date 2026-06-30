"use client";

import React, { useEffect, useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { GlassCard } from "@/components/shared/GlassCard";
import { AnimatedCounter } from "@/components/shared/AnimatedCounter";
import {
  TrendingDown, TrendingUp, AlertTriangle, ShieldCheck,
  BrainCircuit, Download, Users, BookOpen, UserCheck, UserX, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
  AreaChart, Area, LineChart, Line
} from "recharts";

export default function AnalyticsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) return;
    const u = JSON.parse(stored);
    setUser(u);
    if (u.teacher_id == null) return; // student guard

    fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://omniattend-backend-production.up.railway.app"}/api/attendance/teacher/${u.teacher_id}`)
      .then(r => r.json())
      .then(data => { setLogs(data.logs || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // ── Derived Stats ────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = logs.length;
    const present = logs.filter(l => l.is_present).length;
    const absent = total - present;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;

    // Unique students
    const uniqueStudents = new Set(logs.map(l => l.student_id)).size;

    // At-risk: students below 75% across all their logs
    const studentMap: Record<number, { p: number; t: number }> = {};
    logs.forEach(l => {
      const sid = l.student_id;
      if (!studentMap[sid]) studentMap[sid] = { p: 0, t: 0 };
      studentMap[sid].t++;
      if (l.is_present) studentMap[sid].p++;
    });
    const atRisk = Object.values(studentMap).filter(v => v.t > 0 && (v.p / v.t) < 0.75).length;

    return { total, present, absent, rate, uniqueStudents, atRisk };
  }, [logs]);

  // ── Daily Trend (last 14 days) ────────────────────────────────
  const dailyTrend = useMemo(() => {
    const days: Record<string, { present: number; absent: number }> = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      days[d.toISOString().split("T")[0]] = { present: 0, absent: 0 };
    }
    logs.forEach(l => {
      const day = (l.timestamp || "").split("T")[0];
      if (days[day]) {
        if (l.is_present) days[day].present++;
        else days[day].absent++;
      }
    });
    return Object.entries(days).map(([date, v]) => ({
      name: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      present: v.present,
      absent: v.absent,
      rate: (v.present + v.absent) > 0 ? Math.round((v.present / (v.present + v.absent)) * 100) : 0
    }));
  }, [logs]);

  // ── Per-Subject Attendance ────────────────────────────────────
  const subjectData = useMemo(() => {
    const map: Record<string, { code: string; p: number; t: number }> = {};
    logs.forEach(l => {
      const code = l.subjects?.subject_code || `Sub${l.subject_id}`;
      if (!map[code]) map[code] = { code, p: 0, t: 0 };
      map[code].t++;
      if (l.is_present) map[code].p++;
    });
    return Object.values(map).map(v => ({
      name: v.code,
      attendance: v.t > 0 ? Math.round((v.p / v.t) * 100) : 0,
      present: v.p,
      total: v.t
    })).sort((a, b) => b.attendance - a.attendance);
  }, [logs]);

  // ── Hourly Heatmap (which hours attendance is most common) ───
  const hourlyData = useMemo(() => {
    const hours: Record<number, number> = {};
    for (let h = 7; h <= 19; h++) hours[h] = 0;
    logs.forEach(l => {
      if (!l.timestamp) return;
      const h = new Date(l.timestamp).getHours();
      if (hours[h] !== undefined) hours[h]++;
    });
    return Object.entries(hours).map(([h, count]) => ({
      hour: `${h}:00`,
      sessions: count
    }));
  }, [logs]);

  // ── Biometric source breakdown (from method field or tag) ────
  const biometricData = useMemo(() => {
    const face = logs.filter(l => !l.method || l.method === "face").length;
    const voice = logs.filter(l => l.method === "voice").length;
    const qr = logs.filter(l => l.method === "qr").length;
    const total = face + voice + qr || 1;
    return [
      { name: "Face ID", value: Math.round((face / total) * 100) || face, color: "#3B82F6" },
      { name: "Voice ID", value: Math.round((voice / total) * 100) || voice, color: "#8B5CF6" },
      { name: "QR Code", value: Math.round((qr / total) * 100) || qr, color: "#22C55E" },
    ];
  }, [logs]);

  // ── Export Handler ───────────────────────────────────────────
  const handleExport = () => {
    if (!user) return;
    const today = new Date().toISOString().split("T")[0];
    const monthAgo = new Date(Date.now() - 30 * 864e5).toISOString().split("T")[0];
    const code = subjectData[0]?.name || "ALL";
    window.open(
      `${process.env.NEXT_PUBLIC_API_URL || "https://omniattend-backend-production.up.railway.app"}/api/attendance/export?teacher_id=${user.teacher_id}&subject_code=${code}&start_date=${monthAgo}&end_date=${today}`,
      "_blank"
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">AI Analytics</h1>
            <p className="text-muted-foreground mt-1">
              Real-time insights from <span className="text-foreground font-medium">{logs.length} attendance records</span>
            </p>
          </div>
          <Button onClick={handleExport} variant="outline" className="border-white/10 hover:bg-white/5">
            <Download className="w-4 h-4 mr-2" /> Export Excel
          </Button>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: UserCheck, label: "Present", value: stats.present, color: "text-success", bg: "bg-success/10", border: "border-success/20" },
            { icon: UserX, label: "Absent", value: stats.absent, color: "text-error", bg: "bg-error/10", border: "border-error/20" },
            { icon: Users, label: "Students Tracked", value: stats.uniqueStudents, color: "text-primary", bg: "bg-primary/10", border: "border-primary/20" },
            { icon: AlertTriangle, label: "At-Risk (<75%)", value: stats.atRisk, color: "text-warning", bg: "bg-warning/10", border: "border-warning/20" },
          ].map(({ icon: Icon, label, value, color, bg, border }) => (
            <GlassCard key={label} className={`p-5 border ${border}`}>
              <div className={`inline-flex p-2 rounded-lg ${bg} mb-3`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div className={`text-3xl font-bold ${color}`}><AnimatedCounter value={value} /></div>
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
            </GlassCard>
          ))}
        </div>

        {/* Overall Rate + AI Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          <GlassCard className="p-6 border-warning/30 bg-warning/5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-warning/20 rounded-lg"><AlertTriangle className="w-5 h-5 text-warning" /></div>
              <h3 className="font-semibold">At-Risk Students</h3>
            </div>
            <div className="flex items-end gap-3">
              <span className="text-4xl font-bold text-warning"><AnimatedCounter value={stats.atRisk} /></span>
              <span className="text-sm text-muted-foreground mb-1">of {stats.uniqueStudents} total</span>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              {stats.atRisk === 0 ? "All students are above 75% — great job!" : `${stats.atRisk} student(s) below 75%. Early intervention recommended.`}
            </p>
          </GlassCard>

          <GlassCard className="p-6 border-success/30 bg-success/5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-success/20 rounded-lg"><TrendingUp className="w-5 h-5 text-success" /></div>
              <h3 className="font-semibold">Overall Rate</h3>
            </div>
            <div className="flex items-end gap-3">
              <span className="text-4xl font-bold text-success"><AnimatedCounter value={stats.rate} />%</span>
              <span className="text-sm text-muted-foreground mb-1">attendance</span>
            </div>
            <div className="w-full h-2 bg-black/30 rounded-full overflow-hidden mt-4">
              <div className="h-full bg-success rounded-full transition-all duration-700" style={{ width: `${stats.rate}%` }} />
            </div>
          </GlassCard>

          <GlassCard className="p-6 border-primary/30 bg-primary/5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/20 rounded-lg"><ShieldCheck className="w-5 h-5 text-primary" /></div>
              <h3 className="font-semibold">Total Records</h3>
            </div>
            <div className="flex items-end gap-3">
              <span className="text-4xl font-bold text-primary"><AnimatedCounter value={logs.length} /></span>
              <span className="text-sm text-muted-foreground mb-1">log entries</span>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Across {subjectData.length} subject(s). Face & Voice biometrics powered.
            </p>
          </GlassCard>
        </div>

        {/* 14-Day Trend Chart */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold">14-Day Attendance Trend</h3>
              <p className="text-sm text-muted-foreground">Daily present vs absent across all subjects</p>
            </div>
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradPresent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradAbsent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="name" stroke="#A1A1AA" tick={{ fill: "#A1A1AA", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#A1A1AA" tick={{ fill: "#A1A1AA" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "#111113", borderColor: "#ffffff10", borderRadius: "12px" }} itemStyle={{ color: "#FAFAFA" }} />
                <Area type="monotone" dataKey="present" name="Present" stroke="#22C55E" strokeWidth={2} fill="url(#gradPresent)" dot={false} />
                <Area type="monotone" dataKey="absent" name="Absent" stroke="#EF4444" strokeWidth={2} fill="url(#gradAbsent)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Subject Comparison + Biometric Donut */}
        <div className="grid lg:grid-cols-2 gap-6">

          <GlassCard className="p-6 flex flex-col">
            <h3 className="font-semibold mb-6">Subject-wise Attendance Rate</h3>
            <div className="flex-1 h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="name" stroke="#A1A1AA" tick={{ fill: "#A1A1AA" }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} stroke="#A1A1AA" tick={{ fill: "#A1A1AA" }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#111113", borderColor: "#ffffff10", borderRadius: "12px" }}
                    itemStyle={{ color: "#FAFAFA" }}
                    formatter={(v: any, name: any, props: any) => [`${v}% (${props.payload.present}/${props.payload.total})`, "Attendance"]}
                  />
                  <Bar dataKey="attendance" radius={[6, 6, 0, 0]}
                    fill="url(#barGrad)"
                    label={{ position: "top", fill: "#A1A1AA", fontSize: 11, formatter: (v: any) => `${v}%` }}
                  >
                    {subjectData.map((entry, i) => (
                      <Cell key={i} fill={entry.attendance >= 75 ? "#3B82F6" : "#EF4444"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          <GlassCard className="p-6 flex flex-col">
            <h3 className="font-semibold mb-6">Biometric Modality Usage</h3>
            <div className="flex-1 h-[320px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={biometricData} cx="50%" cy="45%" innerRadius={80} outerRadius={110}
                    paddingAngle={5} dataKey="value" stroke="none">
                    {biometricData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "#111113", borderColor: "#ffffff10", borderRadius: "12px" }} itemStyle={{ color: "#FAFAFA" }}
                    formatter={(v: any) => [`${v}%`, ""]} />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: "12px", color: "#A1A1AA" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ marginTop: "-40px" }}>
                <BrainCircuit className="w-8 h-8 text-muted-foreground opacity-40" />
              </div>
            </div>
          </GlassCard>

        </div>

        {/* Hourly Activity Heatmap */}
        <GlassCard className="p-6">
          <h3 className="font-semibold mb-6">Attendance by Hour of Day</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="hour" stroke="#A1A1AA" tick={{ fill: "#A1A1AA", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#A1A1AA" tick={{ fill: "#A1A1AA" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "#111113", borderColor: "#ffffff10", borderRadius: "12px" }} itemStyle={{ color: "#FAFAFA" }} />
                <Bar dataKey="sessions" name="Sessions" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

      </div>
    </DashboardLayout>
  );
}
