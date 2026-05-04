export default function IllusTrust({ className = "" }) {
  return (
    <svg viewBox="0 0 400 280" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <defs>
        <radialGradient id="trustSun" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFE082" />
          <stop offset="60%" stopColor="#FFD54F" />
          <stop offset="100%" stopColor="#FFA000" />
        </radialGradient>
        <linearGradient id="trustGround" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E1F5FE" />
          <stop offset="100%" stopColor="#B3E5FC" />
        </linearGradient>
      </defs>

      {/* Chão */}
      <rect x="0" y="220" width="400" height="60" fill="url(#trustGround)" rx="12"/>

      {/* Sol central */}
      <circle cx="200" cy="100" r="38" fill="url(#trustSun)"/>
      <g stroke="#FFB300" strokeWidth="2.5" strokeLinecap="round" opacity="0.6">
        <line x1="200" y1="42" x2="200" y2="52"/>
        <line x1="200" y1="148" x2="200" y2="158"/>
        <line x1="142" y1="100" x2="152" y2="100"/>
        <line x1="248" y1="100" x2="258" y2="100"/>
        <line x1="160" y1="60" x2="167" y2="67"/>
        <line x1="233" y1="133" x2="240" y2="140"/>
        <line x1="160" y1="140" x2="167" y2="133"/>
        <line x1="233" y1="67" x2="240" y2="60"/>
      </g>

      {/* Pessoa esquerda — solicitante */}
      <g>
        <circle cx="90" cy="155" r="22" fill="#4FC3F7"/>
        <path d="M 60 220 Q 60 185 90 185 Q 120 185 120 220 Z" fill="#4FC3F7"/>
        <circle cx="83" cy="152" r="2" fill="#1565C0"/>
        <circle cx="97" cy="152" r="2" fill="#1565C0"/>
        <path d="M 82 162 Q 90 168 98 162" stroke="#1565C0" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      </g>

      {/* Pessoa direita — helper */}
      <g>
        <circle cx="310" cy="155" r="22" fill="#81C784"/>
        <path d="M 280 220 Q 280 185 310 185 Q 340 185 340 220 Z" fill="#81C784"/>
        <circle cx="303" cy="152" r="2" fill="#2E7D32"/>
        <circle cx="317" cy="152" r="2" fill="#2E7D32"/>
        <path d="M 302 162 Q 310 168 318 162" stroke="#2E7D32" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      </g>

      {/* Mãos se encontrando — linha sutil */}
      <path d="M 120 200 Q 200 180 280 200" stroke="#FFD54F" strokeWidth="3" fill="none" strokeLinecap="round" strokeDasharray="4 4" opacity="0.7"/>

      {/* Nuvens decorativas */}
      <ellipse cx="60" cy="50" rx="20" ry="8" fill="white" opacity="0.7"/>
      <ellipse cx="340" cy="40" rx="16" ry="6" fill="white" opacity="0.7"/>
    </svg>
  );
}
