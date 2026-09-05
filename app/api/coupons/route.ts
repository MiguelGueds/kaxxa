import { NextResponse } from 'next/server';
import { couponService } from '@/lib/services/coupons';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const coupons = await couponService.listCoupons();
    return NextResponse.json({ coupons });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao listar cupons.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code, type, value, discountDurationMonths, maxUses } = body;

    const coupon = await couponService.createCoupon({
      code: code ? String(code).trim().toUpperCase() : undefined,
      type: type || 'TRIAL_DAYS',
      value: value ? Number(value) : (type === 'TRIAL_DAYS' ? 2 : 20),
      discountDurationMonths: discountDurationMonths !== undefined ? Number(discountDurationMonths) : 1,
      maxUses: maxUses ? Number(maxUses) : 1,
    });

    return NextResponse.json({ success: true, coupon });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao criar cupom.' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID do cupom não informado.' }, { status: 400 });
    }

    await couponService.deleteCoupon(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao remover cupom.' }, { status: 500 });
  }
}
