import ResultCard from "./ResultCard.jsx";

export default function Gallery({ items, onSelect, onAnalyze }) {
  if (!items || items.length === 0) return null;

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item, i) => (
        <ResultCard
          key={item.id || i}
          item={item}
          index={i}
          onSelect={onSelect}
          onAnalyze={onAnalyze}
        />
      ))}
    </div>
  );
}
