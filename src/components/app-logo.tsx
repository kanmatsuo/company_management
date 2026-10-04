/** Crisp brand mark (globe + twin diamonds). Uses currentColor for light/dark. */
export function AppLogo({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 96 112"
      fill="none"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      <g stroke="currentColor" strokeLinejoin="miter" strokeLinecap="square">
        <circle cx="48" cy="18" r="14" strokeWidth="4.5" />
        <path d="M34.8 11.2h26.4M34.2 18h27.6M34.8 24.8h26.4" strokeWidth="2.8" />
        <path d="M48 4v28" strokeWidth="2.8" />
        <ellipse cx="48" cy="18" rx="7" ry="14" strokeWidth="2.8" />
        <path d="M14 40h28l9 10-14 50L5 50Z" strokeWidth="5" />
        <path d="M54 40h28l9 10-14 50L45 50Z" strokeWidth="5" />
      </g>
    </svg>
  );
}
