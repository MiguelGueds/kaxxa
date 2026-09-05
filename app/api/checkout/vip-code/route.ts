import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const VALID_VIP_CODES: Record<string, number> = {
  'AMIGOKAXA': 2,
  'VIP2': 2,
  'TESTE2DIAS': 2,
  'VIP7': 7,
  'TESTE7DIAS': 7,
  'CONVIDADO': 3,
  'ADMINVIP': 30,
};

export async function POST(req: Request) {
  try {
    const { code, userId, email } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'Faça login com o Google para ativar o acesso de teste.' }, { status: 401 });
    }

    const normalizedCode = String(code || '').trim().toUpperCase();
    const days = VALID_VIP_CODES[normalizedCode];

    if (!days) {
      return NextResponse.json({ error: 'Código VIP inválido ou expirado.' }, { status: 400 });
    }

    const currentPeriodEnd = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

    const { error } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        status: 'TRIAL',
        plan_type: 'MENSAL',
        payment_method: 'PIX',
        payment_id: `vip-${normalizedCode.toLowerCase()}-${Date.now()}`,
        amount: 0.00,
        current_period_end: currentPeriodEnd,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (error) {
      console.error('Erro ao ativar VIP:', error);
      return NextResponse.json({ error: 'Não foi possível ativar o acesso de teste.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      days,
      expiresAt: currentPeriodEnd,
      message: `Acesso VIP de ${days} dias liberado com sucesso!`
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erro ao processar código VIP.' }, { status: 500 });
  }
}
