export const DEFAULT_API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

function normalizeBase(url) {
  if (!url || !url.trim()) return DEFAULT_API_BASE;
  return url.trim().replace(/\/+$/, "");
}

export function getBaseUrl() {
  return normalizeBase(localStorage.getItem("apiBaseUrl")) || DEFAULT_API_BASE;
}

export function setBaseUrl(url) {
  const value = normalizeBase(url);
  localStorage.setItem("apiBaseUrl", value);
  return value;
}

export async function apiFetch(path, options = {}) {
  const base = (options.baseUrl || getBaseUrl()).replace(/\/$/, "");
  const cleanedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${base}${cleanedPath}`;
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };
  return fetch(url, { ...options, headers });
}
