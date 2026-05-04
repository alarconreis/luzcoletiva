export default function IllusChat({ className = "" }) {
  return (
    <svg viewBox="0 0 400 280" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="chatBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFF8E1"/>
          <stop offset="100%" stopColor="#E8F5E9"/>
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="400" height="280" fill="url(#chatBg)" rx="20"/>

      {/* Telefone/janela de chat */}
      <g transform="translate(140, 40)">
        <rect x="0" y="0" width="180" height="200" rx="20" fill="white" stroke="#424242" strokeWidth="2"/>
        <rect x="10" y="10" width="160" height="20" rx="6" fill="#1565C0"/>
        <text x="90" y="24" textAnchor="middle" fill="white" fontFamily="Poppins, sans-serif" fontSize="10" fontWeight="600">Conversa segura</text>

        {/* Bolha 1 — recebida */}
        <rect x="14" y="46" width="100" height="22" rx="11" fill="#E1F5FE"/>
        <rect x="22" y="54" width="60" height="3" rx="1.5" fill="#4FC3F7"/>
        <rect x="22" y="60" width="80" height="3" rx="1.5" fill="#4FC3F7" opacity="0.6"/>

        {/* Bolha 2 — enviada */}
        <rect x="66" y="76" width="100" height="22" rx="11" fill="#FFD54F"/>
        <rect x="76" y="84" width="70" height="3" rx="1.5" fill="#5D4037"/>
        <rect x="76" y="90" width="50" height="3" rx="1.5" fill="#5D4037" opacity="0.6"/>

        {/* Bolha 3 — recebida (com aviso de moderação) */}
        <rect x="14" y="106" width="120" height="32" rx="11" fill="#FFEBEE" stroke="#F44336" strokeWidth="1" strokeDasharray="3 2"/>
        <text x="74" y="120" textAnchor="middle" fill="#C62828" fontFamily="Open Sans, sans-serif" fontSize="7" fontStyle="italic">mensagem bloqueada</text>
        <text x="74" y="130" textAnchor="middle" fill="#C62828" fontFamily="Open Sans, sans-serif" fontSize="7">por moderação</text>

        {/* Input */}
        <rect x="10" y="170" width="130" height="22" rx="11" fill="#F5F5F5"/>
        <rect x="146" y="170" width="24" height="22" rx="11" fill="#FFD54F"/>
        <path d="M 152 178 L 162 181 L 152 184 L 154 181 Z" fill="#424242"/>
      </g>

      {/* Escudo de proteção flutuante */}
      <g transform="translate(70, 180)">
        <circle cx="0" cy="0" r="34" fill="#81C784" opacity="0.2"/>
        <path d="M 0 -22 L 18 -14 L 18 4 Q 18 18 0 24 Q -18 18 -18 4 L -18 -14 Z"
              fill="#81C784" stroke="white" strokeWidth="2.5"/>
        <path d="M -8 0 L -2 6 L 10 -6" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      </g>

      {/* Sol pequeno no canto */}
      <circle cx="350" cy="60" r="14" fill="#FFD54F"/>
      <g stroke="#FFA000" strokeWidth="2" strokeLinecap="round" opacity="0.7">
        <line x1="350" y1="36" x2="350" y2="42"/>
        <line x1="350" y1="78" x2="350" y2="84"/>
        <line x1="326" y1="60" x2="332" y2="60"/>
        <line x1="368" y1="60" x2="374" y2="60"/>
      </g>
    </svg>
  );
}
