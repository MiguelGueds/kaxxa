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

export function KaxxaLogo({ size = 28, className = "" }: { size?: number, className?: string }) {
  return (
    <div className={`inline-flex items-center justify-center shrink-0 text-[#1A44C8] ${className}`}>
      <KaxxaKLogo size={size} />
    </div>
  );
}

export function KaxxaWordmark({ className = "", textColor = "text-[#181B22]" }: { className?: string, textColor?: string }) {
  return (
    <svg 
      viewBox="0 0 108 24" 
      fill="none" 
      strokeWidth="3.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={`h-[0.85em] w-auto shrink-0 overflow-visible select-none inline-block align-middle ${textColor} ${className}`}
    >
      {/* K */}
      <path d="M 4 3.5 V 20.5" stroke="currentColor" />
      <path d="M 18.5 3.5 L 4.5 12.5" stroke="currentColor" />
      <path d="M 9.5 10 L 19 20.5" stroke="currentColor" />

      {/* 1º A (V Invertido sem traço no meio - AZUL DA MARCA) */}
      <path d="M 24 20.5 L 32 3.5 L 40 20.5" stroke="#1A44C8" />

      {/* 1º X (COR BASE) */}
      <path d="M 47 3.5 L 60 20.5" stroke="currentColor" />
      <path d="M 60 3.5 L 47 20.5" stroke="currentColor" />

      {/* 2º X (AZUL DA MARCA) */}
      <path d="M 67 3.5 L 80 20.5" stroke="#1A44C8" />
      <path d="M 80 3.5 L 67 20.5" stroke="#1A44C8" />

      {/* 2º A (V Invertido sem traço no meio - COR BASE) */}
      <path d="M 87 20.5 L 95 3.5 L 103 20.5" stroke="currentColor" />
    </svg>
  );
}

// Aliases para retrocompatibilidade
export const OctaMindLogo = KaxxaLogo;
export const GedisLogo = KaxxaLogo;
export const KapitolLogo = KaxxaLogo;
export const LogoXXAero = KaxxaKLogo;
