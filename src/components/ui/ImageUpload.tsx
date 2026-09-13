import { useRef, useState, useCallback } from "react";
import Image from "next/image";
import { Upload, X, ImageIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadedImage {
  url: string;
  caption?: string;
}

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
  hint?: string;
  error?: string;
  className?: string;
}

interface MultiImageUploadProps {
  value: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  folder?: string;
  max?: number;
  label?: string;
  error?: string;
  className?: string;
}

async function uploadFile(file: File, folder: string): Promise<string> {
  const base64 = await toBase64(file);
  const res = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ base64, mimeType: file.type, folder }),
  });
  if (!res.ok) {
    const { error } = await res.json().catch(() => ({ error: "Upload failed" }));
    throw new Error(error ?? "Upload failed");
  }
  const { url } = await res.json();
  return url as string;
}

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

export function ImageUpload({
  value,
  onChange,
  folder = "uploads",
  label = "Upload image",
  hint = "JPG, PNG or WebP — max 8 MB",
  error,
  className,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        setUploadError("Only image files are allowed.");
        return;
      }
      if (file.size > 8 * 1024 * 1024) {
        setUploadError("File too large — max 8 MB.");
        return;
      }
      setUploadError(null);
      setUploading(true);
      try {
        const url = await uploadFile(file, folder);
        onChange(url);
      } catch (e) {
        setUploadError(e instanceof Error ? e.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [folder, onChange]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div className={cn("space-y-2", className)}>
      {label && <p className="text-sm font-medium text-[#18181B]">{label}</p>}

      {value ? (
        <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-[#E4E4DC] bg-[#F4F4F0]">
          <Image src={value} alt="Uploaded" fill className="object-cover" sizes="(max-width: 768px) 100vw, 600px" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center transition-colors"
          >
            <X className="h-4 w-4 text-white" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "w-full aspect-video rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors",
            dragOver
              ? "border-[#E8572A] bg-[#FFF5F2]"
              : "border-[#D4D4C8] bg-[#F4F4F0] hover:border-[#E8572A] hover:bg-[#FFF5F2]"
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="h-8 w-8 text-[#E8572A] animate-spin" />
              <p className="text-sm text-[#71717A]">Uploading…</p>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-white border border-[#E4E4DC] flex items-center justify-center">
                <Upload className="h-5 w-5 text-[#E8572A]" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-[#18181B]">
                  Drag & drop or <span className="text-[#E8572A]">choose file</span>
                </p>
                <p className="text-xs text-[#A1A1AA] mt-0.5">{hint}</p>
              </div>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />

      {(uploadError || error) && (
        <p className="text-xs text-red-500">{uploadError ?? error}</p>
      )}
    </div>
  );
}

export function MultiImageUpload({
  value,
  onChange,
  folder = "uploads",
  max = 8,
  label = "Additional images",
  error,
  className,
}: MultiImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFiles = useCallback(
    async (files: FileList) => {
      const remaining = max - value.length;
      if (remaining <= 0) return;
      const toUpload = Array.from(files).slice(0, remaining);
      setUploadError(null);
      setUploading(true);
      try {
        const urls = await Promise.all(
          toUpload.map(async (file) => {
            if (file.size > 8 * 1024 * 1024) throw new Error(`${file.name} is too large — max 8 MB`);
            const url = await uploadFile(file, folder);
            return { url, caption: "" };
          })
        );
        onChange([...value, ...urls]);
      } catch (e) {
        setUploadError(e instanceof Error ? e.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [folder, max, onChange, value]
  );

  const remove = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  const updateCaption = (idx: number, caption: string) => {
    const next = [...value];
    next[idx] = { ...next[idx], caption };
    onChange(next);
  };

  return (
    <div className={cn("space-y-3", className)}>
      {label && (
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-[#18181B]">{label}</p>
          <span className="text-xs text-[#A1A1AA]">{value.length}/{max}</span>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {value.map((img, idx) => (
          <div key={idx} className="space-y-1.5">
            <div className="relative aspect-video rounded-lg overflow-hidden border border-[#E4E4DC] bg-[#F4F4F0]">
              <Image src={img.url} alt={`Image ${idx + 1}`} fill className="object-cover" sizes="200px" />
              <button
                type="button"
                onClick={() => remove(idx)}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center transition-colors"
              >
                <X className="h-3 w-3 text-white" />
              </button>
            </div>
            <input
              type="text"
              placeholder="Caption (optional)"
              value={img.caption ?? ""}
              onChange={(e) => updateCaption(idx, e.target.value)}
              className="w-full text-xs px-2 py-1.5 rounded-md border border-[#E4E4DC] bg-white placeholder-[#A1A1AA] focus:outline-none focus:ring-1 focus:ring-[#E8572A] focus:border-[#E8572A]"
            />
          </div>
        ))}

        {value.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="aspect-video rounded-lg border-2 border-dashed border-[#D4D4C8] bg-[#F4F4F0] hover:border-[#E8572A] hover:bg-[#FFF5F2] flex flex-col items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 text-[#E8572A] animate-spin" />
            ) : (
              <>
                <ImageIcon className="h-5 w-5 text-[#A1A1AA]" />
                <span className="text-xs text-[#A1A1AA]">Add photo</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="hidden"
        onChange={(e) => { if (e.target.files?.length) handleFiles(e.target.files); }}
      />

      {(uploadError || error) && (
        <p className="text-xs text-red-500">{uploadError ?? error}</p>
      )}
    </div>
  );
}
