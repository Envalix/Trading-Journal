"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { useTradeImages } from "@/hooks/use-trade-images";
import { useToast } from "@/contexts/toast-context";
import type { TradeImage } from "@/types/database";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

interface Pending {
  file: File;
  preview: string;
  progress: number;
  uploading: boolean;
}

interface ImageUploaderProps {
  tradeId: string;
  onUploaded: (image: TradeImage) => void;
}

export function ImageUploader({ tradeId, onUploaded }: ImageUploaderProps) {
  const [pending, setPending] = useState<Pending[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { uploadImage } = useTradeImages(tradeId);
  const { toast } = useToast();

  function addFiles(files: FileList | null) {
    if (!files) return;
    const valid: Pending[] = [];
    for (const file of Array.from(files)) {
      if (!ACCEPTED.includes(file.type)) {
        toast(`"${file.name}" is not a supported image type.`, "error");
        continue;
      }
      if (file.size > MAX_SIZE) {
        toast(`"${file.name}" exceeds the 5 MB limit.`, "error");
        continue;
      }
      valid.push({ file, preview: URL.createObjectURL(file), progress: 0, uploading: false });
    }
    if (valid.length > 0) {
      setPending((prev) => [...prev, ...valid]);
      valid.forEach((p) => upload(p));
    }
  }

  function removePending(preview: string) {
    setPending((prev) => {
      const item = prev.find((p) => p.preview === preview);
      if (item) URL.revokeObjectURL(item.preview);
      return prev.filter((p) => p.preview !== preview);
    });
  }

  async function upload(item: Pending) {
    setPending((prev) =>
      prev.map((p) => (p.preview === item.preview ? { ...p, uploading: true } : p))
    );

    try {
      const image = await uploadImage(item.file, undefined, (pct) => {
        setPending((prev) =>
          prev.map((p) => (p.preview === item.preview ? { ...p, progress: pct } : p))
        );
      });
      onUploaded(image);
      setPending((prev) => {
        const p = prev.find((x) => x.preview === item.preview);
        if (p) URL.revokeObjectURL(p.preview);
        return prev.filter((p) => p.preview !== item.preview);
      });
    } catch (err) {
      toast((err as Error).message, "error");
      setPending((prev) =>
        prev.map((p) =>
          p.preview === item.preview ? { ...p, uploading: false, progress: 0 } : p
        )
      );
    }
  }

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
          dragging
            ? "border-primary-500 bg-primary-50"
            : "border-surface-300 bg-surface-50 hover:border-primary-400 hover:bg-primary-50/30"
        }`}
      >
        <ImagePlus className="h-8 w-8 text-surface-400" />
        <div>
          <p className="text-sm font-medium text-surface-700">
            Drop images here or click to browse
          </p>
          <p className="text-xs text-surface-400">PNG, JPG, WebP, GIF &mdash; max 5 MB each</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(",")}
          multiple
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      {/* Pending previews */}
      {pending.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {pending.map((p) => (
            <div
              key={p.preview}
              className="relative h-20 w-20 overflow-hidden rounded-lg border border-surface-200 bg-surface-100"
            >
              <img
                src={p.preview}
                alt="Preview"
                className="h-full w-full object-cover"
              />

              {/* Progress overlay */}
              {p.uploading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-900/50">
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                  <span className="mt-1 text-xs font-medium text-white">
                    {p.progress}%
                  </span>
                </div>
              )}

              {/* Remove */}
              {!p.uploading && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removePending(p.preview); }}
                  className="absolute right-1 top-1 rounded-full bg-surface-900/60 p-0.5 text-white hover:bg-surface-900"
                  aria-label="Remove"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
