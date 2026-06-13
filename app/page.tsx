"use client";

import { useEffect, useState } from "react";
import type { Profile, SessionMode } from "@/lib/types";
import { newProfile } from "@/lib/adaptive";
import { useProfile } from "@/lib/store";
import { prefetchNext } from "@/lib/prefetch";
import { Background } from "@/components/Background";
import { Logo } from "@/components/Logo";
import { Onboarding } from "@/components/Onboarding";
import { BaselineIntro } from "@/components/BaselineIntro";
import { ReadingSession } from "@/components/ReadingSession";
import { Dashboard } from "@/components/Dashboard";

type Screen = "onboarding" | "baselineIntro" | "session" | "dashboard";

function Splash() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5">
      <div className="animate-float">
        <Logo size="lg" />
      </div>
      <div className="flex gap-1.5">
        {[0, 1, 2].map((n) => (
          <span
            key={n}
            className="h-2.5 w-2.5 rounded-full bg-primary"
            style={{ animation: "pop 0.9s ease-in-out infinite", animationDelay: `${n * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const { profile, ready, setProfile, reset } = useProfile();
  const [screen, setScreen] = useState<Screen | null>(null);
  const [mode, setMode] = useState<SessionMode>("practice");
  const [sessionKey, setSessionKey] = useState(0);

  // Decide the initial screen once the stored profile has loaded.
  useEffect(() => {
    if (!ready || screen !== null) return;
    if (!profile) setScreen("onboarding");
    else if (!profile.baselineDone) setScreen("baselineIntro");
    else setScreen("dashboard");
  }, [ready, profile, screen]);

  function handleOnboardingComplete(name: string, grade: number, interests: string[]) {
    setProfile(newProfile(name, grade, interests));
    setScreen("baselineIntro");
  }

  function startSession(m: SessionMode) {
    setMode(m);
    setSessionKey((k) => k + 1);
    setScreen("session");
  }

  function handleComplete(updated: Profile) {
    setProfile(updated);
    setScreen("dashboard");
    // Warm the next passage so "Start a reading" from the dashboard is instant.
    if (updated.baselineDone) prefetchNext(updated);
  }

  function handleAnother(updated: Profile) {
    setProfile(updated);
    setMode("practice");
    setSessionKey((k) => k + 1);
  }

  function handleReset() {
    reset();
    setScreen("onboarding");
  }

  let content: React.ReactNode;
  if (!ready || screen === null) {
    content = <Splash />;
  } else if (screen === "onboarding" || !profile) {
    content = <Onboarding onComplete={handleOnboardingComplete} />;
  } else if (screen === "baselineIntro") {
    content = <BaselineIntro name={profile.name} onStart={() => startSession("baseline")} />;
  } else if (screen === "session") {
    content = (
      <ReadingSession
        key={sessionKey}
        profile={profile}
        mode={mode}
        onComplete={handleComplete}
        onAnother={handleAnother}
        onExit={() => setScreen("dashboard")}
      />
    );
  } else {
    content = <Dashboard profile={profile} onStart={() => startSession("practice")} onReset={handleReset} />;
  }

  return (
    <main className="relative min-h-screen">
      <Background />
      {content}
    </main>
  );
}
