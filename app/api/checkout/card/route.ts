import { NextResponse } from 'next/server';
import { couponService, calculateCouponDiscount } from '@/lib/services/coupons';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { email, name, userId, recurring = true, couponCode } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'Você precisa estar logado para realizar o pagamento no cartão.' }, { status: 401 });
    }

    let amount = 39.90;
    if (couponCode) {
      const coupon = await couponService.getCoupon(couponCode);
      if (coupon && coupon.active && coupon.used_count < coupon.max_uses) {
        const { finalPrice } = calculateCouponDiscount(39.90, coupon);
        amount = finalPrice;
      }
    }

    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!accessToken) {
      return NextResponse.json({ error: 'Mercado Pago não configurado no servidor' }, { status: 500 });
    }

    const host = req.headers.get('host') || 'kaxxa.com.br';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;

    if (recurring) {
      // 1. Assinatura Mensal Recorrente Automática (Preapproval)
      const mpRes = await fetch('https://api.mercadopago.com/preapproval', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason: 'Kaxxa Finanças - Assinatura Mensal Recorrente',
          external_reference: userId || '',
          payer_email: email || 'cliente@kaxxa.com.br',
          auto_recurring: {
            frequency: 1,
            frequency_type: 'months',
            transaction_amount: amount,
            currency_id: 'BRL'
          },
          back_url: `${baseUrl}/dashboard`,
          status: 'pending'
        })
      });

      const data = await mpRes.json();
      if (!mpRes.ok) {
        console.error('Mercado Pago recurring error:', data);
        return NextResponse.json({ error: data.message || 'Erro ao criar assinatura recorrente no cartão' }, { status: 400 });
      }

      return NextResponse.json({
        preapprovalId: data.id,
        initPoint: data.init_point
      });
    } else {
      // 2. Pagamento Único no Cartão (Preferência Avulsa de 30 dias)
      const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: [
            {
              id: 'kaxxa-plano-mensal-avulso',
              title: 'Kaxxa Finanças - Acesso 30 Dias (Pagamento Único)',
              description: 'Acesso completo de 30 dias à plataforma Kaxxa Finanças',
              quantity: 1,
              currency_id: 'BRL',
              unit_price: amount
            }
          ],
          payer: {
            email: email || 'cliente@kaxxa.com.br',
            name: name || 'Cliente Kaxxa'
          },
          payment_methods: {
            excluded_payment_types: [
              { id: 'ticket' },
              { id: 'bank_transfer' }
            ],
            installments: 1
          },
          back_urls: {
            success: `${baseUrl}/dashboard?payment=success`,
            failure: `${baseUrl}/planos?payment=failure`,
            pending: `${baseUrl}/dashboard?payment=pending`
          },
          auto_return: 'approved',
          external_reference: userId || ''
        })
      });

      const data = await mpRes.json();
      if (!mpRes.ok) {
        console.error('Mercado Pago single card error:', data);
        return NextResponse.json({ error: data.message || 'Erro ao criar checkout de pagamento único no cartão' }, { status: 400 });
      }

      return NextResponse.json({
        preferenceId: data.id,
        initPoint: data.init_point
      });
    }
  } catch (error: any) {
    console.error('Error creating card payment:', error);
    return NextResponse.json({ error: error.message || 'Erro interno ao processar cartão' }, { status: 500 });
  }
}

