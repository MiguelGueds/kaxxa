export function KaxxaKLogo({ 
  size = 24, 
  className = "" 
}: { 
  size?: number, 
  className?: string 
}) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 20 22" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={`shrink-0 select-none ${className}`}
      aria-label="Kaxxa Emblem"
    >
      <path 
        d="M4 3.5V18.5" 
        stroke="currentColor" 
        strokeWidth="2.8" 
        strokeLinecap="round"
      />
      <path 
        d="M15 4L4 11L15 18" 
        stroke="currentColor" 
        strokeWidth="2.8" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function KaxxaWordmark({ 
  size = 22,
  className = "",
  textColor = "text-[#181B22]"
}: { 
  size?: number,
  className?: string, 
  textColor?: string,
  fillColor?: string,
  accentColor?: string
}) {
  const width = Math.round(size * (84 / 22));

  return (
    <svg 
      width={width} 
      height={size} 
      viewBox="0 0 84 22" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${textColor} ${className}`}
      aria-label="Kaxxa"
    >
      {/* K arredondado na mesma família e peso */}
      <path 
        d="M4 3.5V18.5" 
        stroke="currentColor" 
        strokeWidth="2.8" 
        strokeLinecap="round"
      />
      <path 
        d="M14 4L4 11L14 18" 
        stroke="currentColor" 
        strokeWidth="2.8" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      
      {/* A (V invertido arredondado sem traço horizontal) */}
      <path 
        d="M20.5 18L26.5 4L32.5 18" 
        stroke="currentColor" 
        strokeWidth="2.8" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      
      {/* X 1 arredondado em azul elétrico característico */}
      <path 
        d="M39 4L47.5 18" 
        stroke="#1A44C8" 
        strokeWidth="2.8" 
        strokeLinecap="round"
        className="dark:stroke-[#60A5FA]"
      />
      <path 
        d="M47.5 4L39 18" 
        stroke="#1A44C8" 
        strokeWidth="2.8" 
        strokeLinecap="round"
        className="dark:stroke-[#60A5FA]"
      />
      
      {/* X 2 arredondado em azul elétrico característico */}
      <path 
        d="M52.5 4L61 18" 
        stroke="#1A44C8" 
        strokeWidth="2.8" 
        strokeLinecap="round"
        className="dark:stroke-[#60A5FA]"
      />
      <path 
        d="M61 4L52.5 18" 
        stroke="#1A44C8" 
        strokeWidth="2.8" 
        strokeLinecap="round"
        className="dark:stroke-[#60A5FA]"
      />
      
      {/* A (V invertido arredondado sem traço horizontal) */}
      <path 
        d="M67.5 18L73.5 4L79.5 18" 
        stroke="currentColor" 
        strokeWidth="2.8" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function KaxxaLogo({ 
  size = 22, 
  className = "", 
  textColor = "text-[#181B22]" 
}: { 
  size?: number, 
  className?: string, 
  textColor?: string 
}) {
  return (
    <KaxxaWordmark size={size} className={className} textColor={textColor} />
  );
}

// Aliases para retrocompatibilidade
export const OctaMindLogo = KaxxaLogo;
export const GedisLogo = KaxxaLogo;
export const KapitolLogo = KaxxaLogo;
export const LogoXXAero = KaxxaKLogo;
