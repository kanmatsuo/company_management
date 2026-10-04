/** Official brand mark from the source logo (globe + interlocking diamonds). */
export function AppLogo({ className, title }: { className?: string; title?: string }) {
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
