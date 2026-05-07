import { Eye, Brain, ChevronRight } from "lucide-react";

function ScoreBar({ score }) {
  const pct = Math.round(score * 100);
  const hue = score > 0.7 ? 160 : score > 0.4 ? 40 : 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-haze/60 uppercase tracking-wider">Similarity</span>
        <span
          className="text-sm font-bold tabular-nums"
          style={{ color: `hsl(${hue}, 90%, 65%)` }}
        >
          {pct}%
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, hsl(${hue}, 90%, 55%), hsl(${hue}, 90%, 70%))`,
            boxShadow: `0 0 12px hsla(${hue}, 90%, 65%, 0.4)`,
          }}
        />
      </div>
    </div>
  );
}

export default function ResultCard({ item, index = 0, onSelect, onAnalyze }) {
  const delay = Math.min(index * 0.06, 0.3);

  return (
    <div
      className="glass-card-hover group opacity-0 animate-fadeIn overflow-hidden"
      style={{ animationDelay: `${delay}s`, animationFillMode: "forwards" }}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-ink-light">
        <img
          src={item.image_url}
          alt={item.metadata?.filename || "Result image"}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4 gap-2">
          {onSelect && (
            <button
              onClick={(e) => { e.stopPropagation(); onSelect(item); }}
              className="flex items-center gap-1.5 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 text-xs text-white hover:bg-white/20 transition"
            >
              <Eye className="h-3.5 w-3.5" />
              View
            </button>
          )}
          {onAnalyze && (
            <button
              onClick={(e) => { e.stopPropagation(); onAnalyze(item); }}
              className="flex items-center gap-1.5 rounded-lg bg-neon/20 backdrop-blur-md border border-neon/30 px-3 py-1.5 text-xs text-neon hover:bg-neon/30 transition"
            >
              <Brain className="h-3.5 w-3.5" />
              Analyze
            </button>
          )}
        </div>

        {/* Rank badge */}
        <div className="absolute top-3 left-3 flex h-7 w-7 items-center justify-center rounded-lg bg-ink/70 backdrop-blur-md border border-white/10 text-xs font-bold text-white/80">
          #{index + 1}
        </div>
      </div>

      {/* Info */}
      <div className="p-4 space-y-3">
        <ScoreBar score={item.similarity ?? item.similarity_score ?? 0} />

        <div className="space-y-1.5">
          <p className="text-sm font-medium text-white/90 truncate">
            {item.metadata?.filename || "Unknown"}
          </p>
          <p className="text-[11px] text-haze/50 truncate font-mono">
            {item.image_path || item.metadata?.image_path || "—"}
          </p>
        </div>

        {/* Metadata tags */}
        <div className="flex flex-wrap gap-1.5">
          {item.metadata?.upload_time && (
            <span className="badge text-[10px]">
              {new Date(item.metadata.upload_time).toLocaleDateString()}
            </span>
          )}
          {item.metadata?.timestamp && !item.metadata?.upload_time && (
            <span className="badge text-[10px]">
              {new Date(item.metadata.timestamp).toLocaleDateString()}
            </span>
          )}
          <span className="badge text-[10px]">
            Dist: {(item.distance ?? 0).toFixed(4)}
          </span>
        </div>
      </div>
    </div>
  );
}
