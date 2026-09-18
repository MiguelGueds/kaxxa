import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

export async function GET() {
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#1A44C8"/><path d="M18 14h9v14l14-14h12L36 31l18 19H42L27 35v15h-9z" fill="white"/></svg>`;
  return new NextResponse(svgContent, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}

