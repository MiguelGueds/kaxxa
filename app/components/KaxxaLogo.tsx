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

export function KaxxaLogo({ 
  size = 24, 
  className = "", 
  textColor = "text-[#181B22]",
  accentColor = "#1A44C8"
}: { 
  size?: number, 
  className?: string, 
  textColor?: string,
  accentColor?: string
}) {
  return (
    <span 
      className={`inline-flex items-center select-none leading-none ${textColor} ${className}`}
      aria-label="Kaxxa"
    >
      <svg 
        height={size} 
        viewBox="0 0 114 28" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="w-auto overflow-visible shrink-0"
      >
        {/* K: Desenhado com espessura uniforme 4.8px e cantos externos arredondados */}
        <g fill="currentColor">
          <path d="M6.8 3 H2.5 C1.4 3 0.5 3.9 0.5 5 V23 C0.5 24.1 1.4 25 2.5 25 H6.8 V3 Z" />
          <path d="M7 13.5 L17.5 3 H21.5 C22.8 3 23.6 4.2 23 5.4 L13.5 13.5 Z" />
          <path d="M7 14.5 L13.5 14.5 L23 22.6 C23.6 23.8 22.8 25 21.5 25 H17.5 L7 14.5 Z" />
        </g>

        {/* 1º A: Em Azul Oficial #1A44C8 com espessura idêntica de 4.8px e vértice chanfrado */}
        <g fill={accentColor}>
          <path d="M38 3 C36.8 3 35.8 3.8 35.3 4.9 L27.3 23.8 C27 24.5 27.5 25 28.2 25 H32.2 C32.8 25 33.3 24.6 33.5 24.1 L35.2 20 H42.8 L44.5 24.1 C44.7 24.6 45.2 25 45.8 25 H49.8 C50.5 25 51 24.5 50.7 23.8 L42.7 4.9 C42.2 3.8 41.2 3 40 3 H38 Z M39 8.8 L41.2 15.5 H36.8 L39 8.8 Z" />
        </g>

        {/* 1º X: Barras sólidas de 4.8px com cantos suaves */}
        <g fill="currentColor">
          <rect x="55.6" y="1" width="4.8" height="26" rx="2.4" transform="rotate(-38 58 14)" />
          <rect x="55.6" y="1" width="4.8" height="26" rx="2.4" transform="rotate(38 58 14)" />
        </g>

        {/* 2º X: Em Azul Oficial #1A44C8 artisticamente entrelaçado e envolvido com o 1º */}
        <g fill={accentColor}>
          <rect x="74.6" y="1" width="4.8" height="26" rx="2.4" transform="rotate(-38 77 14)" />
          <rect x="74.6" y="1" width="4.8" height="26" rx="2.4" transform="rotate(38 77 14)" />
        </g>

        {/* 2º A: Em cor base com geometria idêntica de 4.8px */}
        <g fill="currentColor">
          <path d="M99 3 C97.8 3 96.8 3.8 96.3 4.9 L88.3 23.8 C88 24.5 88.5 25 89.2 25 H93.2 C93.8 25 94.3 24.6 94.5 24.1 L96.2 20 H103.8 L105.5 24.1 C105.7 24.6 106.2 25 106.8 25 H110.8 C111.5 25 112 24.5 111.7 23.8 L103.7 4.9 C103.2 3.8 102.2 3 101 3 H99 Z M100 8.8 L102.2 15.5 H97.8 L100 8.8 Z" />
        </g>
      </svg>
    </span>
  );
}

export const KaxxaWordmark = KaxxaLogo;

// Aliases para retrocompatibilidade
export const OctaMindLogo = KaxxaLogo;
export const GedisLogo = KaxxaLogo;
export const KapitolLogo = KaxxaLogo;
export const LogoXXAero = KaxxaKLogo;
