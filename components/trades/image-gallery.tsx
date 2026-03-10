"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, Trash2, X } from "lucide-react";
import { useTradeImages } from "@/hooks/use-trade-images";
import { useToast } from "@/contexts/toast-context";
import type { TradeImage } from "@/types/database";

interface ImageGalleryProps {
  tradeId: string;
  images: TradeImage[];
  onDeleted: (imageId: string) => void;
}

export function ImageGallery({ tradeId, images, onDeleted }: ImageGalleryProps) {
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [loadingUrls, setLoadingUrls] = useState(true);
  const { getSignedUrls, deleteImage } = useTradeImages(tradeId);
  const { toast } = useToast();

  useEffect(() => {
    if (images.length === 0) { setLoadingUrls(false); return; }
    setLoadingUrls(true);
    getSignedUrls(images.map((img) => img.image_url)).then((urls) => {
      setSignedUrls(urls);
      setLoadingUrls(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images.map((i) => i.id).join(",")]);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (lightbox === null) return;
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowRight") setLightbox((i) => (i! + 1) % images.length);
      if (e.key === "ArrowLeft") setLightbox((i) => (i! - 1 + images.length) % images.length);
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightbox, images.length]);

  async function handleDelete(image: TradeImage) {
    try {
      await deleteImage(image.id, image.image_url);
      onDeleted(image.id);
      toast("Image deleted.", "success");
      if (lightbox !== null) setLightbox(null);
    } catch (err) {
      toast((err as Error).message, "error");
    }
  }

  if (images.length === 0) return null;

  if (loadingUrls) {
    return (
      <div className="flex h-24 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-surface-400" />
      </div>
    );
  }

  const currentImage = lightbox !== null ? images[lightbox] : null;
  const currentUrl = currentImage ? signedUrls[currentImage.image_url] : null;

  return (
    <>
      {/* Thumbnail grid */}
      <div className="flex flex-wrap gap-3">
        {images.map((img, idx) => (
          <div
            key={img.id}
            className="group relative h-24 w-24 cursor-pointer overflow-hidden rounded-xl border border-surface-200 bg-surface-100"
            onClick={() => setLightbox(idx)}
          >
            {signedUrls[img.image_url] ? (
              <img
                src={signedUrls[img.image_url]}
                alt={img.caption ?? `Image ${idx + 1}`}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin text-surface-400" />
              </div>
            )}
            {img.caption && (
              <div className="absolute inset-x-0 bottom-0 bg-surface-900/50 px-1.5 py-0.5">
                <p className="truncate text-xs text-white">{img.caption}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox !== null && currentImage && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-surface-950/90">
          {/* Close */}
          <button
            onClick={() => setLightbox(null)}
            className="absolute right-4 top-4 rounded-xl bg-surface-800/80 p-2 text-white hover:bg-surface-700"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Delete */}
          <button
            onClick={() => handleDelete(currentImage)}
            className="absolute right-14 top-4 rounded-xl bg-surface-800/80 p-2 text-white hover:bg-loss"
          >
            <Trash2 className="h-5 w-5" />
          </button>

          {/* Prev */}
          {images.length > 1 && (
            <button
              onClick={() => setLightbox((i) => (i! - 1 + images.length) % images.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-xl bg-surface-800/80 p-2 text-white hover:bg-surface-700"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          {/* Image */}
          <div className="flex max-h-[90vh] max-w-[90vw] flex-col items-center gap-3">
            {currentUrl ? (
              <img
                src={currentUrl}
                alt={currentImage.caption ?? `Image ${lightbox + 1}`}
                className="max-h-[80vh] max-w-[85vw] rounded-xl object-contain shadow-2xl"
              />
            ) : (
              <div className="flex h-64 w-64 items-center justify-center rounded-xl bg-surface-800">
                <Loader2 className="h-8 w-8 animate-spin text-surface-400" />
              </div>
            )}
            {currentImage.caption && (
              <p className="text-sm text-surface-300">{currentImage.caption}</p>
            )}
            <p className="text-xs text-surface-500">
              {lightbox + 1} / {images.length}
            </p>
          </div>

          {/* Next */}
          {images.length > 1 && (
            <button
              onClick={() => setLightbox((i) => (i! + 1) % images.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-xl bg-surface-800/80 p-2 text-white hover:bg-surface-700"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}
        </div>
      )}
    </>
  );
}
