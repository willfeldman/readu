import { BookOpen } from "lucide-react";

export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const dim =
    size === "lg"
      ? { box: "h-12 w-12 rounded-[1.1rem]", icon: 26, text: "text-3xl" }
      : size === "sm"
        ? { box: "h-8 w-8 rounded-xl", icon: 17, text: "text-lg" }
        : { box: "h-10 w-10 rounded-2xl", icon: 22, text: "text-2xl" };

  return (
    <div className="inline-flex items-center gap-2.5 select-none">
      <span
        className={`grid place-items-center bg-gradient-to-br from-primary to-accent text-white shadow-glow ${dim.box}`}
      >
        <BookOpen size={dim.icon} strokeWidth={2.4} />
      </span>
      <span className={`font-display font-extrabold tracking-tight ${dim.text}`}>
        Read<span className="text-primary">U</span>
      </span>
    </div>
  );
}
