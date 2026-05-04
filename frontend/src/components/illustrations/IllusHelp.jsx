export default function IllusHelp({ className = "" }) {
  return (
    <svg viewBox="0 0 400 280" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="helpBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E8F5E9" />
          <stop offset="100%" stopColor="#FFF8E1" />
        </linearGradient>
        <radialGradient id="helpHeart" cx="50%" cy="40%">
          <stop offset="0%" stopColor="#FF8A65"/>
          <stop offset="100%" stopColor="#E64A19"/>
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="400" height="280" fill="url(#helpBg)" rx="20"/>

      {/* Pessoa oferecendo */}
      <g transform="translate(140, 160)">
        <circle cx="0" cy="-30" r="26" fill="#81C784"/>
        <path d="M -36 50 Q -36 0 0 0 Q 36 0 36 50 Z" fill="#81C784"/>
        <circle cx="-7" cy="-32" r="2.5" fill="#1B5E20"/>
        <circle cx="7" cy="-32" r="2.5" fill="#1B5E20"/>
        <path d="M -8 -22 Q 0 -17 8 -22" stroke="#1B5E20" strokeWidth="2" fill="none" strokeLinecap="round"/>
      </g>

      {/* Mão estendendo coração */}
      <g transform="translate(260, 140)">
        {/* Coração */}
        <path d="M 0 -10 C -12 -28, -38 -22, -38 -2 C -38 18, 0 38, 0 38 C 0 38, 38 18, 38 -2 C 38 -22, 12 -28, 0 -10 Z"
              fill="url(#helpHeart)" stroke="#BF360C" strokeWidth="1.5"/>
        {/* Brilho no coração */}
        <ellipse cx="-12" cy="-8" rx="6" ry="4" fill="white" opacity="0.5" transform="rotate(-30 -12 -8)"/>
      </g>

      {/* Estrelinhas de "boa ação" */}
      <g fill="#FFD54F">
        <path d="M 320 50 L 324 60 L 334 60 L 326 66 L 329 76 L 320 70 L 311 76 L 314 66 L 306 60 L 316 60 Z" opacity="0.8"/>
        <path d="M 60 200 L 63 207 L 70 207 L 64 211 L 67 218 L 60 214 L 53 218 L 56 211 L 50 207 L 57 207 Z" opacity="0.6"/>
        <path d="M 80 60 L 82 65 L 87 65 L 83 68 L 85 73 L 80 70 L 75 73 L 77 68 L 73 65 L 78 65 Z" opacity="0.7"/>
      </g>

      {/* Linha conectando pessoa→coração */}
      <path d="M 175 130 Q 220 120 248 138" stroke="#81C784" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeDasharray="3 3" opacity="0.5"/>
    </svg>
  );
}
