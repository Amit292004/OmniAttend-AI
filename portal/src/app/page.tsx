"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ScanFace, Mic, BarChart3, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/shared/GlassCard";

export default function PortalPage() {
  const [studentCount, setStudentCount] = React.useState<number | null>(null);

  React.useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://omniattend-backend-production.up.railway.app"}/api/attendance/students`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.students) {
          setStudentCount(data.students.length);
        }
      })
      .catch((err) => console.error("Failed to fetch students count:", err));
  }, []);

  return (
    <div className="relative min-h-screen bg-background overflow-hidden flex items-center justify-center">
      {/* Background Animated Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-secondary/20 blur-[120px]" />
        <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] rounded-full bg-accent/20 blur-[100px]" />
      </div>
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

      <div className="container relative z-10 mx-auto px-6 py-12 lg:py-0">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[80vh]">
          
          {/* Left Side: Hero text & Actions */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col space-y-8"
          >
            <div className="flex items-center space-x-4">
              <Image src="/logo.png" alt="OmniAttend AI" width={56} height={56} className="rounded-xl shadow-2xl shadow-primary/20" />
              <h1 className="text-3xl font-bold tracking-tight">OmniAttend AI</h1>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-5xl lg:text-6xl font-extrabold tracking-tighter leading-tight">
                AI-Powered <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                  Smart Attendance
                </span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
                Enterprise-grade attendance platform powered by Facial Recognition, Voice Biometrics, and Artificial Intelligence.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <a href="/portal/login/teacher">
                <Button size="lg" className="w-full sm:w-auto text-base h-14 px-8 rounded-xl bg-white text-black hover:bg-white/90">
                  Enter as Teacher
                </Button>
              </a>
              <a href="/portal/login/student">
                <Button size="lg" variant="glass" className="w-full sm:w-auto text-base h-14 px-8 rounded-xl border border-white/10">
                  Enter as Student
                </Button>
              </a>
            </div>
          </motion.div>

          {/* Right Side: Floating Cards */}
          <div className="hidden lg:block relative h-[600px] w-full perspective-1000">
            <motion.div 
              initial={{ opacity: 0, rotateY: 10, x: 50 }}
              animate={{ opacity: 1, rotateY: 0, x: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="relative w-full max-w-md aspect-square">
                
                {/* Center Core */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-primary/20 rounded-full blur-3xl animate-pulse" />

                {/* Floating Card 1: Face Scan */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                  className="absolute top-[0%] left-[-10%]"
                >
                  <GlassCard className="flex items-center gap-4 p-4 border-primary/20 bg-black/40 w-60 shadow-[0_0_30px_rgba(37,99,235,0.15)]">
                    <div className="p-3 bg-primary/20 rounded-lg text-primary">
                      <ScanFace className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Face Scan</p>
                      <p className="text-xs text-muted-foreground">99.9% Accuracy</p>
                    </div>
                  </GlassCard>
                </motion.div>

                {/* Floating Card 2: Voice Scan */}
                <motion.div
                  animate={{ y: [0, 15, 0] }}
                  transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
                  className="absolute bottom-[10%] right-[-15%]"
                >
                  <GlassCard className="flex items-center gap-4 p-4 border-secondary/20 bg-black/40 w-60 shadow-[0_0_30px_rgba(147,51,234,0.15)]">
                    <div className="p-3 bg-secondary/20 rounded-lg text-secondary">
                      <Mic className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Voice Scan</p>
                      <p className="text-xs text-muted-foreground">Active Listening</p>
                    </div>
                  </GlassCard>
                </motion.div>

                {/* Floating Card 3: Analytics */}
                <motion.div
                  animate={{ y: [0, -15, 0] }}
                  transition={{ repeat: Infinity, duration: 6, ease: "easeInOut", delay: 0.5 }}
                  className="absolute top-[15%] right-[-20%]"
                >
                  <GlassCard className="flex items-center gap-4 p-4 border-accent/20 bg-black/40 w-60 shadow-[0_0_30px_rgba(20,184,166,0.15)]">
                    <div className="p-3 bg-accent/20 rounded-lg text-accent">
                      <BarChart3 className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Live Analytics</p>
                      <p className="text-xs text-muted-foreground">Real-time processing</p>
                    </div>
                  </GlassCard>
                </motion.div>

                {/* Floating Card 4: Students */}
                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut", delay: 1.5 }}
                  className="absolute bottom-[-5%] left-[0%]"
                >
                  <GlassCard className="flex items-center gap-4 p-4 border-success/20 bg-black/40 w-60 shadow-[0_0_30px_rgba(34,197,94,0.15)]">
                    <div className="p-3 bg-success/20 rounded-lg text-success">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Students</p>
                      <p className="text-xs text-muted-foreground">
                        {studentCount !== null ? studentCount.toLocaleString() : "..."} Enrolled
                      </p>
                    </div>
                  </GlassCard>
                </motion.div>

              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </div>
  );
}
