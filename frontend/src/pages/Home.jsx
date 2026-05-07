import { useNavigate } from "react-router-dom";
import { Upload, Search, Brain, Zap, Database, Eye, ArrowRight, Sparkles } from "lucide-react";
import Logo from "../components/Logo.jsx";

const features = [
  { icon: Upload, title: "Smart Upload", desc: "Drag-and-drop images to auto-index with CLIP embeddings", accent: "neon" },
  { icon: Search, title: "Semantic Search", desc: "Find images by natural language or visual similarity", accent: "glow" },
  { icon: Brain, title: "AI Reasoning", desc: "LLaVA-powered analysis explains what it sees", accent: "violet" },
  { icon: Database, title: "Vector Store", desc: "ChromaDB with cosine similarity for blazing-fast retrieval", accent: "ember" },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen">
      <div className="grid-overlay fixed inset-0 opacity-20" />

      <div className="relative mx-auto max-w-6xl px-6 pt-28 pb-20">
        {/* Hero */}
        <section className="space-y-8 animate-fadeIn">
          <Logo />

          <div className="max-w-3xl space-y-5">
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              Visual intelligence
              <br />
              <span className="bg-gradient-to-r from-neon via-glow to-neon bg-clip-text text-transparent">
                at your fingertips
              </span>
            </h1>
            <p className="max-w-xl text-base text-haze/70 leading-relaxed sm:text-lg">
              Upload images, search by text or visual similarity, and get AI-powered reasoning — all running locally with CLIP, ChromaDB, and Ollama.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button onClick={() => navigate("/upload")} className="btn-primary text-base px-8 py-3.5">
              <Upload className="h-4 w-4" />
              Upload Images
            </button>
            <button onClick={() => navigate("/search")} className="btn-secondary text-base px-8 py-3.5">
              <Search className="h-4 w-4" />
              Start Searching
            </button>
          </div>
        </section>

        {/* Features grid */}
        <section className="mt-24 space-y-8">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-neon" />
            <h2 className="text-2xl font-semibold text-white">How it works</h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, desc, accent }, i) => (
              <div
                key={title}
                className="glass-card-hover p-6 space-y-4 opacity-0 animate-slideUp"
                style={{ animationDelay: `${0.1 + i * 0.08}s`, animationFillMode: "forwards" }}
              >
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl border
                  ${accent === "neon" ? "border-neon/20 bg-neon/10 text-neon" :
                    accent === "glow" ? "border-glow/20 bg-glow/10 text-glow" :
                    accent === "violet" ? "border-violet/20 bg-violet/10 text-violet" :
                    "border-ember/20 bg-ember/10 text-ember"}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-white/90">{title}</h3>
                <p className="text-sm text-haze/60 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Architecture */}
        <section className="mt-24 glass-card p-8 opacity-0 animate-slideUp" style={{ animationDelay: "0.5s", animationFillMode: "forwards" }}>
          <h2 className="text-xl font-semibold text-white mb-6">Architecture</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "Embedding Model", value: "CLIP ViT-B/32", sub: "512-dim vectors" },
              { label: "Vector Database", value: "ChromaDB", sub: "Cosine similarity" },
              { label: "Vision LLM", value: "Ollama LLaVA", sub: "Local inference" },
            ].map(({ label, value, sub }) => (
              <div key={label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-1">
                <p className="text-[11px] uppercase tracking-widest text-haze/40">{label}</p>
                <p className="text-lg font-semibold text-white/90">{value}</p>
                <p className="text-xs text-haze/50">{sub}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
