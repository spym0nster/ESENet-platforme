/** The ESENet wordmark, redrawn as vector text so it stays crisp at any size. */
export function Logo({ className = "h-6 w-auto" }: { className?: string }) {
  return (
    <svg viewBox="0 0 660 190" className={className} role="img" aria-label="ESENet">
      <defs>
        <linearGradient id="esenetEtGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#7B53FD" />
          <stop offset="100%" stopColor="#1AA6FC" />
        </linearGradient>
      </defs>
      <text
        x="8"
        y="150"
        fontFamily="Poppins, sans-serif"
        fontWeight={800}
        fontSize={140}
        fill="#F4F2FA"
        textLength={330}
        lengthAdjust="spacingAndGlyphs"
      >
        ESE
      </text>
      <text
        x="338"
        y="150"
        fontFamily="Poppins, sans-serif"
        fontWeight={800}
        fontSize={140}
        fill="#7B53FD"
        textLength={112}
        lengthAdjust="spacingAndGlyphs"
      >
        N
      </text>
      <text
        x="450"
        y="150"
        fontFamily="Poppins, sans-serif"
        fontWeight={800}
        fontSize={140}
        fill="url(#esenetEtGrad)"
        textLength={205}
        lengthAdjust="spacingAndGlyphs"
      >
        et
      </text>
    </svg>
  );
}
