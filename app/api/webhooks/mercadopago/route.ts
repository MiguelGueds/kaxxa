import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const body = await req.json().catch(() => ({}));

    // Mercado Pago envia id do pagamento na query (?id=... ou ?data.id=...) ou no body ({ data: { id: ... } })
    const paymentId = url.searchParams.get('data.id') || url.searchParams.get('id') || body.data?.id || body.id;
    const topic = url.searchParams.get('type') || url.searchParams.get('topic') || body.type || body.action;

    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

    if (paymentId && accessToken && (topic === 'payment' || topic?.includes('payment'))) {
      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (mpResponse.ok) {
        const payment = await mpResponse.json();
        const userId = payment.metadata?.user_id || payment.external_reference;
        const planType = payment.metadata?.plan_type || 'MENSAL';

        if (payment.status === 'approved' && userId) {
          const durationDays = 30; // Plano único mensal
          const periodEnd = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

          await supabase.from('subscriptions').upsert({
            user_id: userId,
            status: 'ACTIVE',
            plan_type: planType,
            payment_method: payment.payment_method_id === 'pix' ? 'PIX' : 'CREDIT_CARD',
            payment_id: String(payment.id),
            amount: Number(payment.transaction_amount || 0),
            current_period_end: periodEnd,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });

          console.log(`[Webhook Mercado Pago] Assinatura ativada com sucesso para usuário: ${userId}`);
        } else if (['refunded', 'cancelled', 'charged_back'].includes(payment.status) && userId) {
          await supabase.from('subscriptions').update({
            status: 'CANCELED',
            updated_at: new Date().toISOString()
          }).eq('user_id', userId);

          console.log(`[Webhook Mercado Pago] Assinatura cancelada/estornada para usuário: ${userId} (status: ${payment.status})`);
        }
      }
    }

    // Processamento de Assinatura Recorrente no Cartão (Preapproval)
    if (paymentId && accessToken && (topic === 'subscription_preapproval' || topic?.includes('preapproval'))) {
      const mpResponse = await fetch(`https://api.mercadopago.com/preapproval/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (mpResponse.ok) {
        const sub = await mpResponse.json();
        const userId = sub.external_reference;

        if (userId && userId !== 'anonymous') {
          if (sub.status === 'authorized') {
            const periodEnd = sub.next_payment_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

            await supabase.from('subscriptions').upsert({
              user_id: userId,
              status: 'ACTIVE',
              plan_type: 'MENSAL',
              payment_method: 'CREDIT_CARD',
              payment_id: String(sub.id),
              amount: Number(sub.auto_recurring?.transaction_amount || 39.90),
              current_period_end: periodEnd,
              updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });

            console.log(`[Webhook Mercado Pago] Assinatura recorrente de cartão ativada para usuário: ${userId}`);
          } else if (sub.status === 'cancelled') {
            await supabase.from('subscriptions').update({
              status: 'CANCELED',
              updated_at: new Date().toISOString()
            }).eq('user_id', userId);

            console.log(`[Webhook Mercado Pago] Assinatura recorrente cancelada para usuário: ${userId}`);
          }
        }
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('[Webhook Mercado Pago] Erro ao processar:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 200 }); // Retorna 200 para evitar retentativas infinitas
  }
}

