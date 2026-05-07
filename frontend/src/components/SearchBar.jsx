import { useState } from "react";
import { Search, Image as ImageIcon, Type, ArrowRight } from "lucide-react";

export default function SearchBar({ onTextSearch, onImageSearch, loading = false }) {
  const [mode, setMode] = useState("text"); // "text" | "image"
  const [query, setQuery] = useState("");

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (query.trim() && onTextSearch) {
      onTextSearch(query.trim());
    }
  };

  const handleImagePick = (e) => {
    const file = e.target.files?.[0];
    if (file && onImageSearch) {
      onImageSearch(file);
    }
    e.target.value = "";
  };

  return (
    <div className="glass-card p-1.5">
      {/* Mode toggle */}
      <div className="flex gap-1 mb-3 px-1 pt-1">
        <button
          onClick={() => setMode("text")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition-all duration-200
            ${mode === "text"
              ? "bg-white/[0.08] text-neon border border-neon/20"
              : "text-haze/60 hover:text-white"
            }`}
        >
          <Type className="h-3.5 w-3.5" />
          Text Search
        </button>
        <button
          onClick={() => setMode("image")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition-all duration-200
            ${mode === "image"
              ? "bg-white/[0.08] text-neon border border-neon/20"
              : "text-haze/60 hover:text-white"
            }`}
        >
          <ImageIcon className="h-3.5 w-3.5" />
          Image Search
        </button>
      </div>

      {/* Text search */}
      {mode === "text" && (
        <form onSubmit={handleTextSubmit} className="flex gap-2 px-1 pb-1">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-haze/40" />
            <input
              id="search-text-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Describe the image you're looking for..."
              className="input-glass pl-11 pr-4"
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={!query.trim() || loading}
            className="btn-primary whitespace-nowrap"
          >
            {loading ? (
              <div className="h-4 w-4 rounded-full border-2 border-ink border-t-transparent animate-spin" />
            ) : (
              <>
                Search
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      )}

      {/* Image search */}
      {mode === "image" && (
        <div className="px-1 pb-1">
          <label
            className="flex items-center justify-center gap-3 rounded-xl border-2 border-dashed
              border-white/[0.12] bg-white/[0.02] px-6 py-5 cursor-pointer
              hover:border-neon/40 hover:bg-neon/[0.03] transition-all duration-200"
          >
            <ImageIcon className="h-5 w-5 text-haze/50" />
            <span className="text-sm text-haze/60">
              {loading ? "Searching..." : "Drop or select a query image"}
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImagePick}
              disabled={loading}
            />
          </label>
        </div>
      )}
    </div>
  );
}
