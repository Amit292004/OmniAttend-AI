"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, Users, BookOpen, GraduationCap, 
  UserCircle, BarChart3, BrainCircuit, ScanFace, 
  Calendar, Settings, LogOut, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const teacherNavItems = [
  {
    section: "Dashboard",
    items: [
      { title: "Overview", href: "/dashboard/teacher", icon: LayoutDashboard },
      { title: "Subjects", href: "/dashboard/subjects", icon: BookOpen },
      { title: "Students", href: "/dashboard/students", icon: GraduationCap },
      { title: "Attendance", href: "/dashboard/attendance", icon: UserCircle },
    ]
  },
  {
    section: "Intelligence",
    items: [
      { title: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
      { title: "AI Insights", href: "/dashboard/insights", icon: BrainCircuit },
      { title: "Face Recognition", href: "/dashboard/attendance/live", icon: ScanFace },
    ]
  },
  {
    section: "General",
    items: [
      { title: "Calendar", href: "#", icon: Calendar },
      { title: "Settings", href: "/dashboard/settings", icon: Settings },
    ]
  }
];

const studentNavItems = [
  {
    section: "My Dashboard",
    items: [
      { title: "Overview", href: "/dashboard/student", icon: LayoutDashboard },
      { title: "My Subjects", href: "/dashboard/subjects", icon: BookOpen },
      { title: "Attendance History", href: "/dashboard/attendance", icon: UserCircle },
    ]
  },
  {
    section: "Profile",
    items: [
      { title: "Settings", href: "/dashboard/settings", icon: Settings },
    ]
  }
];

export function Sidebar() {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<"teacher" | "student" | null>(null);
  const [userName, setUserName] = useState("User");

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      if ('teacher_id' in user && user.teacher_id !== null) {
        setUserRole("teacher");
        setUserName(user.name || "Teacher");
      } else {
        setUserRole("student");
        setUserName(user.name || "Student");
      }
    }
  }, []);

  const navItems = userRole === "teacher" ? teacherNavItems : studentNavItems;

  const NavItem = ({ item }: { item: any }) => {
    const isActive = pathname === item.href;
    return (
      <Link
        href={item.href}
        className={cn(
          "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
          isActive
            ? "bg-primary/15 text-primary shadow-sm shadow-primary/10"
            : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
        )}
      >
        <item.icon className={cn("h-4 w-4 shrink-0 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
        <span className="flex-1">{item.title}</span>
        {isActive && <ChevronRight className="h-3 w-3 text-primary/60" />}
      </Link>
    );
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-white/5 bg-background pt-16 lg:flex">
      
      {/* User Info Panel */}
      <div className="px-4 py-4 border-b border-white/5">
        <div className="flex items-center gap-3 px-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-sm font-bold text-white shrink-0">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{userName}</p>
            <span className={cn(
              "text-xs px-1.5 py-0.5 rounded-full font-medium",
              userRole === "teacher" ? "bg-primary/15 text-primary" : "bg-secondary/15 text-secondary"
            )}>
              {userRole === "teacher" ? "Teacher" : "Student"}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-4 no-scrollbar">
        <div className="space-y-6">
          {navItems.map((group) => (
            <div key={group.section}>
              <h4 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                {group.section}
              </h4>
              <div className="space-y-0.5">
                {group.items.map((item) => <NavItem key={item.title} item={item} />)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Logout */}
      <div className="p-4 border-t border-white/5">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
