import React from 'react';

export function KaxxaKLogo({ 
  size = 28, 
  className = "" 
}: { 
  size?: number; 
  className?: string; 
}) {
  return (
    <span 
      className={`inline-flex items-center justify-center shrink-0 select-none ${className}`}
      style={{ width: size, height: size }}
      aria-label="Kaxxa Emblem"
    >
      {/* Tema Claro: Emblema K Oficial Colorido */}
      <img 
        src="/logos/kaxxa-k-emblem.png" 
        alt="Kaxxa" 
        width={size} 
        height={size}
        className="w-full h-full object-contain block dark:hidden select-none pointer-events-none"
      />
      {/* Tema Escuro: Emblema K Branco Puro */}
      <img 
        src="/logos/kaxxa-k-emblem-white.png" 
        alt="Kaxxa" 
        width={size} 
        height={size}
        className="w-full h-full object-contain hidden dark:block select-none pointer-events-none"
      />
    </span>
  );
}

export function KaxxaWordmark({ 
  size = 24,
  className = "",
  textColor = ""
}: { 
  size?: number;
  className?: string; 
  textColor?: string;
  fillColor?: string;
  accentColor?: string;
}) {
  // Proporção de aspecto 1024x341 ≈ 3:1
  const width = Math.round(size * 3.0);

  return (
    <span 
      className={`inline-flex items-center shrink-0 select-none ${className}`}
      style={{ height: size, width }}
      aria-label="Kaxxa"
    >
      {/* Tema Claro: Logo Oficial Colorida */}
      <img 
        src="/logos/kaxxa-logo.png" 
        alt="Kaxxa" 
        style={{ height: size, width: 'auto' }}
        className="object-contain block dark:hidden select-none pointer-events-none max-h-full"
      />
      {/* Tema Escuro: Logo Oficial Toda Branca */}
      <img 
        src="/logos/kaxxa-logo-white.png" 
        alt="Kaxxa" 
        style={{ height: size, width: 'auto' }}
        className="object-contain hidden dark:block select-none pointer-events-none max-h-full"
      />
    </span>
  );
}

export function KaxxaLogo({ 
  size = 26, 
  className = "", 
  textColor = "" 
}: { 
  size?: number; 
  className?: string; 
  textColor?: string; 
}) {
  // O logo completo oficial já engloba o símbolo 'K' e o nome 'KAXXA'
  const width = Math.round(size * 3.0);

  return (
    <span 
      className={`inline-flex items-center shrink-0 select-none ${className}`}
      style={{ height: size, width }}
      aria-label="Kaxxa"
    >
      {/* Tema Claro: Logo Oficial Colorida */}
      <img 
        src="/logos/kaxxa-logo.png" 
        alt="Kaxxa" 
        style={{ height: size, width: 'auto' }}
        className="object-contain block dark:hidden select-none pointer-events-none max-h-full"
      />
      {/* Tema Escuro: Logo Oficial 100% Branca */}
      <img 
        src="/logos/kaxxa-logo-white.png" 
        alt="Kaxxa" 
        style={{ height: size, width: 'auto' }}
        className="object-contain hidden dark:block select-none pointer-events-none max-h-full"
      />
    </span>
  );
}

// Aliases para retrocompatibilidade em todo o sistema
export const OctaMindLogo = KaxxaLogo;
export const GedisLogo = KaxxaLogo;
export const KapitolLogo = KaxxaLogo;
export const LogoXXAero = KaxxaKLogo;
