export default function StatusPill({ text, status = "idle" }) {
  const dot = { idle: "bg-haze/50", active: "bg-glow animate-pulse", error: "bg-rose animate-pulse", loading: "bg-ember animate-pulse" };
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.05] px-3 py-1.5 text-xs text-haze/80 backdrop-blur-sm">
      <span className={`h-1.5 w-1.5 rounded-full ${dot[status] || dot.idle}`} />
      {text}
    </div>
  );
}
