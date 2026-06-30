/**
 * Central API utility for the OmniAttend Portal.
 *
 * In development: points to http://localhost:8000
 * In production:  points to the Railway backend URL via NEXT_PUBLIC_API_URL env var
 */
export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}`;

/**
 * Build a full API URL from a path.
 * @example api("/api/auth/teacher/login") → "https://omniattend-api.up.railway.app/api/auth/teacher/login"
 */
export function api(path: string): string {
  return `${API_BASE}${path}`;
}
