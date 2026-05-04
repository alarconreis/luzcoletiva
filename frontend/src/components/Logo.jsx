/**
 * Logo Luz Coletiva — quatro figuras humanas ao redor de um sol central,
 * simbolizando união e luz compartilhada.
 */
export default function Logo({ size = 40, withText = true, className = '' }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 80 80"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Logo Luz Coletiva"
      >
        <defs>
          <radialGradient id="sunGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFE082" />
            <stop offset="60%" stopColor="#FFD54F" />
            <stop offset="100%" stopColor="#FFB300" />
          </radialGradient>
          <linearGradient id="personGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4FC3F7" />
            <stop offset="100%" stopColor="#81C784" />
          </linearGradient>
        </defs>

        {/* Sol central */}
        <circle cx="40" cy="40" r="14" fill="url(#sunGrad)" />

        {/* Raios sutis */}
        <g stroke="#FFB300" strokeWidth="1.5" strokeLinecap="round" opacity="0.6">
          <line x1="40" y1="20" x2="40" y2="24" />
          <line x1="40" y1="56" x2="40" y2="60" />
          <line x1="20" y1="40" x2="24" y2="40" />
          <line x1="56" y1="40" x2="60" y2="40" />
        </g>

        {/* Quatro pessoas ao redor — cabeça (círculo) + ombros (arco) */}
        {/* Topo */}
        <g fill="url(#personGrad)">
          <circle cx="40" cy="10" r="5" />
          <path d="M 32 22 Q 40 16 48 22 L 46 26 Q 40 22 34 26 Z" />
        </g>
        {/* Direita */}
        <g fill="url(#personGrad)" transform="rotate(90 40 40)">
          <circle cx="40" cy="10" r="5" />
          <path d="M 32 22 Q 40 16 48 22 L 46 26 Q 40 22 34 26 Z" />
        </g>
        {/* Baixo */}
        <g fill="url(#personGrad)" transform="rotate(180 40 40)">
          <circle cx="40" cy="10" r="5" />
          <path d="M 32 22 Q 40 16 48 22 L 46 26 Q 40 22 34 26 Z" />
        </g>
        {/* Esquerda */}
        <g fill="url(#personGrad)" transform="rotate(270 40 40)">
          <circle cx="40" cy="10" r="5" />
          <path d="M 32 22 Q 40 16 48 22 L 46 26 Q 40 22 34 26 Z" />
        </g>
      </svg>

      {withText && (
        <div className="leading-tight">
          <div className="font-display font-bold text-ink-900 text-lg tracking-tight">
            Luz Coletiva
          </div>
          <div className="font-body text-[10px] text-ink-700 -mt-0.5 tracking-wider uppercase">
            Iluminando vidas juntos
          </div>
        </div>
      )}
    </div>
  );
}
