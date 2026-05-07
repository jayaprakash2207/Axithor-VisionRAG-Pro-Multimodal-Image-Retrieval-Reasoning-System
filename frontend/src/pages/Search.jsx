import { useState, useCallback } from "react";
import { Search as SearchIcon, Image as ImageIcon, Type, Sparkles, BarChart3 } from "lucide-react";
import SearchBar from "../components/SearchBar.jsx";
import Gallery from "../components/Gallery.jsx";
import AiPanel from "../components/AiPanel.jsx";
import ImageModal from "../components/ImageModal.jsx";
import LoadingSkeleton from "../components/LoadingSkeleton.jsx";
import MetricCard from "../components/MetricCard.jsx";
import StatusPill from "../components/StatusPill.jsx";
import { searchTextToImage, searchSimilarImages, analyzeImage } from "../services/api.js";

export default function SearchPage() {
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [modalItem, setModalItem] = useState(null);
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [status, setStatus] = useState({ text: "Ready", type: "idle" });
  const [lastQuery, setLastQuery] = useState("");
  const [searchTime, setSearchTime] = useState(null);

  const handleTextSearch = useCallback(async (query) => {
    try {
      setLoading(true);
      setResults([]);
      setSelected(null);
      setAnalysis("");
      setLastQuery(query);
      setStatus({ text: "Encoding text & searching...", type: "loading" });
      const start = performance.now();

      const { data } = await searchTextToImage(query, 5);

      const elapsed = Math.round(performance.now() - start);
      setSearchTime(elapsed);
      setResults(data.results || []);
      setStatus({ text: `${data.total_results} results in ${elapsed}ms`, type: "active" });
    } catch (err) {
      setStatus({ text: err?.response?.data?.detail || "Search failed", type: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleImageSearch = useCallback(async (file) => {
    try {
      setLoading(true);
      setResults([]);
      setSelected(null);
      setAnalysis("");
      setLastQuery(file.name);
      setStatus({ text: "Encoding image & searching...", type: "loading" });
      const start = performance.now();

      const { data } = await searchSimilarImages(file, 5);

      const elapsed = Math.round(performance.now() - start);
      setSearchTime(elapsed);
      setResults(data.results || []);
      setStatus({ text: `${data.total_results} results in ${elapsed}ms`, type: "active" });
    } catch (err) {
      setStatus({ text: err?.response?.data?.detail || "Search failed", type: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAnalyze = useCallback(async (item) => {
    try {
      setSelected(item);
      setAnalyzing(true);
      setAnalysis("");
      const imgPath = item.image_path || item.metadata?.image_path;
      const { data } = await analyzeImage(imgPath, "Analyze this image. Describe what you see, notable details, and any patterns.");
      setAnalysis(data.analysis || "No response.");
    } catch (err) {
      setAnalysis("Analysis failed. Is Ollama running?");
    } finally {
      setAnalyzing(false);
    }
  }, []);

  const topScore = results.length > 0 ? ((results[0].similarity_score ?? results[0].similarity ?? 0) * 100).toFixed(1) : "—";

  return (
    <div className="relative min-h-screen">
      <div className="grid-overlay fixed inset-0 opacity-20" />
      <div className="relative mx-auto max-w-7xl px-6 pt-28 pb-20 space-y-8">
        {/* Header */}
        <div className="space-y-3 animate-fadeIn">
          <h1 className="text-3xl font-bold text-white sm:text-4xl">Search</h1>
          <p className="text-base text-haze/60">Find images by text description or visual similarity using CLIP embeddings</p>
          <StatusPill text={status.text} status={status.type} />
        </div>

        {/* Search bar */}
        <div className="animate-slideUp" style={{ animationDelay: "0.1s", animationFillMode: "forwards", opacity: 0 }}>
          <SearchBar onTextSearch={handleTextSearch} onImageSearch={handleImageSearch} loading={loading} />
        </div>

        {/* Metrics */}
        {results.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-4 animate-fadeIn">
            <MetricCard label="Results" value={results.length} icon={SearchIcon} accent="neon" />
            <MetricCard label="Top Score" value={`${topScore}%`} icon={Sparkles} accent="glow" />
            <MetricCard label="Search Time" value={searchTime ? `${searchTime}ms` : "—"} icon={BarChart3} accent="ember" />
            <MetricCard label="Query" value={lastQuery.length > 12 ? lastQuery.slice(0, 12) + "…" : lastQuery} icon={Type} accent="violet" />
          </div>
        )}

        {/* Results + AI panel */}
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            {loading && <LoadingSkeleton count={6} />}
            {!loading && results.length > 0 && (
              <Gallery items={results} onSelect={(item) => setModalItem(item)} onAnalyze={handleAnalyze} />
            )}
            {!loading && results.length === 0 && (
              <div className="glass-panel p-12 text-center space-y-3">
                <SearchIcon className="h-8 w-8 text-haze/30 mx-auto" />
                <p className="text-sm text-haze/50">No results yet</p>
                <p className="text-xs text-haze/30">Search by text or upload a query image above</p>
              </div>
            )}
          </div>

          {/* AI Panel (sticky sidebar) */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <AiPanel selected={selected} response={analysis} loading={analyzing} />
          </div>
        </div>
      </div>

      {/* Fullscreen modal */}
      {modalItem && <ImageModal item={modalItem} onClose={() => setModalItem(null)} />}
    </div>
  );
}
