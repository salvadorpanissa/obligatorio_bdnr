const DEFAULT_API_BASE = "http://localhost:8000";

export function getBaseUrl() {
  return localStorage.getItem("apiBaseUrl") || DEFAULT_API_BASE;
}

export function setBaseUrl(url) {
  const value = url && url.trim() ? url.trim() : DEFAULT_API_BASE;
  localStorage.setItem("apiBaseUrl", value);
  return value;
}

export async function apiFetch(path, options = {}) {
  const base = getBaseUrl().replace(/\/$/, "");
  const url = `${base}${path}`;
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };
  return fetch(url, { ...options, headers });
}
