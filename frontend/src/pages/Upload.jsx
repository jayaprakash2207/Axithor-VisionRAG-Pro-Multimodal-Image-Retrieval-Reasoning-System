import { useState, useCallback } from "react";
import { Upload as UploadIcon, CheckCircle, AlertCircle, Image as ImageIcon, Trash2 } from "lucide-react";
import UploadDropzone from "../components/UploadDropzone.jsx";
import StatusPill from "../components/StatusPill.jsx";
import MetricCard from "../components/MetricCard.jsx";
import { uploadImage } from "../services/api.js";

export default function UploadPage() {
  const [uploads, setUploads] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState({ text: "Ready to upload", type: "idle" });

  const handleUpload = useCallback(async (file) => {
    try {
      setUploading(true);
      setProgress(0);
      setStatus({ text: "Encoding with CLIP...", type: "loading" });

      const { data } = await uploadImage(file, (pct) => setProgress(pct));

      const entry = {
        id: data.id,
        image_url: data.image_url,
        metadata: data.metadata,
        duplicate: data.duplicate,
        filename: file.name,
        timestamp: new Date().toISOString(),
      };

      setUploads((prev) => [entry, ...prev]);
      setStatus({
        text: data.duplicate ? "Duplicate detected — already indexed" : "Image indexed successfully",
        type: data.duplicate ? "error" : "active",
      });
    } catch (err) {
      setStatus({ text: err?.response?.data?.detail || "Upload failed", type: "error" });
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, []);

  const removeEntry = (id) => setUploads((prev) => prev.filter((u) => u.id !== id));

  return (
    <div className="relative min-h-screen">
      <div className="grid-overlay fixed inset-0 opacity-20" />
      <div className="relative mx-auto max-w-5xl px-6 pt-28 pb-20 space-y-10">
        {/* Header */}
        <div className="space-y-3 animate-fadeIn">
          <h1 className="text-3xl font-bold text-white sm:text-4xl">Upload Images</h1>
          <p className="text-base text-haze/60 max-w-lg">Add images to the vector knowledge base. Each image is encoded with CLIP and stored in ChromaDB.</p>
          <StatusPill text={status.text} status={status.type} />
        </div>

        {/* Upload zone */}
        <div className="animate-slideUp" style={{ animationDelay: "0.1s", animationFillMode: "forwards", opacity: 0 }}>
          <UploadDropzone
            label="Drop images to index"
            description="Images are auto-encoded with CLIP ViT-B/32 and stored as 512-dim cosine vectors"
            onUpload={handleUpload}
          />
          {uploading && (
            <div className="mt-3 space-y-1">
              <div className="flex justify-between text-xs text-haze/60">
                <span>Processing...</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-neon to-glow transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3 animate-slideUp" style={{ animationDelay: "0.2s", animationFillMode: "forwards", opacity: 0 }}>
          <MetricCard label="Total Uploaded" value={uploads.length} icon={ImageIcon} accent="neon" />
          <MetricCard label="Duplicates" value={uploads.filter((u) => u.duplicate).length} icon={AlertCircle} accent="ember" />
          <MetricCard label="Indexed" value={uploads.filter((u) => !u.duplicate).length} icon={CheckCircle} accent="glow" />
        </div>

        {/* Gallery */}
        {uploads.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Recent Uploads</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {uploads.map((item, i) => (
                <div key={item.id} className="glass-card overflow-hidden group opacity-0 animate-fadeIn" style={{ animationDelay: `${i * 0.05}s`, animationFillMode: "forwards" }}>
                  <div className="relative aspect-[4/3] bg-ink-light overflow-hidden">
                    <img src={item.image_url} alt={item.filename} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                    {item.duplicate && (
                      <div className="absolute top-3 left-3 badge bg-ember/20 border-ember/30 text-ember">
                        <AlertCircle className="h-3 w-3" /> Duplicate
                      </div>
                    )}
                    <button onClick={() => removeEntry(item.id)} className="absolute top-3 right-3 rounded-lg bg-ink/60 p-1.5 text-white/50 opacity-0 group-hover:opacity-100 hover:text-rose transition">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="p-4 space-y-1">
                    <p className="text-sm font-medium text-white/90 truncate">{item.filename}</p>
                    <p className="text-[11px] text-haze/40 font-mono truncate">{item.id}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {uploads.length === 0 && (
          <div className="glass-panel p-12 text-center space-y-3 animate-fadeIn">
            <UploadIcon className="h-8 w-8 text-haze/30 mx-auto" />
            <p className="text-sm text-haze/50">No images uploaded yet</p>
            <p className="text-xs text-haze/30">Upload images above to start building your vector index</p>
          </div>
        )}
      </div>
    </div>
  );
}
