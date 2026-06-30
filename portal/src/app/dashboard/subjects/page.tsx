"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { GlassCard } from "@/components/shared/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  BookOpen, Users, Clock, QrCode, Settings, MoreVertical, Plus, Trash2, Share2, X
} from "lucide-react";

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isTeacher, setIsTeacher] = useState(false);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  // Create Subject form state
  const [subCode, setSubCode] = useState("");
  const [subName, setSubName] = useState("");
  const [subSection, setSubSection] = useState("");

  // Enroll form state
  const [enrollCode, setEnrollCode] = useState("");

  const fetchSubjects = async (currentUser: any) => {
    try {
      setLoading(true);
      const isTeach = currentUser.teacher_id != null;
      const url = isTeach
        ? `${process.env.NEXT_PUBLIC_API_URL || "https://omniattend-backend-production.up.railway.app"}/api/subjects/teacher/${currentUser.teacher_id}`
        : `${process.env.NEXT_PUBLIC_API_URL || "https://omniattend-backend-production.up.railway.app"}/api/subjects/student/${currentUser.student_id}`;
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const mapped = isTeach 
          ? data.subjects 
          : data.subjects.map((s: any) => s.subjects).filter(Boolean);
        setSubjects(mapped);
      }
    } catch (err) {
      console.error("Failed to fetch subjects", err);
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
    fetchSubjects(currentUser);
  }, []);

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://omniattend-backend-production.up.railway.app"}/api/subjects/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject_code: subCode,
          name: subName,
          section: subSection,
          teacher_id: user.teacher_id
        })
      });
      if (res.ok) {
        setShowCreateModal(false);
        setSubCode("");
        setSubName("");
        setSubSection("");
        fetchSubjects(user);
      } else {
        const err = await res.json();
        setErrorMsg(err.detail || "Failed to create subject");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to create subject. Connection error.");
    }
  };

  const handleEnrollSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    try {
      // 1. Get subject details from code
      const codeRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://omniattend-backend-production.up.railway.app"}/api/subjects/code/${enrollCode}`);
      if (!codeRes.ok) {
        setErrorMsg("Subject Code not found!");
        return;
      }
      const subject = await codeRes.json();

      // 2. Enroll
      const enrollRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://omniattend-backend-production.up.railway.app"}/api/subjects/enroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: user.student_id,
          subject_id: subject.subject_id
        })
      });
      
      if (enrollRes.ok) {
        setShowEnrollModal(false);
        setEnrollCode("");
        fetchSubjects(user);
      } else {
        setErrorMsg("Failed to enroll. You might already be enrolled.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Enrollment error. Connection issue.");
    }
  };

  const handleDeleteSubject = async (subjectId: number) => {
    if (!confirm("Are you sure you want to delete this subject?")) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://omniattend-backend-production.up.railway.app"}/api/subjects/${subjectId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        fetchSubjects(user);
      }
    } catch (err) {
      console.error("Failed to delete subject", err);
    }
  };

  const handleShareCode = (subjectCode: string) => {
    const inviteLink = `http://localhost:3000/portal/login/student?join-code=${subjectCode}`;
    navigator.clipboard.writeText(inviteLink);
    alert(`Invite link copied to clipboard:\n${inviteLink}`);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Subjects</h1>
            <p className="text-muted-foreground mt-1">
              {isTeacher ? "Manage your assigned courses and classrooms." : "View your enrolled courses."}
            </p>
          </div>
          {isTeacher ? (
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 animate-fade-in" onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" /> Create Subject
            </Button>
          ) : (
            <Button className="bg-secondary text-white hover:bg-secondary/90 animate-fade-in" onClick={() => setShowEnrollModal(true)}>
              <Plus className="w-4 h-4 mr-2" /> Join Class
            </Button>
          )}
        </div>

        {/* Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
          {loading ? (
            <div className="col-span-3 text-center text-muted-foreground py-10">Loading subjects...</div>
          ) : subjects.length === 0 ? (
            <div className="col-span-3 text-center text-muted-foreground py-10">No subjects found.</div>
          ) : (
            subjects.map((subject: any) => (
              <GlassCard key={subject.subject_id} className="p-6 flex flex-col hover:border-primary/50 transition-colors group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 text-primary rounded-xl group-hover:bg-primary group-hover:text-white transition-colors">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{subject.subject_code}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">{subject.name} ({subject.section})</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 my-6">
                  {isTeacher && (
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1"><Users className="w-3.5 h-3.5" /> Students</span>
                      <span className="font-semibold">{subject.total_students || 0} Enrolled</span>
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1"><Clock className="w-3.5 h-3.5" /> Classes</span>
                    <span className="font-semibold text-success">{subject.total_classes || 0} Total</span>
                  </div>
                </div>
                
                <div className="mt-auto pt-4 border-t border-white/5 space-y-4">
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    Status: Active
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    {isTeacher ? (
                      <>
                        <Button variant="outline" className="col-span-1 bg-primary text-white border-transparent hover:bg-primary/90 h-9 text-xs" onClick={() => window.location.href = `/portal/dashboard/attendance/live?subject=${subject.subject_id}`}>
                          Roll Call
                        </Button>
                        <Button variant="outline" className="col-span-1 border-white/10 hover:bg-white/5 h-9 text-xs gap-1.5 px-0" onClick={() => handleShareCode(subject.subject_code)}>
                          <Share2 className="w-3.5 h-3.5" /> Share Code
                        </Button>
                        <Button variant="destructive" className="col-span-1 h-9 text-xs gap-1.5 px-0" onClick={() => handleDeleteSubject(subject.subject_id)}>
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </Button>
                      </>
                    ) : (
                      <Button variant="outline" className="col-span-3 bg-secondary text-white border-transparent hover:bg-secondary/90 h-9 text-xs" onClick={() => window.location.href = "/portal/dashboard/attendance"}>
                        View Attendance Logs
                      </Button>
                    )}
                  </div>
                </div>
              </GlassCard>
            ))
          )}
        </div>

        {/* Create Subject Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
            <GlassCard className="w-full max-w-md p-6 relative">
              <button className="absolute top-4 right-4 text-muted-foreground hover:text-foreground" onClick={() => setShowCreateModal(false)}>
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-bold mb-4">Create New Subject</h2>
              {errorMsg && <div className="text-error text-sm mb-4">{errorMsg}</div>}
              <form onSubmit={handleCreateSubject} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm">Subject Code</label>
                  <Input type="text" placeholder="e.g. CS101" value={subCode} onChange={e => setSubCode(e.target.value)} required />
                </div>
                <div className="space-y-1">
                  <label className="text-sm">Subject Name</label>
                  <Input type="text" placeholder="e.g. Introduction to Programming" value={subName} onChange={e => setSubName(e.target.value)} required />
                </div>
                <div className="space-y-1">
                  <label className="text-sm">Section</label>
                  <Input type="text" placeholder="e.g. CSE-A" value={subSection} onChange={e => setSubSection(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full bg-primary text-white">Create Subject</Button>
              </form>
            </GlassCard>
          </div>
        )}

        {/* Enroll Subject Modal */}
        {showEnrollModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
            <GlassCard className="w-full max-w-md p-6 relative">
              <button className="absolute top-4 right-4 text-muted-foreground hover:text-foreground" onClick={() => setShowEnrollModal(false)}>
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-bold mb-4">Enroll in Class</h2>
              {errorMsg && <div className="text-error text-sm mb-4">{errorMsg}</div>}
              <form onSubmit={handleEnrollSubject} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm">Enter Subject Code</label>
                  <Input type="text" placeholder="e.g. CS101" value={enrollCode} onChange={e => setEnrollCode(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full bg-secondary text-white">Join Subject</Button>
              </form>
            </GlassCard>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
