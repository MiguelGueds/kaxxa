import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-static';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'icon.svg');
    const svgContent = fs.readFileSync(filePath, 'utf8');
    return new NextResponse(svgContent, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return new NextResponse('', { status: 404 });
  }
}
