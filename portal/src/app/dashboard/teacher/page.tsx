"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { GlassCard } from "@/components/shared/GlassCard";
import { AnimatedCounter } from "@/components/shared/AnimatedCounter";
import { Button } from "@/components/ui/button";
import {
  Users, UserCheck, UserX, BookOpen, BrainCircuit,
  Camera, AlertTriangle, TrendingUp, Calendar, ScanFace
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import Link from "next/link";

export default function TeacherDashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [allLogs, setAllLogs] = useState<any[]>([]);

  // Computed stats
  const totalSubjects = subjects.length;
  const totalStudents = subjects.reduce((acc, s) => acc + (s.total_students || 0), 0);
  const today = new Date().toISOString().split("T")[0];
  const todayLogs = allLogs.filter(l => (l.timestamp || "").startsWith(today));
  const presentToday = todayLogs.filter(l => l.is_present).length;
  const absentToday = todayLogs.filter(l => !l.is_present).length;
  const totalToday = todayLogs.length;
  const attendanceRateToday = totalToday > 0 ? Math.round((presentToday / totalToday) * 100) : 0;

  // Weekly chart data (last 7 days)
  const weeklyData = React.useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayLogs = allLogs.filter(l => (l.timestamp || "").startsWith(dateStr));
      const present = dayLogs.filter(l => l.is_present).length;
      const total = dayLogs.length;
      days.push({
        name: d.toLocaleDateString("en-US", { weekday: "short" }),
        attendance: total > 0 ? Math.round((present / total) * 100) : 0,
        present,
        total
      });
    }
    return days;
  }, [allLogs]);

  // Recent sessions (latest 5 unique)
  const recentSessions = React.useMemo(() => {
    const sessionMap: { [key: string]: any } = {};
    allLogs.forEach((log: any) => {
      const ts = (log.timestamp || "").split(".")[0];
      const key = `${log.subject_id}_${ts}`;
      if (!sessionMap[key]) {
        sessionMap[key] = {
          key,
          timestamp: ts,
          subject_id: log.subject_id,
          subject_code: log.subjects?.subject_code || "Unknown",
          subject_name: log.subjects?.name || "Unknown",
          present: 0, total: 0
        };
      }
      sessionMap[key].total += 1;
      if (log.is_present) sessionMap[key].present += 1;
    });
    return Object.values(sessionMap)
      .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);
  }, [allLogs]);

  // Low-attendance subjects
  const subjectAttendance = React.useMemo(() => {
    return subjects.map(sub => {
      const subLogs = allLogs.filter(l => l.subject_id === sub.subject_id);
      const present = subLogs.filter(l => l.is_present).length;
      return {
        ...sub,
        rate: subLogs.length > 0 ? Math.round((present / subLogs.length) * 100) : 0,
        sessions: Object.keys(
          subLogs.reduce((acc: any, l) => { acc[(l.timestamp || "").split(".")[0]] = 1; return acc; }, {})
        ).length
      };
    });
  }, [subjects, allLogs]);

  useEffect(() => {
    async function resolveSession() {
      let currentUser: any = null;

      // 1. Check for existing local session
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
                "http://localhost:8000/api/auth/profile-by-email",
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
                if (role !== "teacher") {
                  window.location.href = "/portal/dashboard/student";
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

      // 3. Still no user — redirect to teacher login
      if (!currentUser) {
        window.location.href = "/portal/login/teacher";
        return;
      }

      // 4. Wrong role — redirect students away
      if (currentUser.teacher_id == null) {
        window.location.href = "/portal/dashboard/student";
        return;
      }

      setUser(currentUser);

      const fetchData = async () => {
        try {
          setLoading(true);
          const [subRes, attRes] = await Promise.all([
            fetch(`http://localhost:8000/api/subjects/teacher/${currentUser.teacher_id}`),
            fetch(`http://localhost:8000/api/attendance/teacher/${currentUser.teacher_id}`)
          ]);
          if (subRes.ok) {
            const data = await subRes.json();
            setSubjects(data.subjects || []);
          }
          if (attRes.ok) {
            const data = await attRes.json();
            setAllLogs(data.logs || []);
          }
        } catch (err) {
          console.error("Failed to fetch teacher dashboard data", err);
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

  const firstName = user?.name?.split(" ")[0] || "Teacher";

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Welcome back, {firstName} 👋</h1>
            <p className="text-muted-foreground mt-1">Here is what's happening with your classes today.</p>
          </div>
          <div className="flex gap-3 self-start">
            <Link href="/dashboard/attendance/live">
              <Button className="bg-primary text-white gap-2 hover:bg-primary/90">
                <Camera className="w-4 h-4" /> Start Roll Call
              </Button>
            </Link>
          </div>
        </div>

        {/* Top Metrics */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <GlassCard className="p-5 flex flex-col gap-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <UserCheck className="w-20 h-20" />
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <UserCheck className="w-4 h-4 text-success" /> Present Today
            </div>
            <div className="text-4xl font-bold text-success">
              {loading ? "..." : <AnimatedCounter value={presentToday} />}
            </div>
            <p className="text-xs text-muted-foreground">{totalToday} total in sessions today</p>
          </GlassCard>

          <GlassCard className="p-5 flex flex-col gap-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <UserX className="w-20 h-20" />
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <UserX className="w-4 h-4 text-error" /> Absent Today
            </div>
            <div className="text-4xl font-bold text-error">
              {loading ? "..." : <AnimatedCounter value={absentToday} />}
            </div>
            <p className="text-xs text-muted-foreground">{attendanceRateToday}% rate today</p>
          </GlassCard>

          <GlassCard className="p-5 flex flex-col gap-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <BookOpen className="w-20 h-20" />
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <BookOpen className="w-4 h-4 text-primary" /> Active Subjects
            </div>
            <div className="text-4xl font-bold text-primary">
              {loading ? "..." : <AnimatedCounter value={totalSubjects} />}
            </div>
            <p className="text-xs text-muted-foreground">Courses this semester</p>
          </GlassCard>

          <GlassCard className="p-5 flex flex-col gap-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Users className="w-20 h-20" />
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Users className="w-4 h-4 text-secondary" /> Total Students
            </div>
            <div className="text-4xl font-bold text-secondary">
              {loading ? "..." : <AnimatedCounter value={totalStudents} />}
            </div>
            <p className="text-xs text-muted-foreground">Across all subjects</p>
          </GlassCard>
        </div>

        <div className="grid gap-6 lg:grid-cols-7">

          {/* Weekly Attendance Chart */}
          <GlassCard className="lg:col-span-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold">Weekly Attendance Rate</h3>
                <p className="text-sm text-muted-foreground">Attendance % across all your subjects (last 7 days)</p>
              </div>
              <div className="flex items-center gap-2 text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full border border-primary/20">
                <TrendingUp className="w-3 h-3" /> Live Data
              </div>
            </div>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="name" stroke="#A1A1AA" tick={{ fill: "#A1A1AA" }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} stroke="#A1A1AA" tick={{ fill: "#A1A1AA" }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#111113", borderColor: "#ffffff10", borderRadius: "12px" }}
                    itemStyle={{ color: "#FAFAFA" }}
                    formatter={(v: any) => [`${v}%`, "Attendance"]}
                  />
                  <Area type="monotone" dataKey="attendance" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorAttendance)" dot={{ fill: "#3B82F6", r: 4, strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          {/* Right Column */}
          <div className="lg:col-span-3 flex flex-col gap-6">

            {/* AI Insight */}
            <GlassCard className="p-5 bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-primary/20 rounded-xl shrink-0">
                  <BrainCircuit className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">AI Insight</h3>
                  {loading ? (
                    <p className="text-sm text-muted-foreground">Analyzing patterns...</p>
                  ) : allLogs.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No attendance data yet. Start a Roll Call to begin tracking.</p>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground mb-3">
                        {subjectAttendance.filter(s => s.rate < 75).length > 0
                          ? `${subjectAttendance.filter(s => s.rate < 75).length} subject(s) have attendance below 75%. Consider sending reminders.`
                          : "All subjects have good attendance rates. Keep it up!"}
                      </p>
                      {subjectAttendance.filter(s => s.rate < 75).length > 0 && (
                        <div className="flex items-center gap-2 text-xs bg-warning/10 text-warning px-3 py-2 rounded-lg border border-warning/20">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          Recommendation: Schedule intervention session.
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </GlassCard>

            {/* Quick Actions */}
            <GlassCard className="p-5">
              <h3 className="text-base font-semibold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-2">
                <Link href="/dashboard/attendance/live" className="col-span-1">
                  <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2 border-white/5 bg-black/20 hover:bg-white/5 hover:border-primary/50 transition-all">
                    <ScanFace className="w-5 h-5 text-primary" />
                    <span className="text-xs">Face Roll Call</span>
                  </Button>
                </Link>
                <Link href="/dashboard/subjects" className="col-span-1">
                  <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2 border-white/5 bg-black/20 hover:bg-white/5 hover:border-secondary/50 transition-all">
                    <BookOpen className="w-5 h-5 text-secondary" />
                    <span className="text-xs">Manage Subjects</span>
                  </Button>
                </Link>
                <Link href="/dashboard/attendance" className="col-span-1">
                  <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2 border-white/5 bg-black/20 hover:bg-white/5 transition-all">
                    <Calendar className="w-5 h-5 text-accent" />
                    <span className="text-xs">Attendance Logs</span>
                  </Button>
                </Link>
                <Link href="/dashboard/analytics" className="col-span-1">
                  <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2 border-white/5 bg-black/20 hover:bg-white/5 transition-all">
                    <TrendingUp className="w-5 h-5 text-warning" />
                    <span className="text-xs">Analytics</span>
                  </Button>
                </Link>
              </div>
            </GlassCard>
          </div>
        </div>

        {/* Recent Sessions */}
        {!loading && recentSessions.length > 0 && (
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold">Recent Sessions</h3>
              <Link href="/dashboard/attendance" className="text-sm text-primary hover:underline">View All</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-xs font-semibold text-muted-foreground uppercase">
                    <th className="pb-3">Subject</th>
                    <th className="pb-3">Date & Time</th>
                    <th className="pb-3">Present / Total</th>
                    <th className="pb-3 text-right">Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {recentSessions.map((session: any) => (
                    <tr key={session.key} className="hover:bg-white/5 transition-colors">
                      <td className="py-3">
                        <div className="font-medium text-sm">{session.subject_code}</div>
                        <div className="text-xs text-muted-foreground">{session.subject_name}</div>
                      </td>
                      <td className="py-3 text-sm text-muted-foreground">{formatTime(session.timestamp)}</td>
                      <td className="py-3">
                        <span className="inline-flex items-center gap-1 text-xs font-medium bg-success/10 text-success px-2 py-0.5 rounded-full border border-success/20">
                          <UserCheck className="w-3 h-3" /> {session.present} / {session.total}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <span className={`text-sm font-bold ${session.total > 0 && Math.round(session.present / session.total * 100) >= 75 ? "text-success" : "text-warning"}`}>
                          {session.total > 0 ? Math.round(session.present / session.total * 100) : 0}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        )}

        {/* Subject Cards */}
        {!loading && subjectAttendance.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Your Subjects at a Glance</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjectAttendance.map(sub => (
                <GlassCard key={sub.subject_id} className="p-5 flex flex-col gap-3 hover:border-primary/30 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold">{sub.subject_code}</h4>
                      <p className="text-xs text-muted-foreground">{sub.name} ({sub.section})</p>
                    </div>
                    <span className={`text-sm font-bold ${sub.rate >= 75 ? "text-success" : "text-warning"}`}>
                      {sub.rate}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${sub.rate >= 75 ? "bg-success" : "bg-warning"}`}
                      style={{ width: `${sub.rate}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span><Users className="w-3 h-3 inline mr-1" />{sub.total_students || 0} students</span>
                    <span>{sub.sessions} sessions held</span>
                  </div>
                  <Link href={`/dashboard/attendance/live?subject=${sub.subject_id}`}>
                    <Button size="sm" className="w-full bg-primary/10 text-primary hover:bg-primary/20 text-xs h-8 border border-primary/20">
                      <Camera className="w-3 h-3 mr-1.5" /> Start Roll Call
                    </Button>
                  </Link>
                </GlassCard>
              ))}
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
