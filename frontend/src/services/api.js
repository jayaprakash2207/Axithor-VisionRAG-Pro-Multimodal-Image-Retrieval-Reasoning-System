import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
  timeout: 120000,
});

// ── Upload ────────────────────────────────────────
export const uploadImage = (file, onProgress) => {
  const form = new FormData();
  form.append("file", file);
  return api.post("/upload-image", form, {
    onUploadProgress: onProgress
      ? (e) => onProgress(Math.round((e.loaded * 100) / (e.total || 1)))
      : undefined,
  });
};

// ── Legacy search (backward-compatible) ───────────
export const searchByText = (query, top_k) => {
  return api.post("/search-by-text", { query, top_k });
};

export const searchByImage = (file) => {
  const form = new FormData();
  form.append("file", file);
  return api.post("/search-by-image", form);
};

// ── New similarity search endpoints ───────────────
export const searchSimilarImages = (file, top_k = 5) => {
  const form = new FormData();
  form.append("file", file);
  form.append("top_k", String(top_k));
  return api.post("/search-similar-images", form);
};

export const searchTextToImage = (query, top_k = 5) => {
  return api.post("/search-text-to-image", { query, top_k });
};

// ── Analysis ──────────────────────────────────────
export const analyzeImage = (image_path, prompt) => {
  return api.post("/analyze-image", { image_path, prompt });
};

// ── Health ────────────────────────────────────────
export const checkHealth = () => {
  return api.get("/health");
};

export default api;
