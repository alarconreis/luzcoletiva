export default function IllusSignup({ className = "" }) {
  return (
    <svg viewBox="0 0 400 280" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="signupBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFF8E1" />
          <stop offset="100%" stopColor="#E1F5FE" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="400" height="280" fill="url(#signupBg)" rx="20"/>

      {/* Card de formulário */}
      <rect x="100" y="50" width="200" height="180" rx="16" fill="white" stroke="#E0E0E0" strokeWidth="2"/>

      {/* Linhas de input */}
      <rect x="120" y="80" width="160" height="14" rx="7" fill="#FFF8E1" stroke="#FFD54F" strokeWidth="1.5"/>
      <rect x="120" y="105" width="160" height="14" rx="7" fill="#E1F5FE" stroke="#4FC3F7" strokeWidth="1.5"/>
      <rect x="120" y="130" width="160" height="14" rx="7" fill="#E8F5E9" stroke="#81C784" strokeWidth="1.5"/>

      {/* Botão */}
      <rect x="120" y="170" width="160" height="32" rx="16" fill="#FFD54F"/>
      <text x="200" y="190" textAnchor="middle" fill="#424242" fontFamily="Poppins, sans-serif" fontWeight="600" fontSize="13">Criar conta</text>

      {/* Escudo flutuante (verificação) */}
      <g transform="translate(310, 50)">
        <circle cx="0" cy="0" r="34" fill="#81C784" opacity="0.15"/>
        <path d="M 0 -22 L 18 -14 L 18 4 Q 18 18 0 24 Q -18 18 -18 4 L -18 -14 Z"
              fill="#81C784" stroke="white" strokeWidth="2.5"/>
        <path d="M -8 0 L -2 6 L 10 -6" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      </g>

      {/* Decoração: pontos */}
      <circle cx="60" cy="60" r="3" fill="#FFD54F"/>
      <circle cx="50" cy="100" r="2" fill="#4FC3F7"/>
      <circle cx="70" cy="200" r="3" fill="#81C784"/>
      <circle cx="350" cy="220" r="3" fill="#FFD54F"/>
      <circle cx="340" cy="180" r="2" fill="#4FC3F7"/>
    </svg>
  );
}
