import { useState, useRef, useCallback } from "react";
import { UploadCloud, CheckCircle, XCircle, Image as ImageIcon } from "lucide-react";

export default function UploadDropzone({ label, description, onUpload, accept = "image/*", multiple = false, showPreview = true }) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState(null);
  const [fileName, setFileName] = useState("");
  const inputRef = useRef(null);

  const processFile = useCallback((file) => {
    if (!file) return;
    setFileName(file.name);
    if (showPreview) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);
    }
    onUpload(file);
  }, [onUpload, showPreview]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    processFile(file);
  }, [processFile]);

  const handlePick = useCallback((e) => {
    const file = e.target.files?.[0];
    processFile(file);
    e.target.value = "";
  }, [processFile]);

  const clearPreview = useCallback((e) => {
    e.stopPropagation();
    setPreview(null);
    setFileName("");
  }, []);

  return (
    <div
      role="button"
      tabIndex={0}
      className={`group relative overflow-hidden rounded-2xl border-2 border-dashed p-6 transition-all duration-300 cursor-pointer
        ${isDragging
          ? "border-neon bg-neon/[0.06] shadow-glow-neon scale-[1.01]"
          : "border-white/[0.12] hover:border-neon/40 hover:bg-white/[0.02]"
        }`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
    >
      {/* Background glow effect */}
      <div className={`absolute inset-0 rounded-2xl transition-opacity duration-500
        ${isDragging ? "opacity-100" : "opacity-0"}
        bg-gradient-radial from-neon/[0.08] to-transparent`}
      />

      <div className="relative flex items-start gap-5">
        {/* Icon / Preview */}
        <div className="flex-shrink-0">
          {preview ? (
            <div className="relative h-20 w-20 rounded-xl overflow-hidden border border-white/10">
              <img src={preview} alt="Preview" className="h-full w-full object-cover" />
              <button
                onClick={clearPreview}
                className="absolute top-1 right-1 rounded-full bg-ink/80 p-0.5 text-white/70 hover:text-rose transition"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className={`flex h-14 w-14 items-center justify-center rounded-xl border transition-all duration-300
              ${isDragging
                ? "border-neon/50 bg-neon/10 text-neon"
                : "border-white/[0.1] bg-white/[0.04] text-haze/60 group-hover:text-neon group-hover:border-neon/30"
              }`}>
              <UploadCloud className="h-6 w-6" />
            </div>
          )}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-white/90">{label}</p>
          <p className="mt-1 text-sm text-haze/60">{description}</p>
          {fileName && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-glow">
              <CheckCircle className="h-3.5 w-3.5" />
              <span className="truncate">{fileName}</span>
            </div>
          )}
          {!fileName && (
            <p className="mt-3 text-xs text-haze/40">
              Drag & drop or click to browse · PNG, JPG, WebP up to 10MB
            </p>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={handlePick}
      />
    </div>
  );
}
