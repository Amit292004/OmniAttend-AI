"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { GlassCard } from "@/components/shared/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  FileSpreadsheet, Trash2, Calendar, Clock, BookOpen, User, CheckCircle, XCircle, Search, Download
} from "lucide-react";

export default function AttendancePage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isTeacher, setIsTeacher] = useState(false);

  // Data states
  const [sessions, setSessions] = useState<any[]>([]);
  const [studentLogs, setStudentLogs] = useState<any[]>([]);
  const [allLogs, setAllLogs] = useState<any[]>([]); // Raw logs for teachers
  
  // Selected session details (for teacher side panel)
  const [selectedSessionTs, setSelectedSessionTs] = useState<string | null>(null);
  const [selectedSessionSubId, setSelectedSessionSubId] = useState<number | null>(null);
  const [sessionDetails, setSessionDetails] = useState<any[]>([]);

  // Export form state
  const [exportSubject, setExportSubject] = useState("");
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState("All");

  const fetchData = async (currentUser: any) => {
    try {
      setLoading(true);
      const isTeach = currentUser.teacher_id != null;
      
      if (isTeach) {
        // Teacher
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/attendance/teacher/${currentUser.teacher_id}`);
        if (res.ok) {
          const data = await res.json();
          const logs = data.logs || [];
          setAllLogs(logs);

          // Group into sessions
          const sessionMap: { [key: string]: any } = {};
          logs.forEach((log: any) => {
            const ts = log.timestamp || "";
            const tsGroup = ts.split(".")[0];
            const key = `${log.subject_id}_${tsGroup}`;
            
            if (!sessionMap[key]) {
              sessionMap[key] = {
                key,
                timestamp: tsGroup,
                subject_id: log.subject_id,
                subject_code: log.subjects?.subject_code || "Unknown",
                subject_name: log.subjects?.name || "Unknown",
                presentCount: 0,
                totalCount: 0,
              };
            }
            sessionMap[key].totalCount += 1;
            if (log.is_present) {
              sessionMap[key].presentCount += 1;
            }
          });
          
          const sortedSessions = Object.values(sessionMap).sort((a: any, b: any) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
          setSessions(sortedSessions);
        }
      } else {
        // Student
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/attendance/student/${currentUser.student_id}`);
        if (res.ok) {
          const data = await res.json();
          const sortedLogs = (data.logs || []).sort((a: any, b: any) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
          setStudentLogs(sortedLogs);
        }
      }
    } catch (err) {
      console.error("Error fetching attendance data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      window.location.href = "/portal/login/student";
      return;
    }
    const currentUser = JSON.parse(userStr);
    setUser(currentUser);
    const isTeach = currentUser.teacher_id != null;
    setIsTeacher(isTeach);
    fetchData(currentUser);
  }, []);

  // Update side panel details when a session is selected
  useEffect(() => {
    if (selectedSessionTs && selectedSessionSubId !== null) {
      const details = allLogs.filter((log: any) => {
        const tsGroup = (log.timestamp || "").split(".")[0];
        return tsGroup === selectedSessionTs && log.subject_id === selectedSessionSubId;
      });
      setSessionDetails(details);
    } else {
      setSessionDetails([]);
    }
  }, [selectedSessionTs, selectedSessionSubId, allLogs]);

  const handleDeleteSession = async (subjectId: number, timestamp: string) => {
    if (!confirm("Are you sure you want to delete this entire attendance session?")) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/attendance/session?subject_id=${subjectId}&timestamp=${timestamp}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setSelectedSessionTs(null);
        setSelectedSessionSubId(null);
        fetchData(user);
      }
    } catch (err) {
      console.error("Failed to delete session", err);
    }
  };

  const handleExportReport = () => {
    if (!exportSubject || !exportStartDate || !exportEndDate) {
      alert("Please fill all export fields!");
      return;
    }
    const url = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/attendance/export?teacher_id=${user.teacher_id}&subject_code=${exportSubject}&start_date=${exportStartDate}&end_date=${exportEndDate}`;
    window.open(url, "_blank");
  };

  const formatTime = (tsString: string) => {
    try {
      const date = new Date(tsString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      }) + " " + date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit"
      });
    } catch (e) {
      return tsString;
    }
  };

  // Filter sessions or student logs
  const subjectOptions = isTeacher 
    ? Array.from(new Set(sessions.map(s => s.subject_code)))
    : Array.from(new Set(studentLogs.map(l => l.subjects?.subject_code)));

  const filteredSessions = sessions.filter(s => {
    const matchesSearch = s.subject_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.subject_code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedSubjectFilter === "All" || s.subject_code === selectedSubjectFilter;
    return matchesSearch && matchesFilter;
  });

  const filteredStudentLogs = studentLogs.filter(l => {
    const sCode = l.subjects?.subject_code || "";
    const sName = l.subjects?.name || "";
    const matchesSearch = sName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          sCode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedSubjectFilter === "All" || sCode === selectedSubjectFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Attendance Records</h1>
            <p className="text-muted-foreground mt-1">
              {isTeacher ? "Review classroom attendance logs and export official sheets." : "Monitor your attendance history and metrics."}
            </p>
          </div>
        </div>

        {/* Master Export Section for Teachers */}
        {isTeacher && sessions.length > 0 && (
          <GlassCard className="p-6 bg-gradient-to-r from-primary/5 to-transparent border-primary/20">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <FileSpreadsheet className="w-5 h-5 text-primary" />
              Export Custom Attendance Report
            </h2>
            <div className="grid md:grid-cols-4 gap-4 items-end">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Select Subject</label>
                <select 
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-foreground focus:outline-none focus:border-primary"
                  value={exportSubject} 
                  onChange={e => setExportSubject(e.target.value)}
                >
                  <option value="">Choose Code...</option>
                  {subjectOptions.map((code: any) => (
                    <option key={code} value={code}>{code}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Start Date</label>
                <Input type="date" value={exportStartDate} onChange={e => setExportStartDate(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">End Date</label>
                <Input type="date" value={exportEndDate} onChange={e => setExportEndDate(e.target.value)} />
              </div>
              <Button className="w-full bg-primary text-white" onClick={handleExportReport}>
                <Download className="w-4 h-4 mr-2" /> Export to Excel
              </Button>
            </div>
          </GlassCard>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-black/20 p-4 rounded-xl border border-white/5">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              type="text" 
              placeholder="Search subjects..." 
              className="pl-9"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 items-center w-full sm:w-auto">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Filter Subject:</span>
            <select 
              className="bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-foreground focus:outline-none focus:border-primary"
              value={selectedSubjectFilter}
              onChange={e => setSelectedSubjectFilter(e.target.value)}
            >
              <option value="All">All Subjects</option>
              {subjectOptions.map((code: any) => (
                <option key={code} value={code}>{code}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Main Contents */}
        <div className="grid lg:grid-cols-3 gap-6 items-start">
          
          {/* Main Records Table */}
          <div className={`col-span-1 lg:col-span-2 ${isTeacher && selectedSessionTs ? "" : "lg:col-span-3"}`}>
            <GlassCard className="overflow-hidden">
              {loading ? (
                <div className="text-center text-muted-foreground py-12">Loading logs...</div>
              ) : isTeacher ? (
                /* Teacher Table */
                filteredSessions.length === 0 ? (
                  <div className="text-center text-muted-foreground py-12">No attendance sessions found.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="border-b border-white/5 bg-white/5 text-xs font-semibold text-muted-foreground uppercase">
                          <th className="p-4">Subject</th>
                          <th className="p-4">Date & Time</th>
                          <th className="p-4">Present / Total</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredSessions.map((session: any) => (
                          <tr 
                            key={session.key} 
                            onClick={() => {
                              setSelectedSessionTs(session.timestamp);
                              setSelectedSessionSubId(session.subject_id);
                            }}
                            className={`hover:bg-white/5 transition-colors cursor-pointer ${selectedSessionTs === session.timestamp && selectedSessionSubId === session.subject_id ? "bg-primary/10" : ""}`}
                          >
                            <td className="p-4">
                              <div className="font-semibold">{session.subject_code}</div>
                              <div className="text-xs text-muted-foreground">{session.subject_name}</div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-1.5 text-sm text-foreground">
                                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                                {formatTime(session.timestamp)}
                              </div>
                            </td>
                            <td className="p-4">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-success/15 text-success border border-success/20">
                                {session.presentCount} / {session.totalCount}
                              </span>
                            </td>
                            <td className="p-4 text-right" onClick={e => e.stopPropagation()}>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-error hover:bg-error/10 h-8 w-8"
                                onClick={() => handleDeleteSession(session.subject_id, session.timestamp)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              ) : (
                /* Student Table */
                filteredStudentLogs.length === 0 ? (
                  <div className="text-center text-muted-foreground py-12">No attendance logs found.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="border-b border-white/5 bg-white/5 text-xs font-semibold text-muted-foreground uppercase">
                          <th className="p-4">Subject</th>
                          <th className="p-4">Date & Time</th>
                          <th className="p-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredStudentLogs.map((log: any) => (
                          <tr key={log.attendance_id} className="hover:bg-white/5 transition-colors">
                            <td className="p-4">
                              <div className="font-semibold">{log.subjects?.subject_code}</div>
                              <div className="text-xs text-muted-foreground">{log.subjects?.name}</div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-1.5 text-sm">
                                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                                {formatTime(log.timestamp)}
                              </div>
                            </td>
                            <td className="p-4">
                              {log.is_present ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-success/15 text-success border border-success/20">
                                  <CheckCircle className="w-3 h-3" /> Present
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-error/15 text-error border border-error/20">
                                  <XCircle className="w-3 h-3" /> Absent
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}
            </GlassCard>
          </div>

          {/* Details Pane for Teachers */}
          {isTeacher && selectedSessionTs && (
            <GlassCard className="col-span-1 p-6 relative border-primary/30 flex flex-col gap-4 animate-fade-in">
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <div>
                  <h3 className="font-bold text-lg">Session Details</h3>
                  <p className="text-xs text-muted-foreground">{formatTime(selectedSessionTs)}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => setSelectedSessionTs(null)}>
                  <XCircle className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-3 overflow-y-auto max-h-[400px] pr-2">
                {sessionDetails.map((detail: any) => (
                  <div 
                    key={detail.attendance_id} 
                    className="flex justify-between items-center p-3 rounded-lg bg-black/20 border border-white/5"
                  >
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{detail.students?.name || "Unknown"}</span>
                    </div>
                    {detail.is_present ? (
                      <span className="text-xs font-semibold text-success flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Present
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-error flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> Absent
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

        </div>

      </div>
    </DashboardLayout>
  );
}
