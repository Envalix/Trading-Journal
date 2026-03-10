"use client";

import { createClient } from "@/lib/supabase-browser";
import { useAuth } from "@/contexts/auth-context";
import type { TradeImage } from "@/types/database";

const BUCKET = "trade-images";

export function useTradeImages(tradeId: string) {
  const { user } = useAuth();

  async function uploadImage(
    file: File,
    caption?: string,
    onProgress?: (pct: number) => void
  ): Promise<TradeImage> {
    if (!user) throw new Error("Not authenticated");
    const supabase = createClient();

    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${user.id}/${tradeId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    onProgress?.(10);

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { upsert: false });

    if (uploadError) throw new Error(uploadError.message);

    onProgress?.(70);

    const { data, error: insertError } = await supabase
      .from("trade_images")
      .insert({ trade_id: tradeId, image_url: path, caption: caption?.trim() || null })
      .select()
      .single();

    if (insertError) throw new Error(insertError.message);

    onProgress?.(100);
    return data;
  }

  async function deleteImage(imageId: string, storagePath: string) {
    if (!user) throw new Error("Not authenticated");
    const supabase = createClient();

    await supabase.storage.from(BUCKET).remove([storagePath]);
    const { error } = await supabase.from("trade_images").delete().eq("id", imageId);
    if (error) throw new Error(error.message);
  }

  async function getSignedUrls(
    paths: string[]
  ): Promise<Record<string, string>> {
    if (paths.length === 0) return {};
    const supabase = createClient();
    const { data } = await supabase.storage
      .from(BUCKET)
      .createSignedUrls(paths, 3600);
    if (!data) return {};
    const map: Record<string, string> = {};
    data.forEach((item, i) => {
      if (item.signedUrl) map[paths[i]] = item.signedUrl;
    });
    return map;
  }

  return { uploadImage, deleteImage, getSignedUrls };
}
