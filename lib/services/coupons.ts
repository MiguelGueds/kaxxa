import fs from 'fs';
import path from 'path';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { saveSubscriptionLocal, DbSubscription } from '@/lib/services/subscription';

export interface Coupon {
  id: string;
  code: string;
  type: 'TRIAL_DAYS' | 'PERCENT' | 'FIXED';
  value: number; // e.g. 2 (for 2 days), 20 (for 20%), 10 (for R$ 10)
  discount_duration_months: number; // 1 = só no 1º mês, 2 = 2 meses, 3 = 3 meses, 0 = todos os meses
  max_uses: number;
  used_count: number;
  used_by: Array<{ user_id: string; email?: string; used_at: string }>;
  active: boolean;
  created_at: string;
}

export function calculateCouponDiscount(originalPrice: number, coupon: Coupon): { discountAmount: number; finalPrice: number } {
  if (coupon.type === 'TRIAL_DAYS') {
    return { discountAmount: originalPrice, finalPrice: 0 };
  }
  if (coupon.type === 'PERCENT') {
    const discount = Number(((originalPrice * coupon.value) / 100).toFixed(2));
    const finalPrice = Math.max(0, Number((originalPrice - discount).toFixed(2)));
    return { discountAmount: discount, finalPrice };
  }
  if (coupon.type === 'FIXED') {
    const discount = Math.min(originalPrice, Number(coupon.value.toFixed(2)));
    const finalPrice = Math.max(0, Number((originalPrice - discount).toFixed(2)));
    return { discountAmount: discount, finalPrice };
  }
  return { discountAmount: 0, finalPrice: originalPrice };
}

let MEMORY_COUPONS: Coupon[] | null = null;

function getStoragePaths() {
  const primaryDir = path.join(process.cwd(), 'data');
  const primaryFile = path.join(primaryDir, 'coupons.json');
  const tmpDir = '/tmp/kaxxa_data';
  const tmpFile = path.join(tmpDir, 'coupons.json');
  return { primaryDir, primaryFile, tmpDir, tmpFile };
}

function ensureLocalFile(): Coupon[] {
  if (MEMORY_COUPONS && MEMORY_COUPONS.length > 0) {
    return MEMORY_COUPONS;
  }

  const { primaryDir, primaryFile, tmpDir, tmpFile } = getStoragePaths();

  const defaultInitial: Coupon[] = [
    {
      id: 'cp_welcome_2d',
      code: 'TESTE-2DIAS',
      type: 'TRIAL_DAYS',
      value: 2,
      discount_duration_months: 1,
      max_uses: 99999,
      used_count: 0,
      used_by: [],
      active: true,
      created_at: new Date().toISOString(),
    }
  ];

  // 1. Tenta ler do primary (process.cwd)
  try {
    if (fs.existsSync(primaryFile)) {
      const data = fs.readFileSync(primaryFile, 'utf8');
      MEMORY_COUPONS = JSON.parse(data);
      if (MEMORY_COUPONS && MEMORY_COUPONS.length > 0) {
        // Assegura que TESTE-2DIAS sempre esteja disponível e ativo
        const t2 = MEMORY_COUPONS.find(c => c.code === 'TESTE-2DIAS');
        if (t2) {
          t2.max_uses = 99999;
          t2.active = true;
        }
        return MEMORY_COUPONS;
      }
    }
  } catch {}

  // 2. Tenta ler do /tmp
  try {
    if (fs.existsSync(tmpFile)) {
      const data = fs.readFileSync(tmpFile, 'utf8');
      MEMORY_COUPONS = JSON.parse(data);
      if (MEMORY_COUPONS && MEMORY_COUPONS.length > 0) return MEMORY_COUPONS;
    }
  } catch {}

  // 3. Se não houver em nenhum, inicializa no primary ou tmp
  try {
    if (!fs.existsSync(primaryDir)) fs.mkdirSync(primaryDir, { recursive: true });
    fs.writeFileSync(primaryFile, JSON.stringify(defaultInitial, null, 2), 'utf8');
    MEMORY_COUPONS = defaultInitial;
    return defaultInitial;
  } catch {
    try {
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
      fs.writeFileSync(tmpFile, JSON.stringify(defaultInitial, null, 2), 'utf8');
      MEMORY_COUPONS = defaultInitial;
      return defaultInitial;
    } catch {
      MEMORY_COUPONS = defaultInitial;
      return defaultInitial;
    }
  }
}

function saveLocalCoupons(coupons: Coupon[]) {
  MEMORY_COUPONS = coupons;
  const { primaryDir, primaryFile, tmpDir, tmpFile } = getStoragePaths();

  try {
    if (!fs.existsSync(primaryDir)) fs.mkdirSync(primaryDir, { recursive: true });
    fs.writeFileSync(primaryFile, JSON.stringify(coupons, null, 2), 'utf8');
  } catch {}

  try {
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    fs.writeFileSync(tmpFile, JSON.stringify(coupons, null, 2), 'utf8');
  } catch {}
}

export const couponService = {
  async listCoupons(): Promise<Coupon[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('coupons')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          saveLocalCoupons(data as Coupon[]);
          return data as Coupon[];
        }
      } catch {
        // Fallback local
      }
    }
    return ensureLocalFile();
  },

  async createCoupon(params: {
    code?: string;
    type?: 'TRIAL_DAYS' | 'PERCENT' | 'FIXED';
    value?: number;
    discountDurationMonths?: number;
    maxUses?: number;
  }): Promise<Coupon> {
    const type = params.type || 'TRIAL_DAYS';
    const code = (params.code || (type === 'TRIAL_DAYS' ? `TESTE-${Math.random().toString(36).substring(2, 6).toUpperCase()}` : `PROMO-${Math.random().toString(36).substring(2, 6).toUpperCase()}`)).trim().toUpperCase();
    const value = params.value ?? (type === 'TRIAL_DAYS' ? 2 : 20);
    const discountDurationMonths = params.discountDurationMonths ?? 1;
    const maxUses = params.maxUses ?? 1;

    const newCoupon: Coupon = {
      id: `cp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      code,
      type,
      value,
      discount_duration_months: discountDurationMonths,
      max_uses: maxUses,
      used_count: 0,
      used_by: [],
      active: true,
      created_at: new Date().toISOString(),
    };

    // Sempre salva localmente primeiro (memória e disco resiliente)
    const local = ensureLocalFile();
    const filtered = local.filter(c => c.code !== code);
    filtered.unshift(newCoupon);
    saveLocalCoupons(filtered);

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('coupons')
          .insert({
            id: newCoupon.id,
            code: newCoupon.code,
            type: newCoupon.type,
            value: newCoupon.value,
            discount_duration_months: newCoupon.discount_duration_months,
            max_uses: newCoupon.max_uses,
            used_count: 0,
            used_by: [],
            active: true,
            created_at: newCoupon.created_at,
          })
          .select()
          .single();

        if (!error && data) {
          return data as Coupon;
        }
      } catch {
        // Fallback local já salvo acima
      }
    }

    return newCoupon;
  },

  async deleteCoupon(idOrCode: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('coupons').delete().or(`id.eq.${idOrCode},code.eq.${idOrCode}`);
      } catch {
        // Fallback
      }
    }

    const local = ensureLocalFile();
    const filtered = local.filter(c => c.id !== idOrCode && c.code !== idOrCode);
    saveLocalCoupons(filtered);
    return true;
  },

  async getCoupon(code: string): Promise<Coupon | null> {
    const normalized = code.trim().toUpperCase();

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('coupons')
          .select('*')
          .eq('code', normalized)
          .maybeSingle();

        if (!error && data) {
          return data as Coupon;
        }
      } catch {
        // Fallback
      }
    }

    const local = ensureLocalFile();
    return local.find(c => c.code === normalized) || null;
  },

  async redeemCoupon(params: {
    code: string;
    userId: string;
    email?: string;
  }): Promise<{ success: boolean; days?: number; endsAt?: string; subscription?: DbSubscription | null; message: string }> {
    const coupon = await this.getCoupon(params.code);

    if (!coupon) {
      throw new Error('Cupom não encontrado.');
    }

    if (!coupon.active) {
      throw new Error('Este cupom está inativo ou expirado.');
    }

    if (coupon.used_count >= coupon.max_uses) {
      throw new Error('Este cupom já foi utilizado e esgotou o limite de usos.');
    }

    const alreadyUsed = (coupon.used_by || []).some(u => 
      (u.user_id && u.user_id === params.userId) || 
      (u.email && params.email && u.email.toLowerCase() === params.email.toLowerCase())
    );

    if (alreadyUsed) {
      throw new Error('Você já utilizou este cupom nesta conta.');
    }

    let durationDays = 30;
    if (coupon.type === 'TRIAL_DAYS') {
      durationDays = coupon.value || 30;
    } else if (coupon.discount_duration_months && coupon.discount_duration_months > 0) {
      durationDays = coupon.discount_duration_months * 30;
    }

    const currentPeriodEnd = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

    const createdSubscription: DbSubscription = {
      id: `cupom-${coupon.code.toLowerCase()}-${Date.now()}`,
      user_id: params.userId,
      status: coupon.type === 'TRIAL_DAYS' ? 'TRIAL' : 'ACTIVE',
      plan_type: 'MENSAL',
      payment_method: 'PIX',
      payment_id: `cupom-${coupon.code.toLowerCase()}-${Date.now()}`,
      amount: coupon.type === 'TRIAL_DAYS' ? 0.00 : (coupon.value === 100 ? 0.00 : 39.90),
      current_period_end: currentPeriodEnd,
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    // Sempre salva no fallback resiliente
    saveSubscriptionLocal(createdSubscription);

    if (isSupabaseConfigured()) {
      try {
        const { error: subError } = await supabase
          .from('subscriptions')
          .upsert(createdSubscription, { onConflict: 'user_id' });

        if (subError) {
          console.warn('Supabase subscriptions indisponível para upsert, usando fallback local:', subError);
        }
      } catch (err) {
        console.warn('Supabase subscriptions upsert falhou, acesso local garantido:', err);
      }
    }

    // Atualiza uso do cupom e marca inativo se limite for atingido
    const updatedUsedBy = [
      ...(coupon.used_by || []),
      { user_id: params.userId, email: params.email, used_at: new Date().toISOString() }
    ];
    const newUsedCount = (coupon.used_count || 0) + 1;
    const isNowActive = newUsedCount < coupon.max_uses;

    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('coupons')
          .update({
            used_count: newUsedCount,
            used_by: updatedUsedBy,
            active: isNowActive,
          })
          .eq('id', coupon.id);
      } catch {
        // Fallback
      }
    }

    const local = ensureLocalFile();
    const idx = local.findIndex(c => c.id === coupon.id || c.code === coupon.code);
    if (idx !== -1) {
      local[idx].used_count = newUsedCount;
      local[idx].used_by = updatedUsedBy;
      local[idx].active = isNowActive;
      saveLocalCoupons(local);
    }

    return {
      success: true,
      days: durationDays,
      endsAt: currentPeriodEnd,
      subscription: createdSubscription,
      message: coupon.type === 'TRIAL_DAYS'
        ? `Cupom ativado com sucesso! Você ganhou ${coupon.value} dias de degustação.`
        : `Cupom de desconto aplicado com sucesso!`
    };
  }
};
