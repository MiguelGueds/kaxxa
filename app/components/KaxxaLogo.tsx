export function KaxxaKLogo({ size = 28, className = "" }: { size?: number, className?: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="currentColor" 
      xmlns="http://www.w3.org/2000/svg" 
      className={`shrink-0 ${className}`}
    >
      {/* Barra vertical esquerda do K */}
      <path d="M10 2 H6 C3.79 2 2 3.79 2 6 V18 C2 20.21 3.79 22 6 22 H10 V2 Z" />
      {/* Braço superior direito */}
      <path d="M11 11.5 L16.5 2 H19 C20.66 2 22 3.34 22 5 V8 L11 11.5 Z" />
      {/* Braço inferior direito */}
      <path d="M11 12.5 L16.5 22 H19 C20.66 22 22 20.66 22 19 V16 L11 12.5 Z" />
    </svg>
  );
}

export function KaxxaWordmark({ 
  className = "", 
  textColor = "text-[#181B22]",
  size = 20
}: { 
  className?: string, 
  textColor?: string,
  size?: number 
}) {
  return (
    <span 
      className={`font-black tracking-[-0.035em] uppercase select-none inline-flex items-center leading-none ${textColor} ${className}`}
      style={{ fontSize: size }}
      aria-label="Kaxxa"
    >
      <span>KA</span>
      <span className="text-[#1A44C8]">XX</span>
      <span>A</span>
    </span>
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
    <span className={`inline-flex items-center gap-2 select-none shrink-0 ${className}`}>
      <span className="text-[#1A44C8] shrink-0">
        <KaxxaKLogo size={size} />
      </span>
      <KaxxaWordmark size={Math.round(size * 0.85)} textColor={textColor} />
    </span>
  );
}

// Aliases para retrocompatibilidade
export const OctaMindLogo = KaxxaLogo;
export const GedisLogo = KaxxaLogo;
export const KapitolLogo = KaxxaLogo;
export const LogoXXAero = KaxxaKLogo;
