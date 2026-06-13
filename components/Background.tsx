export function Background() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-paper" />
      <div className="absolute -left-32 -top-32 h-[30rem] w-[30rem] rounded-full bg-primary/20 blur-3xl animate-float" />
      <div
        className="absolute -right-40 top-1/3 h-[34rem] w-[34rem] rounded-full bg-accent/15 blur-3xl animate-float"
        style={{ animationDelay: "-2.5s" }}
      />
      <div
        className="absolute -bottom-44 left-1/4 h-[32rem] w-[32rem] rounded-full bg-sky/15 blur-3xl animate-float"
        style={{ animationDelay: "-4.5s" }}
      />
      <div
        className="absolute inset-0 opacity-[0.45]"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(33,27,51,0.055) 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      />
    </div>
  );
}
