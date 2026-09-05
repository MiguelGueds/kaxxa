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
      fill="currentColor" 
      xmlns="http://www.w3.org/2000/svg" 
      className={`shrink-0 select-none ${className}`}
      aria-label="Kaxxa Emblem"
    >
      {/* Barra vertical esquerda do K oficial */}
      <path d="M10 2 H6 C3.79 2 2 3.79 2 6 V18 C2 20.21 3.79 22 6 22 H10 V2 Z" />
      {/* Braço superior direito */}
      <path d="M11 11.5 L16.5 2 H19 C20.66 2 22 3.34 22 5 V8 L11 11.5 Z" />
      {/* Braço inferior direito */}
      <path d="M11 12.5 L16.5 22 H19 C20.66 22 22 20.66 22 19 V16 L11 12.5 Z" />
    </svg>
  );
}

export function KaxxaWordmark({ 
  size = 17,
  className = "",
  textColor = "text-[#181B22]"
}: { 
  size?: number,
  className?: string, 
  textColor?: string,
  fillColor?: string,
  accentColor?: string
}) {
  const width = Math.round(size * (74 / 17));

  return (
    <svg 
      width={width} 
      height={size} 
      viewBox="0 0 74 17" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${textColor} ${className}`}
      aria-label="Kaxxa"
    >
      {/* K */}
      <path 
        d="M2.5 1.5V15.5" 
        stroke="currentColor" 
        strokeWidth="2.6" 
        strokeLinecap="round"
      />
      <path 
        d="M11 2L2.5 8.5L11 15" 
        stroke="currentColor" 
        strokeWidth="2.6" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      
      {/* 1º A (AZUL, V invertido sem traço do meio) */}
      <path 
        d="M16 15L21.5 2L27 15" 
        stroke="#1A44C8" 
        strokeWidth="2.6" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        className="dark:stroke-[#60A5FA]"
      />
      
      {/* 1º X */}
      <path 
        d="M32 2L40 15" 
        stroke="currentColor" 
        strokeWidth="2.6" 
        strokeLinecap="round"
      />
      <path 
        d="M40 2L32 15" 
        stroke="currentColor" 
        strokeWidth="2.6" 
        strokeLinecap="round"
      />
      
      {/* 2º X (AZUL) */}
      <path 
        d="M45 2L53 15" 
        stroke="#1A44C8" 
        strokeWidth="2.6" 
        strokeLinecap="round"
        className="dark:stroke-[#60A5FA]"
      />
      <path 
        d="M53 2L45 15" 
        stroke="#1A44C8" 
        strokeWidth="2.6" 
        strokeLinecap="round"
        className="dark:stroke-[#60A5FA]"
      />
      
      {/* 2º A (V invertido sem traço do meio) */}
      <path 
        d="M58 15L63.5 2L69 15" 
        stroke="currentColor" 
        strokeWidth="2.6" 
        strokeLinecap="round" 
        strokeLinejoin="round"
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
    <span className={`inline-flex items-center gap-2 select-none shrink-0 ${textColor} ${className}`}>
      <span className="text-[#1A44C8] shrink-0">
        <KaxxaKLogo size={size} />
      </span>
      <KaxxaWordmark size={Math.round(size * 0.7)} textColor={textColor} />
    </span>
  );
}

// Aliases para retrocompatibilidade
export const OctaMindLogo = KaxxaLogo;
export const GedisLogo = KaxxaLogo;
export const KapitolLogo = KaxxaLogo;
export const LogoXXAero = KaxxaKLogo;
