"use client";

import { motion } from "framer-motion";
import { Award, BookOpen, Flame, Play, RotateCcw, Sparkles, TrendingUp, Zap } from "lucide-react";
import type { Profile } from "@/lib/types";
import { BADGES, INTEREST_MAP, SKILLS, SKILL_MAP, interestEmoji } from "@/lib/skills";
import { nextFocusSkills, rankForXp } from "@/lib/adaptive";
import { Logo } from "./Logo";
import { LevelMeter } from "./LevelMeter";
import { SkillBar } from "./SkillBar";

function Stat({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode;
  value: React.ReactNode;
  label: string;
  color: string;
}) {
  return (
    <div className="card flex items-center gap-3 p-4">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl" style={{ backgroundColor: `${color}1A`, color }}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="font-display text-2xl font-extrabold leading-none">{value}</p>
        <p className="truncate text-xs font-semibold text-ink-faint">{label}</p>
      </div>
    </div>
  );
}

export function Dashboard({
  profile,
  onStart,
  onReset,
}: {
  profile: Profile;
  onStart: () => void;
  onReset: () => void;
}) {
  const rank = rankForXp(profile.xp);
  const focus = nextFocusSkills(profile)
    .map((s) => SKILL_MAP[s]?.short)
    .filter(Boolean) as string[];
  const earned = new Set(profile.badges);

  function handleReset() {
    if (typeof window !== "undefined" && window.confirm("Reset ReadU? This clears your progress on this device.")) {
      onReset();
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:py-8">
      {/* Header */}
      <header className="mb-6 flex items-center justify-between gap-3">
        <Logo />
        <div className="flex items-center gap-2">
          {profile.streak > 0 && (
            <span className="chip bg-accent-soft text-accent-dark">
              <Flame size={15} /> {profile.streak} day{profile.streak > 1 ? "s" : ""}
            </span>
          )}
          <span className="chip bg-primary-soft text-primary-700">
            {rank.emoji} {rank.name}
          </span>
          <button
            onClick={handleReset}
            className="grid h-9 w-9 place-items-center rounded-full text-ink-faint transition hover:bg-black/5"
            title="Reset progress"
            aria-label="Reset progress"
          >
            <RotateCcw size={17} />
          </button>
        </div>
      </header>

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="card overflow-hidden"
      >
        <div className="grid gap-6 bg-gradient-to-br from-primary-soft/60 to-accent-soft/30 p-6 sm:p-8 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <h1 className="mb-4 text-2xl font-extrabold sm:text-3xl">Hi, {profile.name} 👋</h1>
            <LevelMeter level={profile.level} />
            <p className="mt-4 text-sm font-semibold text-ink-soft">
              {focus.length ? (
                <>
                  <Sparkles size={14} className="mr-1 inline text-primary" />
                  Next up, we&apos;ll sharpen: <span className="text-primary-700">{focus.join(", ")}</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} className="mr-1 inline text-primary" />
                  Nice balance across skills — keep exploring new topics!
                </>
              )}
            </p>
          </div>
          <div className="flex flex-col justify-center gap-3 lg:col-span-2">
            <button className="btn-primary w-full justify-center py-5 text-lg" onClick={onStart}>
              <Play size={20} /> Start a reading
            </button>
            <p className="text-center text-xs text-ink-faint">
              A fresh passage about {profile.interests.slice(0, 2).map((i) => INTEREST_MAP[i]?.label ?? i).join(" or ")}
              {profile.interests.length > 2 ? " & more" : ""}.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={<BookOpen size={20} />} value={profile.passagesRead} label="Passages read" color="#6C4AE2" />
        <Stat icon={<Zap size={20} />} value={profile.xp} label="Total XP" color="#FFB23E" />
        <Stat icon={<Flame size={20} />} value={profile.streak} label="Day streak" color="#FF6B5E" />
        <Stat icon={<Award size={20} />} value={`${profile.badges.length}/${BADGES.length}`} label="Badges" color="#12B488" />
      </div>

      {/* Skills + side column */}
      <div className="mt-5 grid gap-5 lg:grid-cols-5">
        <div className="card p-6 lg:col-span-3">
          <div className="mb-4">
            <h2 className="text-lg font-extrabold">Your reading skills</h2>
            <p className="text-sm text-ink-soft">ReadU watches these eight skills and targets the ones you&apos;re growing.</p>
          </div>
          <div className="space-y-4">
            {SKILLS.map((s) => (
              <SkillBar key={s.id} skill={s} stat={profile.skills[s.id]} />
            ))}
          </div>
        </div>

        <div className="space-y-5 lg:col-span-2">
          {/* Badges */}
          <div className="card p-6">
            <h2 className="mb-4 text-lg font-extrabold">Badges</h2>
            <div className="grid grid-cols-4 gap-3 sm:grid-cols-5 lg:grid-cols-4">
              {BADGES.map((b) => {
                const on = earned.has(b.id);
                return (
                  <div key={b.id} className="flex flex-col items-center gap-1 text-center" title={`${b.label} — ${b.desc}`}>
                    <span
                      className={`grid h-12 w-12 place-items-center rounded-2xl text-2xl transition ${
                        on ? "bg-gold-soft shadow-soft" : "bg-black/5 opacity-40 grayscale"
                      }`}
                    >
                      {b.emoji}
                    </span>
                    <span className={`text-[10px] font-bold leading-tight ${on ? "text-ink" : "text-ink-faint"}`}>
                      {b.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent activity */}
          <div className="card p-6">
            <h2 className="mb-4 text-lg font-extrabold">Recent reading</h2>
            {profile.sessions.length === 0 ? (
              <p className="text-sm text-ink-soft">No readings yet — your history will show up here.</p>
            ) : (
              <div className="space-y-2">
                {profile.sessions.slice(0, 6).map((s) => {
                  const acc = s.total > 0 ? s.correct / s.total : 0;
                  const accColor = acc >= 0.8 ? "#0A8A66" : acc >= 0.6 ? "#E0890C" : "#C82B4C";
                  return (
                    <div key={s.id} className="flex items-center gap-3 rounded-2xl bg-paper p-3">
                      <span className="text-xl">{interestEmoji(s.interestId)}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold">{s.passageTitle}</p>
                        <p className="text-xs text-ink-faint">
                          {new Date(s.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                          {s.levelAfter !== s.levelBefore && (
                            <>
                              {" · "}
                              <TrendingUp size={11} className="inline" /> {s.levelBefore.toFixed(1)}→{s.levelAfter.toFixed(1)}
                            </>
                          )}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-extrabold" style={{ color: accColor }}>
                        {s.correct}/{s.total}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="mt-8 text-center text-xs text-ink-faint">
        Passages &amp; questions are crafted by Claude (Opus 4.8), tuned to your level and interests. Progress is saved on
        this device.
      </p>
    </div>
  );
}
