import type { SkillId } from "./types";

export interface SkillMeta {
  id: SkillId;
  label: string;
  short: string;
  blurb: string;
  color: string; // hex, used for skill bars / chips (dynamic → inline style)
  icon: string; // lucide-react icon name
}

export const SKILLS: SkillMeta[] = [
  {
    id: "main_idea",
    label: "Main Idea",
    short: "Main Idea",
    blurb: "Finding the big point and summarizing what a text is really about.",
    color: "#6C4AE2",
    icon: "Target",
  },
  {
    id: "detail",
    label: "Key Details",
    short: "Details",
    blurb: "Locating the specific facts and details that support a text.",
    color: "#2FA9E0",
    icon: "Search",
  },
  {
    id: "inference",
    label: "Inference",
    short: "Inference",
    blurb: "Reading between the lines to figure out what isn't stated directly.",
    color: "#FF6B5E",
    icon: "Lightbulb",
  },
  {
    id: "vocabulary",
    label: "Vocabulary",
    short: "Vocabulary",
    blurb: "Working out what words mean from how they're used in context.",
    color: "#FFB23E",
    icon: "Book",
  },
  {
    id: "cause_effect",
    label: "Cause & Effect",
    short: "Cause/Effect",
    blurb: "Understanding why things happen and what they lead to.",
    color: "#12B488",
    icon: "Workflow",
  },
  {
    id: "sequence",
    label: "Sequencing",
    short: "Sequence",
    blurb: "Tracking the order in which events and steps occur.",
    color: "#EE4A6B",
    icon: "ListOrdered",
  },
  {
    id: "authors_purpose",
    label: "Author's Purpose",
    short: "Purpose",
    blurb: "Spotting why an author wrote something — to inform, persuade, or entertain.",
    color: "#8E6BEE",
    icon: "PenLine",
  },
  {
    id: "figurative",
    label: "Figurative Language",
    short: "Figurative",
    blurb: "Understanding similes, metaphors, and the tone behind the words.",
    color: "#1981B4",
    icon: "Sparkles",
  },
];

export const SKILL_MAP: Record<SkillId, SkillMeta> = SKILLS.reduce(
  (acc, s) => {
    acc[s.id] = s;
    return acc;
  },
  {} as Record<SkillId, SkillMeta>,
);

export interface InterestMeta {
  id: string;
  label: string;
  emoji: string;
  blurb: string;
  from: string; // gradient start (hex)
  to: string; // gradient end (hex)
}

export const INTERESTS: InterestMeta[] = [
  { id: "space", label: "Space & Astronomy", emoji: "🚀", blurb: "Planets, rovers & the cosmos", from: "#6C4AE2", to: "#2FA9E0" },
  { id: "animals", label: "Animals & Wildlife", emoji: "🦊", blurb: "Creatures big and small", from: "#12B488", to: "#7BD389" },
  { id: "sports", label: "Sports & Athletes", emoji: "⚽", blurb: "Games, records & grit", from: "#FF6B5E", to: "#FFB23E" },
  { id: "mystery", label: "Mystery & Detectives", emoji: "🔍", blurb: "Clues, twists & whodunits", from: "#46299E", to: "#6C4AE2" },
  { id: "tech", label: "Technology & Coding", emoji: "💻", blurb: "Robots, apps & big ideas", from: "#2FA9E0", to: "#6C4AE2" },
  { id: "history", label: "History & Ancient Worlds", emoji: "🏛️", blurb: "Empires, explorers & relics", from: "#E0890C", to: "#FFB23E" },
  { id: "ocean", label: "Ocean & Sea Life", emoji: "🐬", blurb: "Reefs, depths & sea creatures", from: "#1981B4", to: "#2FA9E0" },
  { id: "mythology", label: "Mythology & Legends", emoji: "🐉", blurb: "Gods, heroes & legends", from: "#C82B4C", to: "#EE4A6B" },
  { id: "music", label: "Music & Performing Arts", emoji: "🎸", blurb: "Beats, stages & stars", from: "#EE4A6B", to: "#8E6BEE" },
  { id: "art", label: "Art & Creativity", emoji: "🎨", blurb: "Color, design & imagination", from: "#FF6B5E", to: "#EE4A6B" },
  { id: "gaming", label: "Video Games & Esports", emoji: "🎮", blurb: "Worlds, levels & legends", from: "#6C4AE2", to: "#EE4A6B" },
  { id: "science", label: "Science & Inventions", emoji: "🔬", blurb: "Experiments & breakthroughs", from: "#12B488", to: "#2FA9E0" },
];

export const INTEREST_MAP: Record<string, InterestMeta> = INTERESTS.reduce(
  (acc, i) => {
    acc[i.id] = i;
    return acc;
  },
  {} as Record<string, InterestMeta>,
);

export function interestLabel(id: string): string {
  return INTEREST_MAP[id]?.label ?? id;
}

export function interestEmoji(id: string): string {
  return INTEREST_MAP[id]?.emoji ?? "📖";
}

export interface BadgeMeta {
  id: string;
  label: string;
  emoji: string;
  desc: string;
}

export const BADGES: BadgeMeta[] = [
  { id: "first_steps", label: "First Steps", emoji: "🌱", desc: "Finished your baseline reading." },
  { id: "bookworm", label: "Bookworm", emoji: "🐛", desc: "Read 5 passages." },
  { id: "bibliophile", label: "Page Turner", emoji: "📚", desc: "Read 15 passages." },
  { id: "perfect_run", label: "Flawless", emoji: "💯", desc: "Aced a passage with a perfect score." },
  { id: "level_up", label: "Level Up", emoji: "📈", desc: "Reached a new reading level." },
  { id: "skill_master", label: "Skill Master", emoji: "🧠", desc: "Mastered a comprehension skill." },
  { id: "streak_3", label: "On a Roll", emoji: "🔥", desc: "Kept a 3-day reading streak." },
  { id: "streak_7", label: "Unstoppable", emoji: "⚡", desc: "Kept a 7-day reading streak." },
  { id: "explorer", label: "Explorer", emoji: "🧭", desc: "Read across 4 different interests." },
  { id: "scholar", label: "Scholar", emoji: "🎓", desc: "Reached reading level 8 or above." },
];

export const BADGE_MAP: Record<string, BadgeMeta> = BADGES.reduce(
  (acc, b) => {
    acc[b.id] = b;
    return acc;
  },
  {} as Record<string, BadgeMeta>,
);
