import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { isAdminEmail } from '@/lib/admin';
import { refundService } from '@/lib/services/refunds';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    let userEmail: string | null = req.headers.get('x-user-email') || null;

    if (token) {
      try {
        const client = supabaseAdmin || supabase;
        const { data: { user } } = await client.auth.getUser(token);
        if (user?.email) {
          userEmail = user.email;
        }
      } catch {}
    }

    if (!userEmail || !isAdminEmail(userEmail)) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    const refunds = await refundService.listRefunds();
    return NextResponse.json({ success: true, refunds });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao listar reembolsos.' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    let userEmail: string | null = req.headers.get('x-user-email') || null;

    if (token) {
      try {
        const client = supabaseAdmin || supabase;
        const { data: { user } } = await client.auth.getUser(token);
        if (user?.email) {
          userEmail = user.email;
        }
      } catch {}
    }

    if (!userEmail || !isAdminEmail(userEmail)) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID da solicitação obrigatório.' }, { status: 400 });
    }

    const success = await refundService.markAsRefunded(id);
    return NextResponse.json({ success });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao atualizar reembolso.' }, { status: 500 });
  }
}

