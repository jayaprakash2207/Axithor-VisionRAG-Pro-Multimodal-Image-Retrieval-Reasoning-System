export default function LoadingSkeleton({ count = 6 }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass-card overflow-hidden animate-fadeIn" style={{ animationDelay: `${i * 0.05}s` }}>
          <div className="skeleton aspect-[4/3]" />
          <div className="p-4 space-y-3">
            <div className="space-y-1">
              <div className="skeleton h-3 rounded w-20" />
              <div className="skeleton h-1.5 rounded-full w-full" />
            </div>
            <div className="skeleton h-4 rounded w-3/4" />
            <div className="skeleton h-3 rounded w-1/2" />
            <div className="flex gap-2">
              <div className="skeleton h-5 rounded-full w-16" />
              <div className="skeleton h-5 rounded-full w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
