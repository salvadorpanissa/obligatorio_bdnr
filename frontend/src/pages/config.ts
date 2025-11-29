/// <reference types="vite/client" />

const rawApi = (import.meta.env.VITE_API_BASE || "http://localhost:8000").replace(/\/+$/, "");
// force /api suffix if not provided
export const API_BASE = rawApi.endsWith("/api") ? rawApi : `${rawApi}/api`;

// recommend base reuses same host unless explicitly set
const rawRecommend = (import.meta.env.VITE_RECOMMEND_BASE || rawApi.replace(/\/api$/, "")).replace(/\/+$/, "");
export const RECOMMEND_BASE = rawRecommend.endsWith("/recommend")
  ? rawRecommend
  : `${rawRecommend}/recommend`;
