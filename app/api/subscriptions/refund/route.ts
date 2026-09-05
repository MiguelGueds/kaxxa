import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured, getAuthenticatedUser } from '@/lib/supabase';
import { refundService } from '@/lib/services/refunds';
import { subscriptionService } from '@/lib/services/subscription';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Usuário não autenticado.' }, { status: 401 });
    }

    const body = await req.json();
    const { reason, pixKey } = body;

    // Busca assinatura atual
    const subscription = await subscriptionService.getSubscription();
    if (!subscription || subscription.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Nenhuma assinatura ativa encontrada para solicitar estorno.' }, { status: 400 });
    }

    // Valida garantia legal de 7 dias
    if (subscription.created_at) {
      const created = new Date(subscription.created_at).getTime();
      if (!isNaN(created)) {
        const days = Math.floor((Date.now() - created) / (1000 * 60 * 60 * 24));
        if (days > 7) {
          return NextResponse.json({ 
            error: 'O prazo de garantia incondicional de 7 dias foi ultrapassado.' 
          }, { status: 400 });
        }
      }
    }

    // 1. Registra solicitação no serviço de reembolsos
    const refund = await refundService.createRefund({
      user_id: user.id,
      user_email: user.email || 'cliente@kaxxa.com',
      amount: subscription.amount ?? 39.90,
      payment_method: subscription.payment_method || 'PIX',
      reason: reason || 'Não informado',
      pix_key: pixKey || ''
    });

    // 2. Atualiza assinatura para CANCELED no Supabase e local
    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('subscriptions')
          .update({
            status: 'CANCELED',
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
      } catch (err) {
        console.warn('Erro ao atualizar status de assinatura no Supabase:', err);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Solicitação de reembolso registrada com sucesso. O estorno será processado em até 24h úteis.',
      refund
    });

  } catch (err: any) {
    console.error('Erro na rota de solicitação de reembolso:', err);
    return NextResponse.json({ error: err.message || 'Erro interno ao processar reembolso' }, { status: 500 });
  }
}
