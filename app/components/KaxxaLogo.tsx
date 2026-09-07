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
  // Proporção de largura baseada na altura original do vetor (1024 / 341 ≈ 3.0)
  const width = Math.round(size * 3.0);

  return (
    <svg 
      width={width} 
      height={size} 
      viewBox="0 0 1024 341" 
      fill="currentColor" 
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${textColor} ${className}`}
      aria-label="Kaxxa"
    >
      <g transform="translate(0.000000,341.000000) scale(0.100000,-0.100000)">
        <path d="M580 2670 c-41 -3 -88 -12 -105 -19 -51 -21 -109 -77 -140 -132 l-30 -54 -3 -747 -2 -747 39 -78 c44 -88 55 -100 131 -139 54 -28 58 -29 240 -32 176 -2 186 -1 210 19 l25 21 3 931 2 931 -27 28 c-27 28 -27 28 -147 26 -67 -1 -155 -4 -196 -8z"/>
        <path d="M2157 2650 c-197 -16 -360 -30 -361 -32 -2 -1 -184 -205 -405 -452 -222 -247 -405 -454 -407 -460 -3 -7 15 -65 40 -130 l44 -117 179 -187 c426 -447 414 -435 543 -495 l115 -53 285 35 285 34 334 494 c184 272 338 496 342 498 3 3 141 -203 305 -457 l299 -461 101 -70 101 -69 279 11 c153 7 297 14 320 17 37 4 64 26 284 229 l244 224 200 -192 c111 -105 219 -208 241 -228 l40 -37 360 -11 c198 -6 385 -13 415 -16 l55 -4 298 244 c164 135 303 245 307 245 5 0 118 -104 251 -230 l241 -230 52 -1 c28 0 161 -6 296 -13 l245 -13 111 61 112 61 303 475 303 475 306 -510 306 -510 281 0 c155 0 284 3 288 7 4 4 -186 341 -422 750 l-429 743 -148 91 -148 91 -158 -66 -159 -66 -377 -620 c-207 -341 -382 -625 -388 -632 -10 -11 -171 152 -438 442 l-58 63 409 428 c224 236 403 431 398 433 -5 2 -140 -2 -300 -9 l-290 -12 -264 -251 c-146 -139 -268 -253 -272 -255 -4 -1 -156 117 -337 264 l-329 266 -75 -6 c-41 -3 -196 -8 -345 -12 -148 -4 -280 -10 -293 -15 -12 -5 -129 -111 -260 -236 -131 -126 -249 -238 -264 -251 l-26 -24 -259 240 -260 239 -69 6 c-141 13 -552 30 -568 24 -11 -4 -16 -19 -16 -45 0 -38 9 -48 393 -425 l394 -385 -229 -244 c-126 -133 -233 -247 -237 -251 -5 -5 -187 265 -405 600 l-396 608 -119 73 -118 72 -178 -64 c-98 -36 -182 -71 -186 -78 -40 -71 -743 -1123 -750 -1123 -5 0 -96 83 -202 186 -105 102 -226 217 -268 257 l-76 72 -239 33 c-278 39 -296 26 150 108 l289 53 413 375 413 375 -21 38 c-15 26 -28 38 -42 37 -12 -1 -182 -14 -379 -29z"/>
      </g>
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
