import { Brain, Sparkles, X, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

export default function AiPanel({ selected, response, loading, onClose }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="glass-card overflow-hidden animate-fadeIn">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet/20 to-neon/20 border border-violet/30">
            <Brain className="h-4 w-4 text-violet" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white/90">AI Reasoning</h3>
            <p className="text-[11px] text-haze/50">Powered by Ollama LLaVA</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setExpanded(!expanded)} className="rounded-lg p-1.5 text-haze/50 hover:text-white hover:bg-white/[0.05] transition">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {onClose && (
            <button onClick={onClose} className="rounded-lg p-1.5 text-haze/50 hover:text-rose hover:bg-white/[0.05] transition">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      {expanded && (
        <div className="p-5 space-y-4">
          {selected && (
            <div className="flex items-center gap-3 rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
              <img src={selected.image_url} alt="Selected" className="h-12 w-12 rounded-lg object-cover border border-white/10" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-white/80 truncate">{selected.metadata?.filename || "Selected image"}</p>
                <p className="text-[10px] text-haze/50">Score: {((selected.similarity ?? selected.similarity_score ?? 0) * 100).toFixed(1)}%</p>
              </div>
            </div>
          )}
          {loading && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-neon/80"><Sparkles className="h-4 w-4 animate-pulse" /><span>Analyzing...</span></div>
              <div className="space-y-2"><div className="skeleton h-4 rounded-lg w-full" /><div className="skeleton h-4 rounded-lg w-4/5" /><div className="skeleton h-4 rounded-lg w-3/5" /></div>
            </div>
          )}
          {!loading && response && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-glow" /><span className="text-[11px] font-medium text-glow uppercase tracking-wider">Analysis</span></div>
              <p className="text-sm leading-relaxed text-white/80 whitespace-pre-wrap">{response}</p>
            </div>
          )}
          {!loading && !response && !selected && (
            <div className="flex flex-col items-center py-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] border border-white/[0.06] mb-3"><Brain className="h-5 w-5 text-haze/30" /></div>
              <p className="text-sm text-haze/50">Select a result to get AI reasoning</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
