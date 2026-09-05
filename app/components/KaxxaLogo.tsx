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
    <span 
      className={`inline-flex items-center select-none leading-none ${textColor} ${className}`}
      aria-label="Kaxxa"
    >
      <svg 
        viewBox="0 0 98 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="h-[0.92em] w-auto overflow-visible shrink-0"
      >
        {/* K: Desenhado na mesma geometria e proporção do símbolo K */}
        <g fill="currentColor">
          <path d="M4.5 2 H1.5 C0.67 2 0 2.67 0 3.5 V20.5 C0 21.33 0.67 22 1.5 22 H4.5 V2 Z" />
          <path d="M5 11.5 L12 2 H15 C16 2 16.8 2.8 16.3 3.8 L9.5 11.5 Z" />
          <path d="M5 12.5 L9.5 12.5 L16.3 20.2 C16.8 21.2 16 22 15 22 H12 L5 12.5 Z" />
        </g>

        {/* 1º A: Em azul oficial #1A44C8 com geometria chanfrada */}
        <g fill="#1A44C8">
          <path d="M28.5 2 C27.3 2 26.3 2.8 25.8 3.9 L19.8 20.8 C19.5 21.5 20 22 20.7 22 H24.2 C24.8 22 25.3 21.6 25.5 21.1 L26.8 17.2 H32.2 L33.5 21.1 C33.7 21.6 34.2 22 34.8 22 H38.3 C39 22 39.5 21.5 39.2 20.8 L33.2 3.9 C32.7 2.8 31.7 2 30.5 2 H28.5 Z M29.5 8.2 L31 13.5 H28 Z" />
        </g>

        {/* 1º X: Geometria de barras sólidas com cantos arredondados */}
        <g fill="currentColor">
          <rect x="47.9" y="0.5" width="4.2" height="23" rx="2.1" transform="rotate(-38 50 12)" />
          <rect x="47.9" y="0.5" width="4.2" height="23" rx="2.1" transform="rotate(38 50 12)" />
        </g>

        {/* 2º X: Entrelaçado e envolvido com o 1º no azul oficial #1A44C8 */}
        <g fill="#1A44C8">
          <rect x="64.9" y="0.5" width="4.2" height="23" rx="2.1" transform="rotate(-38 67 12)" />
          <rect x="64.9" y="0.5" width="4.2" height="23" rx="2.1" transform="rotate(38 67 12)" />
        </g>

        {/* 2º A: Em cor base */}
        <g fill="currentColor">
          <path d="M86.5 2 C85.3 2 84.3 2.8 83.8 3.9 L77.8 20.8 C77.5 21.5 78 22 78.7 22 H82.2 C82.8 22 83.3 21.6 83.5 21.1 L84.8 17.2 H90.2 L91.5 21.1 C91.7 21.6 92.2 22 92.8 22 H96.3 C97 22 97.5 21.5 97.2 20.8 L91.2 3.9 C90.7 2.8 89.7 2 88.5 2 H86.5 Z M87.5 8.2 L89 13.5 H86 Z" />
        </g>
      </svg>
    </span>
  );
}

// Aliases para retrocompatibilidade
export const OctaMindLogo = KaxxaLogo;
export const GedisLogo = KaxxaLogo;
export const KapitolLogo = KaxxaLogo;
export const LogoXXAero = KaxxaKLogo;
