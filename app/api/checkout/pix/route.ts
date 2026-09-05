import { NextResponse } from 'next/server';
import { couponService, calculateCouponDiscount } from '@/lib/services/coupons';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { planType, email, name, userId, couponCode } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'Você precisa estar logado para gerar o pagamento via PIX.' }, { status: 401 });
    }

    let amount = 39.90;
    if (couponCode) {
      const coupon = await couponService.getCoupon(couponCode);
      if (coupon && coupon.active && coupon.used_count < coupon.max_uses) {
        const { finalPrice } = calculateCouponDiscount(39.90, coupon);
        amount = finalPrice;
      }
    }

    const description = 'Kaxxa Finanças - Assinatura Mensal (Acesso Completo)';

    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

    // Se as credenciais do Mercado Pago estiverem presentes, chama a API oficial
    if (accessToken && !accessToken.includes('seu-token') && accessToken.startsWith('APP_USR')) {
      const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': `pix-${userId || Date.now()}-${Date.now()}`
        },
        body: JSON.stringify({
          transaction_amount: amount,
          description: description,
          payment_method_id: 'pix',
          payer: {
            email: email || 'cliente@kaxxa.com.br',
            first_name: name ? name.split(' ')[0] : 'Cliente',
            last_name: name && name.split(' ').length > 1 ? name.split(' ').slice(1).join(' ') : 'Kaxxa'
          },
          metadata: {
            user_id: userId,
            plan_type: planType
          }
        })
      });

      const mpData = await mpResponse.json();

      if (!mpResponse.ok) {
        console.error('Erro na API Mercado Pago:', mpData);
        return NextResponse.json({ error: mpData.message || 'Erro ao gerar pagamento no Mercado Pago' }, { status: 400 });
      }

      const txData = mpData.point_of_interaction?.transaction_data;

      return NextResponse.json({
        success: true,
        paymentId: String(mpData.id),
        qrCode: txData?.qr_code,
        qrCodeBase64: txData?.qr_code_base64,
        amount: amount,
        planType: planType,
        status: mpData.status
      });
    }

    // Modo Sandbox / Demonstração (Quando o usuário ainda não colou o token de produção do Mercado Pago)
    const simulatedPaymentId = `sim-mp-${Date.now()}`;
    const simulatedCopiaCola = `00020101021226840014br.gov.bcb.pix2562qrcodes-pix.mercadopago.com/v2/${simulatedPaymentId}5204000053039865405${amount.toFixed(2)}5802BR5920Kaxxa Financas SaaS6009Sao Paulo62070503***6304E8A1`;

    return NextResponse.json({
      success: true,
      paymentId: simulatedPaymentId,
      qrCode: simulatedCopiaCola,
      qrCodeBase64: null, // O frontend gera SVG dinâmico quando for null
      amount: amount,
      planType: planType,
      status: 'pending',
      isSimulation: true
    });

  } catch (error: any) {
    console.error('Erro no checkout PIX:', error);
    return NextResponse.json({ error: error.message || 'Erro interno ao processar PIX' }, { status: 500 });
  }
}

