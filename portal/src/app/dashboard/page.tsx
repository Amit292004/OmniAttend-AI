"use client";

import { useEffect } from "react";

export default function DashboardRedirect() {
  useEffect(() => {
    async function resolveSession() {
      // 1. Check if portal already has a local session
      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user.teacher_id != null) {
            window.location.href = "/portal/dashboard/teacher";
          } else {
            window.location.href = "/portal/dashboard/student";
          }
          return;
        } catch {
          localStorage.removeItem("user");
          localStorage.removeItem("token");
        }
      }

      // 2. No local session — try to bridge from landing page SSO cookie
      try {
        // The landing page runs on localhost:3000; the cookie is set for localhost
        // so fetch to /api/auth/me will include the omniattend_session cookie automatically
        const meRes = await fetch("http://localhost:3000/api/auth/me", {
          credentials: "include",
        });
        if (meRes.ok) {
          const { user: landingUser } = await meRes.json();
          if (landingUser?.email) {
            // Ask backend to convert email → teacher/student profile
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
              window.location.href =
                role === "teacher"
                  ? "/portal/dashboard/teacher"
                  : "/portal/dashboard/student";
              return;
            }
          }
        }
      } catch {
        // SSO bridge failed (landing page might not be running) — fall through to login
      }

      // 3. Nothing found — send to student login (default entry point)
      window.location.href = "/portal/login/student";
    }

    resolveSession();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <p className="text-muted-foreground text-sm">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}
