import { X } from "lucide-react";

export default function ImageModal({ item, onClose }) {
  if (!item) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/90 backdrop-blur-md animate-fadeIn" onClick={onClose}>
      <div className="relative max-w-4xl w-full mx-4 animate-scaleIn" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute -top-12 right-0 rounded-xl bg-white/10 p-2 text-white/70 hover:text-white transition">
          <X className="h-5 w-5" />
        </button>
        <div className="glass-card overflow-hidden">
          <img src={item.image_url} alt={item.metadata?.filename || "Image"} className="w-full max-h-[70vh] object-contain bg-ink-light" />
          <div className="p-5 space-y-2">
            <p className="text-base font-semibold text-white">{item.metadata?.filename || "Image"}</p>
            <p className="text-xs text-haze/50 font-mono">{item.image_path || item.metadata?.image_path || "—"}</p>
            <div className="flex gap-2">
              <span className="badge">Score: {((item.similarity ?? item.similarity_score ?? 0) * 100).toFixed(1)}%</span>
              <span className="badge">Dist: {(item.distance ?? 0).toFixed(4)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
