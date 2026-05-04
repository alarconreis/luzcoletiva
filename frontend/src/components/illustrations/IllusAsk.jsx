export default function IllusAsk({ className = "" }) {
  return (
    <svg viewBox="0 0 400 280" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="askBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E1F5FE" />
          <stop offset="100%" stopColor="#FFF8E1" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="400" height="280" fill="url(#askBg)" rx="20"/>

      {/* Pessoa central */}
      <g transform="translate(200, 160)">
        <circle cx="0" cy="-30" r="26" fill="#4FC3F7"/>
        <path d="M -36 50 Q -36 0 0 0 Q 36 0 36 50 Z" fill="#4FC3F7"/>
        <circle cx="-7" cy="-32" r="2.5" fill="#1565C0"/>
        <circle cx="7" cy="-32" r="2.5" fill="#1565C0"/>
        <path d="M -8 -22 Q 0 -16 8 -22" stroke="#1565C0" strokeWidth="2" fill="none" strokeLinecap="round"/>
      </g>

      {/* Balão de fala/pedido */}
      <g transform="translate(280, 60)">
        <rect x="-60" y="-30" width="120" height="60" rx="14" fill="white" stroke="#FFD54F" strokeWidth="2.5"/>
        <path d="M -25 30 L -35 45 L -10 30" fill="white" stroke="#FFD54F" strokeWidth="2.5" strokeLinejoin="round"/>
        {/* Linhas de texto no balão */}
        <rect x="-46" y="-15" width="64" height="5" rx="2" fill="#FFD54F" opacity="0.7"/>
        <rect x="-46" y="-5" width="80" height="5" rx="2" fill="#4FC3F7" opacity="0.5"/>
        <rect x="-46" y="5" width="48" height="5" rx="2" fill="#81C784" opacity="0.5"/>
        {/* Coraçãozinho */}
        <path d="M 30 12 C 28 8, 22 8, 22 14 C 22 20, 30 24, 30 24 C 30 24, 38 20, 38 14 C 38 8, 32 8, 30 12 Z"
              fill="#FFD54F"/>
      </g>

      {/* Mãozinha estendida (gesto de pedir) */}
      <g transform="translate(120, 100)">
        <ellipse cx="0" cy="0" rx="28" ry="20" fill="#FFE082" opacity="0.5"/>
        <path d="M -15 -5 Q -15 -18 -5 -18 Q -2 -18 -2 -10 Q -2 -18 4 -18 Q 10 -18 10 -8 Q 10 -18 14 -16 Q 20 -14 18 -4 Q 22 0 18 6 Q 12 14 -2 12 Q -16 10 -15 -5 Z"
              fill="#FFD54F" stroke="#FFA000" strokeWidth="1.5" strokeLinejoin="round"/>
      </g>

      {/* Nuvens */}
      <ellipse cx="80" cy="40" rx="22" ry="9" fill="white" opacity="0.6"/>
      <ellipse cx="350" cy="200" rx="18" ry="7" fill="white" opacity="0.6"/>
    </svg>
  );
}
