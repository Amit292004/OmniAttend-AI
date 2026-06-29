import React from "react";
import { TopNavbar } from "./TopNavbar";
import { Sidebar } from "./Sidebar";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <TopNavbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 lg:pl-64">
          <div className="container mx-auto p-6 md:p-8 max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
