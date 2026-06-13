import {
  Target,
  Search,
  Lightbulb,
  Book,
  Workflow,
  ListOrdered,
  PenLine,
  Sparkles,
  type LucideProps,
} from "lucide-react";
import type { ComponentType } from "react";

const MAP: Record<string, ComponentType<LucideProps>> = {
  Target,
  Search,
  Lightbulb,
  Book,
  Workflow,
  ListOrdered,
  PenLine,
  Sparkles,
};

export function SkillIcon({ name, ...props }: { name: string } & LucideProps) {
  const Icon = MAP[name] ?? Sparkles;
  return <Icon {...props} />;
}
