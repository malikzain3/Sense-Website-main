export const API_URL =
  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000"
    : (import.meta.env.VITE_API_URL || "https://sense-website-main-production.up.railway.app");