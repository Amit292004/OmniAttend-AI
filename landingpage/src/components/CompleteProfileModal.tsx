"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { User, Phone, ChevronDown, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export default function CompleteProfileModal() {
  const { user, refreshUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Only show if user is logged in but profile is incomplete
  useEffect(() => {
    if (user) {
      setIsOpen(!user.phone || !user.role);
    } else {
      setIsOpen(false);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!role) {
      setError("Please select a role.");
      return;
    }
    if (!phone || phone.replace(/\D/g, "").length < 7) {
      setError("Please enter a valid phone number.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/complete-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, role }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update profile");
      }

      // Refresh user data – if phone+role are now set, useEffect will close the modal
      await refreshUser();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.75)",
          backdropFilter: "blur(8px)",
          zIndex: 3000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          style={{
            width: "100%",
            maxWidth: "440px",
            background: "#1a1744",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "28px",
            padding: "2.5rem 2rem 2rem",
            color: "#fff",
            boxShadow:
              "0 0 0 1px rgba(157,78,221,0.2), 0 40px 100px rgba(0,0,0,0.8)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Glow */}
          <div
            style={{
              position: "absolute",
              top: -80,
              left: "50%",
              transform: "translateX(-50%)",
              width: 300,
              height: 200,
              background:
                "radial-gradient(ellipse 70% 70% at 50% 0%, rgba(157,78,221,0.22) 0%, transparent 80%)",
              pointerEvents: "none",
            }}
          />

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "1.5rem", position: "relative" }}>
            <img src="/img/logonew.png" alt="OmniAttend Logo" style={{ height: 32 }} />
            <span
              style={{
                fontSize: "1.1rem",
                fontWeight: 800,
                background: "linear-gradient(135deg,#00f5d4 0%,#9d4edd 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              OmniAttend AI
            </span>
          </div>

          {/* Title */}
          <div style={{ textAlign: "center", marginBottom: "2rem", position: "relative" }}>
            <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#fff", marginBottom: "0.5rem", letterSpacing: "-0.04em" }}>
              Complete Your Profile
            </h2>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.9rem" }}>
              Just one more step to get started with OmniAttend.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "0.7rem 0.9rem",
                borderRadius: 10,
                background: "rgba(247,37,133,0.08)",
                border: "1px solid rgba(247,37,133,0.2)",
                color: "#f72585",
                fontSize: "0.85rem",
                marginBottom: "1rem",
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem", position: "relative" }}>
            {/* Phone */}
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "rgba(255,255,255,0.65)", marginBottom: "0.35rem" }}>
                Phone Number
              </label>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <Phone size={17} style={{ position: "absolute", left: 13, color: "rgba(255,255,255,0.28)", pointerEvents: "none" }} />
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "0.78rem 1rem 0.78rem 2.4rem",
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(255,255,255,0.05)",
                    color: "#fff",
                    fontSize: "0.93rem",
                    fontFamily: "inherit",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "rgba(157,78,221,0.55)";
                    e.currentTarget.style.background = "rgba(157,78,221,0.06)";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(157,78,221,0.1)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                    e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>

            {/* Role */}
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "rgba(255,255,255,0.65)", marginBottom: "0.35rem" }}>
                Your Role
              </label>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <User size={17} style={{ position: "absolute", left: 13, color: "rgba(255,255,255,0.28)", pointerEvents: "none", zIndex: 1 }} />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "0.78rem 2.5rem 0.78rem 2.4rem",
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "#1e1b4b",
                    color: role ? "#fff" : "rgba(255,255,255,0.35)",
                    fontSize: "0.93rem",
                    fontFamily: "inherit",
                    outline: "none",
                    appearance: "none",
                    WebkitAppearance: "none",
                    cursor: "pointer",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="" disabled style={{ color: "rgba(255,255,255,0.35)", background: "#1a1744" }}>
                    Choose a role...
                  </option>
                  <option value="student" style={{ background: "#1a1744", color: "#fff" }}>Student</option>
                  <option value="teacher" style={{ background: "#1a1744", color: "#fff" }}>Teacher</option>
                  <option value="admin" style={{ background: "#1a1744", color: "#fff" }}>Administrator</option>
                  <option value="parent" style={{ background: "#1a1744", color: "#fff" }}>Parent</option>
                </select>
                <ChevronDown
                  size={17}
                  style={{ position: "absolute", right: 13, color: "rgba(255,255,255,0.35)", pointerEvents: "none" }}
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: "0.75rem",
                width: "100%",
                padding: "0.9rem",
                borderRadius: 12,
                border: "none",
                background: loading
                  ? "rgba(157,78,221,0.5)"
                  : "linear-gradient(135deg, #f72585 0%, #9d4edd 100%)",
                color: "#fff",
                fontSize: "1rem",
                fontWeight: 700,
                fontFamily: "inherit",
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transition: "opacity 0.2s, transform 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.opacity = "0.9";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1";
              }}
            >
              {loading ? (
                <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />
              ) : (
                <>
                  <CheckCircle size={20} /> Complete Profile
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
