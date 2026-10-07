/** Official brand mark from the source logo (globe + interlocking diamonds). */
export function AppLogo({ className, title, tone = "auto" }: { className?: string; title?: string; tone?: "auto" | "light" }) {
  if (tone === "light") {
    // On the always-dark brand sidebar: the white mark in both themes.
    return (
      <span className={className} title={title}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand-white.png" alt="" width={256} height={256} className="size-full" draggable={false} />
      </span>
    );
  }
  return (
    <span className={className} title={title}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand-black.png"
        alt=""
        width={256}
        height={256}
        className="size-full dark:hidden"
        draggable={false}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand-white.png"
        alt=""
        width={256}
        height={256}
        className="hidden size-full dark:block"
        draggable={false}
      />
    </span>
  );
}
