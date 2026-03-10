"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useAuth } from "@/contexts/auth-context";
import type { Tag, TagInsert } from "@/types/database";

export function useTags() {
  const { user } = useAuth();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTags = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("tags")
      .select("*")
      .eq("user_id", user.id)
      .order("name");
    if (data) setTags(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  async function createTag(name: string, color: string): Promise<Tag> {
    if (!user) throw new Error("Not authenticated");
    const supabase = createClient();
    const insert: TagInsert = { user_id: user.id, name: name.trim(), color };
    const { data, error } = await supabase.from("tags").insert(insert).select().single();
    if (error) throw new Error(error.message);
    setTags((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
    return data;
  }

  async function updateTag(id: string, name: string, color: string) {
    if (!user) throw new Error("Not authenticated");
    const supabase = createClient();
    const { data, error } = await supabase
      .from("tags")
      .update({ name: name.trim(), color })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    setTags((prev) => prev.map((t) => (t.id === id ? data : t)));
  }

  async function deleteTag(id: string) {
    if (!user) throw new Error("Not authenticated");
    const supabase = createClient();
    const { error } = await supabase
      .from("tags")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) throw new Error(error.message);
    setTags((prev) => prev.filter((t) => t.id !== id));
  }

  return { tags, loading, createTag, updateTag, deleteTag, refetch: fetchTags };
}

export async function setTradeTags(tradeId: string, tagIds: string[]) {
  const supabase = createClient();
  await supabase.from("trade_tags").delete().eq("trade_id", tradeId);
  if (tagIds.length > 0) {
    await supabase
      .from("trade_tags")
      .insert(tagIds.map((tag_id) => ({ trade_id: tradeId, tag_id })));
  }
}
