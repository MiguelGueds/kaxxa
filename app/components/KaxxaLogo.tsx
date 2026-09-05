export function KaxxaKLogo({ 
  size = 28, 
  className = "" 
}: { 
  size?: number, 
  className?: string 
}) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={`shrink-0 select-none ${className}`}
      aria-label="Kaxxa Emblem"
    >
      {/* Icone Squircle Azul com K Branco */}
      <rect width="24" height="24" rx="7" fill="#0052FF" />
      <path d="M7 5 V19" stroke="#FFFFFF" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M16.5 5.5 L9 12 L16.5 18.5" stroke="#FFFFFF" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function KaxxaWordmark({ 
  size = 18,
  className = "",
  textColor = "text-[#181B22]"
}: { 
  size?: number,
  className?: string, 
  textColor?: string,
  fillColor?: string,
  accentColor?: string
}) {
  // Proporção precisa de largura baseada na altura
  const width = Math.round(size * (78 / 18));

  return (
    <svg 
      width={width} 
      height={size} 
      viewBox="0 0 78 18" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${textColor} ${className}`}
      aria-label="Kaxxa"
    >
      {/* LETRA K (PRETO / TEXTO PRINCIPAL) */}
      <line x1="2.5" y1="2" x2="2.5" y2="16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M14 2 L4 9 L14 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* WEAVE KAXXA - LINHAS PRETAS (1º X descendente & 2º A completo) */}
      <path 
        d="M26 2 L42 16" 
        stroke="currentColor" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
      />
      <path 
        d="M58 16 L66 2 L74 16" 
        stroke="currentColor" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        fill="none" 
      />

      {/* WEAVE KAXXA - ONDA AZUL CONTINUA (1º A, 1º X ascendente, 2º X completo) */}
      <path 
        d="M10 16 L18 2 L26 16 L42 2 L58 16" 
        stroke="#0052FF" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        fill="none" 
        className="dark:stroke-[#3B82F6]"
      />
      <path 
        d="M42 16 L58 2" 
        stroke="#0052FF" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        className="dark:stroke-[#3B82F6]"
      />
    </svg>
  );
}

export function KaxxaLogo({ 
  size = 24, 
  className = "", 
  textColor = "text-[#181B22]" 
}: { 
  size?: number, 
  className?: string, 
  textColor?: string 
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 select-none shrink-0 ${textColor} ${className}`}>
      <KaxxaKLogo size={size} />
      <KaxxaWordmark size={Math.round(size * 0.75)} textColor={textColor} />
    </span>
  );
}

// Aliases para retrocompatibilidade
export const OctaMindLogo = KaxxaLogo;
export const GedisLogo = KaxxaLogo;
export const KapitolLogo = KaxxaLogo;
export const LogoXXAero = KaxxaKLogo;
