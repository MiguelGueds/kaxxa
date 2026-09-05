import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase';
import { isAdminEmail } from '@/lib/admin';
import { refundService } from '@/lib/services/refunds';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user || !isAdminEmail(user.email)) {
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
    const user = await getAuthenticatedUser();
    if (!user || !isAdminEmail(user.email)) {
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

