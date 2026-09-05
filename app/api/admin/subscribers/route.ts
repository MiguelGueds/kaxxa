import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured, getAuthenticatedUser } from '@/lib/supabase';
import { isAdminEmail } from '@/lib/admin';
import { couponService } from '@/lib/services/coupons';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    
    // Validação estrita de Admin
    if (!user || !isAdminEmail(user.email)) {
      return NextResponse.json({ error: 'Acesso restrito a administradores.' }, { status: 403 });
    }

    let subscriptions: any[] = [];
    let coupons = await couponService.listCoupons();

    // 1. Tenta buscar da tabela subscriptions no Supabase
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('subscriptions')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          subscriptions = data;
        }
      } catch (err) {
        console.error('Erro ao buscar subscriptions no admin:', err);
      }
    }

    // 2. Coleta usuários que resgataram cupons (de coupons.used_by)
    const couponUsersMap = new Map<string, { email: string; couponCode: string; usedAt: string; type: string; value: number }>();
    for (const c of coupons) {
      if (Array.isArray(c.used_by)) {
        for (const u of c.used_by) {
          if (u.user_id) {
            couponUsersMap.set(u.user_id, {
              email: u.email || 'Usuário Kaxxa',
              couponCode: c.code,
              usedAt: u.used_at,
              type: c.type,
              value: c.value
            });
          }
        }
      }
    }

    // 3. Monta a lista consolidada de usuários
    const usersMap = new Map<string, any>();

    // Insere os que têm registro na tabela subscriptions
    for (const sub of subscriptions) {
      const couponInfo = couponUsersMap.get(sub.user_id);
      const isTrial = sub.status === 'TRIAL' || sub.amount === 0;
      const isRecurring = sub.payment_method === 'CREDIT_CARD';

      usersMap.set(sub.user_id, {
        id: sub.user_id,
        email: sub.user_email || couponInfo?.email || `cliente-${sub.user_id.slice(0, 6)}@kaxxa.com`,
        status: sub.status || 'ACTIVE',
        planType: sub.plan_type || 'MENSAL',
        paymentMethod: sub.payment_method || 'PIX',
        isRecurring,
        amount: Number(sub.amount || (isTrial ? 0 : 39.90)),
        isTrial,
        couponCode: couponInfo?.couponCode || null,
        discountLabel: couponInfo 
          ? (couponInfo.type === 'TRIAL_DAYS' ? `${couponInfo.value} dias grátis` : `${couponInfo.value}% de desconto`)
          : (sub.amount > 0 && sub.amount < 39.90 ? `Desconto especial (R$ ${(39.90 - sub.amount).toFixed(2)})` : 'Nenhum'),
        currentPeriodEnd: sub.current_period_end || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: sub.created_at || new Date().toISOString()
      });
    }

    // Insere os que resgataram cupom mas ainda não tinham registro em subscriptions
    for (const [userId, info] of Array.from(couponUsersMap.entries())) {
      if (!usersMap.has(userId)) {
        usersMap.set(userId, {
          id: userId,
          email: info.email,
          status: 'TRIAL',
          planType: 'MENSAL',
          paymentMethod: 'PIX',
          isRecurring: false,
          amount: 0.00,
          isTrial: true,
          couponCode: info.couponCode,
          discountLabel: info.type === 'TRIAL_DAYS' ? `${info.value} dias degustação` : `${info.value}% off`,
          currentPeriodEnd: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: info.usedAt || new Date().toISOString()
        });
      }
    }

    const consolidatedUsers = Array.from(usersMap.values());

    // Se a base estiver limpa/nova, inclui a conta admin para visualização da estrutura
    if (consolidatedUsers.length === 0) {
      consolidatedUsers.push({
        id: user.id,
        email: user.email,
        status: 'ACTIVE',
        planType: 'ANUAL',
        paymentMethod: 'CREDIT_CARD',
        isRecurring: true,
        amount: 0.00,
        isTrial: false,
        couponCode: 'MASTER-DEV',
        discountLabel: 'Acesso Vitalício Admin',
        currentPeriodEnd: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString()
      });
    }

    // Métricas
    const totalUsers = consolidatedUsers.length;
    const activePaying = consolidatedUsers.filter(u => u.status === 'ACTIVE' && u.amount > 0).length;
    const trialUsers = consolidatedUsers.filter(u => u.isTrial || u.status === 'TRIAL').length;
    const mrr = consolidatedUsers
      .filter(u => u.status === 'ACTIVE')
      .reduce((acc, u) => acc + (u.amount || 0), 0);

    return NextResponse.json({
      success: true,
      metrics: {
        totalUsers,
        activePaying,
        trialUsers,
        mrr
      },
      users: consolidatedUsers
    });

  } catch (err: any) {
    console.error('Erro no endpoint admin/subscribers:', err);
    return NextResponse.json({ error: err.message || 'Erro interno ao listar usuários' }, { status: 500 });
  }
}

