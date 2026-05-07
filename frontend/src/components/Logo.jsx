import { Sparkles } from "lucide-react";

export default function Logo() {
  return (
    <div className="inline-flex items-center gap-2.5 rounded-full border border-white/[0.1] bg-white/[0.04] px-4 py-2 text-xs font-mono text-haze/80 backdrop-blur-sm">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-glow opacity-50" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-glow shadow-glow-sm" />
      </span>
      Multimodal Image RAG
    </div>
  );
}
