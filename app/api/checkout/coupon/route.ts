import { NextResponse } from 'next/server';
import { couponService, calculateCouponDiscount } from '@/lib/services/coupons';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { action, code, userId, email, originalPrice = 39.90 } = await req.json();

    if (!code) {
      return NextResponse.json({ error: 'Informe um código de cupom.' }, { status: 400 });
    }

    const normalizedCode = String(code).trim().toUpperCase();

    // 1. VALIDAR
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
          error: 'Você já utilizou este cupom nesta conta.' 
        }, { status: 400 });
      }

      const { discountAmount, finalPrice } = calculateCouponDiscount(originalPrice, coupon);

      let durationLabel = 'no 1º mês';
      if (coupon.discount_duration_months === 0) {
        durationLabel = 'em todos os meses';
      } else if (coupon.discount_duration_months > 1) {
        durationLabel = `nos ${coupon.discount_duration_months} primeiros meses`;
      }

      let message = '';
      if (coupon.type === 'TRIAL_DAYS') {
        message = `Cupom válido! ${coupon.value} dias de degustação gratuita.`;
      } else if (coupon.type === 'PERCENT') {
        message = `Cupom aplicado! ${coupon.value}% de desconto ${durationLabel}.`;
      } else if (coupon.type === 'FIXED') {
        message = `Cupom aplicado! R$ ${coupon.value.toFixed(2)} de desconto ${durationLabel}.`;
      }

      return NextResponse.json({
        valid: true,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        discountDurationMonths: coupon.discount_duration_months ?? 1,
        discountAmount,
        finalPrice,
        message
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
