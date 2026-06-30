/** Logo K&N inline — evita imagem quebrada e conflito de IDs em SVG externos */
export function KnLogoMark({ className, width = 140 }: { className?: string; width?: number }) {
  const height = Math.round((width * 120) / 200);
  const uid = `kn${width}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 120"
      width={width}
      height={height}
      className={className}
      role="img"
      aria-label="K&N Tecnologia"
    >
      <defs>
        <linearGradient id={`${uid}-p`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#9B30FF" />
          <stop offset="100%" stopColor="#6A0DAD" />
        </linearGradient>
        <linearGradient id={`${uid}-b`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#4A00E0" />
          <stop offset="100%" stopColor="#007BFF" />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${uid}-p)`}
        d="M8 12 L8 108 L32 108 L32 72 L58 108 L88 108 L52 64 L86 12 L58 12 L32 48 L32 12 Z"
      />
      <path
        fill={`url(#${uid}-b)`}
        d="M96 12 L96 108 L120 108 L120 48 L152 108 L176 108 L176 12 L152 12 L152 72 L120 12 Z"
      />
    </svg>
  );
}
