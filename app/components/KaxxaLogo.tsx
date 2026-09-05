export function KaxxaKLogo({ size = 28, className = "" }: { size?: number, className?: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="currentColor" 
      xmlns="http://www.w3.org/2000/svg" 
      className={`shrink-0 ${className}`}
      aria-label="Kaxxa Emblem"
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
  textColor,
  fillColor = "currentColor",
  accentColor = "#1A44C8",
  size = 20
}: { 
  className?: string, 
  textColor?: string,
  fillColor?: string,
  accentColor?: string,
  size?: number 
}) {
  // Proporção de aspecto 104x20 (relação ~5.2:1)
  const width = Math.round(size * 5.2);

  return (
    <svg 
      width={width} 
      height={size} 
      viewBox="0 0 104 20" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${textColor || ''} ${className}`}
      aria-label="Kaxxa"
    >
      {/* K estilizado vetorial */}
      <path 
        d="M1 1C1 0.45 1.45 0 2 0H5.5C6.05 0 6.5 0.45 6.5 1V9.5L12 0.6C12.3 0.2 12.8 0 13.3 0H16.8C17.4 0 17.8 0.7 17.4 1.2L10.5 10.5L17.8 18.8C18.2 19.3 17.8 20 17.1 20H13.5C13 20 12.6 19.8 12.3 19.4L6.5 12.3V19C6.5 19.55 6.05 20 5.5 20H2C1.45 20 1 19.55 1 19V1Z" 
        fill={fillColor} 
      />
      {/* A geométrico estilizado */}
      <path 
        d="M28.5 0.5C29 0.2 29.6 0 30.2 0H32.8C33.4 0 34 0.2 34.5 0.5L42.2 18.7C42.5 19.4 42 20 41.2 20H37.5C36.8 20 36.3 19.6 36 19L34.2 14.8H28.8L27 19C26.7 19.6 26.2 20 25.5 20H21.8C21 20 20.5 19.4 20.8 18.7L28.5 0.5ZM32.8 11.5L31.5 5.5L30.2 11.5H32.8Z" 
        fill={fillColor} 
      />
      {/* Primeiro X em destaque azul com geometria afiada */}
      <path 
        d="M44.5 0.8C44.7 0.3 45.2 0 45.8 0H49.5C50 0 50.5 0.3 50.8 0.7L54 5.8L57.2 0.7C57.5 0.3 58 0 58.5 0H62.2C62.8 0 63.3 0.3 63.5 0.8C63.8 1.4 63.6 2 63.2 2.5L58 10L63.3 17.5C63.7 18 63.8 18.7 63.5 19.2C63.3 19.7 62.8 20 62.2 20H58.5C58 20 57.5 19.7 57.2 19.3L54 14.2L50.8 19.3C50.5 19.7 50 20 49.5 20H45.8C45.2 20 44.7 19.7 44.5 19.2C44.2 18.7 44.3 18 44.7 17.5L50 10L44.7 2.5C44.3 2 44.2 1.4 44.5 0.8Z" 
        fill={accentColor} 
      />
      {/* Segundo X simétrico */}
      <path 
        d="M65.5 0.8C65.7 0.3 66.2 0 66.8 0H70.5C71 0 71.5 0.3 71.8 0.7L75 5.8L78.2 0.7C78.5 0.3 79 0 79.5 0H83.2C83.8 0 84.3 0.3 84.5 0.8C84.8 1.4 84.6 2 84.2 2.5L79 10L84.3 17.5C84.7 18 84.8 18.7 84.5 19.2C84.3 19.7 83.8 20 83.2 20H79.5C79 20 78.5 19.7 78.2 19.3L75 14.2L71.8 19.3C71.5 19.7 71 20 70.5 20H66.8C66.2 20 65.7 19.7 65.5 19.2C65.2 18.7 65.3 18 65.7 17.5L71 10L65.7 2.5C65.3 2 65.2 1.4 65.5 0.8Z" 
        fill={accentColor} 
      />
      {/* A final correspondente */}
      <path 
        d="M93.5 0.5C94 0.2 94.6 0 95.2 0H97.8C98.4 0 99 0.2 99.5 0.5L107.2 18.7C107.5 19.4 107 20 106.2 20H102.5C101.8 20 101.3 19.6 101 19L99.2 14.8H93.8L92 19C91.7 19.6 91.2 20 90.5 20H86.8C86 20 85.5 19.4 85.8 18.7L93.5 0.5ZM97.8 11.5L96.5 5.5L95.2 11.5H97.8Z" 
        fill={fillColor} 
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
      <KaxxaWordmark size={Math.round(size * 0.72)} />
    </span>
  );
}

// Aliases para retrocompatibilidade
export const OctaMindLogo = KaxxaLogo;
export const GedisLogo = KaxxaLogo;
export const KapitolLogo = KaxxaLogo;
export const LogoXXAero = KaxxaKLogo;
