/**
 * Thinker's mark: a trail of visited pages ending in an address that leads
 * nowhere. It draws in currentColor, so it follows the theme it sits in.
 */
export function LogoMark({ size = 24, title }: { size?: number; title?: string }) {
  return (
    <svg
      className="logo-mark"
      width={size}
      height={size}
      viewBox="0 0 32 32"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <path
        d="M5 21 Q9 10 13 17 T22 15 T27 21"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        opacity="0.55"
      />
      <circle cx="5" cy="21" r="3.2" fill="currentColor" />
      <circle cx="13" cy="17" r="3.2" fill="currentColor" />
      <circle cx="22" cy="15" r="3.2" fill="currentColor" />
      <circle cx="27" cy="21" r="2.8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeDasharray="2 1.6" />
    </svg>
  );
}

/** The mark beside "thinker.zz", with the address part muted. */
export function Wordmark({ size = 24 }: { size?: number }) {
  return (
    <span className="wordmark" style={{ fontSize: size }}>
      <LogoMark size={size * 1.15} />
      <span>
        thinker<span className="wordmark-tld">.zz</span>
      </span>
    </span>
  );
}
