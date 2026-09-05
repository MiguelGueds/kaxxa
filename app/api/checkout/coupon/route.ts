import { NextResponse } from 'next/server';
import { couponService } from '@/lib/services/coupons';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { action, code, userId, email } = await req.json();

    if (!code) {
      return NextResponse.json({ error: 'Informe um código de cupom.' }, { status: 400 });
    }

    const normalizedCode = String(code).trim().toUpperCase();

    // 1. Apenas VALIDAR
    if (action === 'VALIDATE') {
      const coupon = await couponService.getCoupon(normalizedCode);

      if (!coupon) {
        return NextResponse.json({ error: 'Cupom não encontrado ou inválido.' }, { status: 404 });
      }

      if (!coupon.active || coupon.used_count >= coupon.max_uses) {
        return NextResponse.json({ 
          error: 'Este cupom já foi utilizado ou atingiu o limite de usos.' 
        }, { status: 400 });
      }

      if (userId && (coupon.used_by || []).some(u => u.user_id === userId)) {
        return NextResponse.json({ 
          error: 'Você já utilizou este cupom de teste nesta conta.' 
        }, { status: 400 });
      }

      return NextResponse.json({
        valid: true,
        code: coupon.code,
        type: coupon.type,
        days: coupon.value,
        message: `Cupom válido! ${coupon.value} dias de acesso degustação grátis.`
      });
    }

    // 2. RESGATAR / ATIVAR
    if (action === 'REDEEM') {
      if (!userId) {
        return NextResponse.json({ error: 'Faça login com o Google para ativar seu cupom.' }, { status: 401 });
      }

      const result = await couponService.redeemCoupon({
        code: normalizedCode,
        userId,
        email,
      });

      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Ação inválida.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao processar cupom.' }, { status: 500 });
  }
}
