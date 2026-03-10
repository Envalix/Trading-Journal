"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useAuth } from "@/contexts/auth-context";
import type { Profile, ProfileUpdate } from "@/types/database";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    if (data) setProfile(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  /** Immediately persist a profile field update. */
  async function saveNow(updates: ProfileUpdate): Promise<void> {
    if (!user) return;
    setSaveStatus("saving");
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", user.id);
    if (error) {
      setSaveStatus("error");
    } else {
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }
  }

  /** Update local state and debounce-save to DB (1 second). */
  function updateField(updates: ProfileUpdate) {
    setProfile((prev) => (prev ? { ...prev, ...updates } : prev));
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => saveNow(updates), 1000);
  }

  return { profile, loading, saveStatus, updateField, saveNow, refetch: fetchProfile };
}
