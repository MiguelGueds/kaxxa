import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { email, name, userId } = await req.json();

    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!accessToken) {
      return NextResponse.json({ error: 'Mercado Pago não configurado no servidor' }, { status: 500 });
    }

    const host = req.headers.get('host') || 'kaxxa.com.br';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;

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
          transaction_amount: 39.90,
          currency_id: 'BRL'
        },
        back_url: `${baseUrl}/dashboard`,
        status: 'pending'
      })
    });

    const data = await mpRes.json();
    if (!mpRes.ok) {
      console.error('Mercado Pago subscription error:', data);
      return NextResponse.json({ error: data.message || 'Erro ao criar assinatura no cartão' }, { status: 400 });
    }

    return NextResponse.json({
      preapprovalId: data.id,
      initPoint: data.init_point
    });
  } catch (error: any) {
    console.error('Error creating card subscription:', error);
    return NextResponse.json({ error: error.message || 'Erro interno ao processar cartão' }, { status: 500 });
  }
}
