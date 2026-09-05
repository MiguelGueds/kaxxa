import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  req: Request,
  { params }: { params: { paymentId: string } }
) {
  try {
    const paymentId = params.paymentId;
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    const planType = (url.searchParams.get('planType') || 'MENSAL') as 'MENSAL' | 'ANUAL';
    const forceApprove = url.searchParams.get('forceApprove') === 'true';

    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

    // 1. Consulta oficial se tiver token do Mercado Pago
    if (accessToken && !accessToken.includes('seu-token') && accessToken.startsWith('APP_USR') && !paymentId.startsWith('sim-')) {
      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (mpResponse.ok) {
        const mpData = await mpResponse.json();
        const status = mpData.status; // 'approved', 'pending', 'rejected', etc.

        if (status === 'approved' && userId) {
          const durationDays = 30; // Plano mensal
          const periodEnd = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

          await supabase.from('subscriptions').upsert({
            user_id: userId,
            status: 'ACTIVE',
            plan_type: planType,
            payment_method: mpData.payment_method_id === 'pix' ? 'PIX' : 'CREDIT_CARD',
            payment_id: String(paymentId),
            amount: Number(mpData.transaction_amount || 0),
            current_period_end: periodEnd,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });

          return NextResponse.json({
            status: 'approved',
            accessGranted: true
          });
        }

        return NextResponse.json({
          status: status,
          accessGranted: status === 'approved'
        });
      }
    }

    // 2. Modo Simulação / Teste: se forceApprove for true ou simulado
    if (forceApprove && userId) {
      const durationDays = 30; // Plano único mensal
      const periodEnd = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

      await supabase.from('subscriptions').upsert({
        user_id: userId,
        status: 'ACTIVE',
        plan_type: 'MENSAL',
        payment_method: 'PIX',
        payment_id: String(paymentId),
        amount: 39.90,
        current_period_end: periodEnd,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

      return NextResponse.json({
        status: 'approved',
        accessGranted: true,
        isSimulation: true
      });
    }

    return NextResponse.json({
      status: 'pending',
      accessGranted: false
    });

  } catch (error: any) {
    console.error('Erro ao consultar status do pagamento:', error);
    return NextResponse.json({ error: error.message || 'Erro ao consultar status' }, { status: 500 });
  }
}

