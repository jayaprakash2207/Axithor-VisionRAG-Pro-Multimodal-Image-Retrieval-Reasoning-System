export default function MetricCard({ label, value, icon: Icon, accent = "neon" }) {
  const colors = { neon: "text-neon border-neon/20", glow: "text-glow border-glow/20", ember: "text-ember border-ember/20", violet: "text-violet border-violet/20" };
  const c = colors[accent] || colors.neon;
  return (
    <div className="glass-card p-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-widest text-haze/50">{label}</p>
        {Icon && <Icon className={`h-4 w-4 ${c.split(" ")[0]}`} />}
      </div>
      <p className={`text-2xl font-bold ${c.split(" ")[0]}`}>{value}</p>
    </div>
  );
}
