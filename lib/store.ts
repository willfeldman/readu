"use client";

import { useCallback, useEffect, useState } from "react";
import type { Profile } from "./types";

const STORAGE_KEY = "readu:profile:v3";

export function loadProfile(): Profile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Profile;
  } catch {
    return null;
  }
}

export function saveProfile(profile: Profile): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    /* ignore quota / private-mode errors */
  }
}

export function clearProfile(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export interface ProfileStore {
  profile: Profile | null;
  ready: boolean;
  setProfile: (p: Profile) => void;
  reset: () => void;
}

/** Client hook: loads the profile from localStorage and persists every update. */
export function useProfile(): ProfileStore {
  const [profile, setProfileState] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setProfileState(loadProfile());
    setReady(true);
  }, []);

  const setProfile = useCallback((p: Profile) => {
    setProfileState(p);
    saveProfile(p);
  }, []);

  const reset = useCallback(() => {
    clearProfile();
    setProfileState(null);
  }, []);

  return { profile, ready, setProfile, reset };
}
