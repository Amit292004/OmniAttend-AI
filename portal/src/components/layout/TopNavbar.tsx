"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Search, LogOut, GraduationCap, BookOpen } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

export function TopNavbar() {
  const [userName, setUserName] = useState("User");
  const [userRole, setUserRole] = useState<"teacher" | "student" | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.teacher_id != null) {
        setUserRole("teacher");
        setUserName(user.name || "Teacher");
      } else {
        setUserRole("student");
        setUserName(user.name || "Student");
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl">
      <div className="flex h-16 items-center px-6 gap-4">
        
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-secondary flex items-center justify-center">
            <span className="text-white font-bold text-sm">O</span>
          </div>
          <span className="text-lg font-semibold tracking-tight">OmniAttend AI</span>
        </Link>

        {/* Role Badge */}
        {userRole && (
          <span className={cn(
            "hidden sm:inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border",
            userRole === "teacher"
              ? "bg-primary/10 text-primary border-primary/20"
              : "bg-secondary/10 text-secondary border-secondary/20"
          )}>
            {userRole === "teacher" ? <BookOpen className="w-3 h-3" /> : <GraduationCap className="w-3 h-3" />}
            {userRole === "teacher" ? "Teacher Portal" : "Student Portal"}
          </span>
        )}

        {/* Spacer */}
        <div className="ml-auto flex items-center gap-3">

          {/* Search */}
          <div className="relative hidden md:block w-56">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="w-full pl-9 bg-card border-white/5"
            />
          </div>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-foreground relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
          </Button>

          {/* User Avatar + Name */}
          <div className="flex items-center gap-2 pl-2 border-l border-white/5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-sm font-bold text-white">
              {userName.charAt(0).toUpperCase()}
            </div>
            <span className="hidden md:block text-sm font-medium">{userName}</span>
          </div>

          {/* Logout */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={handleLogout}
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
