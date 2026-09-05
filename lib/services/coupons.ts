import fs from 'fs';
import path from 'path';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export interface Coupon {
  id: string;
  code: string;
  type: 'TRIAL_DAYS' | 'PERCENT';
  value: number; // e.g. 2 (for 2 days) or 100 (for 100% off)
  max_uses: number;
  used_count: number;
  used_by: Array<{ user_id: string; email?: string; used_at: string }>;
  active: boolean;
  created_at: string;
}

const LOCAL_COUPONS_DIR = path.join(process.cwd(), 'data');
const LOCAL_COUPONS_FILE = path.join(LOCAL_COUPONS_DIR, 'coupons.json');

// Garante arquivo local como fallback confiável
function ensureLocalFile(): Coupon[] {
  try {
    if (!fs.existsSync(LOCAL_COUPONS_DIR)) {
      fs.mkdirSync(LOCAL_COUPONS_DIR, { recursive: true });
    }
    if (!fs.existsSync(LOCAL_COUPONS_FILE)) {
      const initial: Coupon[] = [
        {
          id: 'cp_welcome_2d',
          code: 'TESTE-2DIAS',
          type: 'TRIAL_DAYS',
          value: 2,
          max_uses: 1,
          used_count: 0,
          used_by: [],
          active: true,
          created_at: new Date().toISOString(),
        }
      ];
      fs.writeFileSync(LOCAL_COUPONS_FILE, JSON.stringify(initial, null, 2), 'utf8');
      return initial;
    }
    const data = fs.readFileSync(LOCAL_COUPONS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Erro ao ler coupons locais:', err);
    return [];
  }
}

function saveLocalCoupons(coupons: Coupon[]) {
  try {
    if (!fs.existsSync(LOCAL_COUPONS_DIR)) {
      fs.mkdirSync(LOCAL_COUPONS_DIR, { recursive: true });
    }
    fs.writeFileSync(LOCAL_COUPONS_FILE, JSON.stringify(coupons, null, 2), 'utf8');
  } catch (err) {
    console.error('Erro ao salvar coupons locais:', err);
  }
}

export const couponService = {
  async listCoupons(): Promise<Coupon[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('coupons')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data as Coupon[];
        }
      } catch {
        // Fallback para arquivo local se a tabela ainda não existir no Supabase
      }
    }
    return ensureLocalFile();
  },

  async createCoupon(params: {
    code?: string;
    days?: number;
    maxUses?: number;
  }): Promise<Coupon> {
    const code = (params.code || `TESTE-${Math.random().toString(36).substring(2, 6).toUpperCase()}`).trim().toUpperCase();
    const days = params.days || 2;
    const maxUses = params.maxUses ?? 1;

    const newCoupon: Coupon = {
      id: `cp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      code,
      type: 'TRIAL_DAYS',
      value: days,
      max_uses: maxUses,
      used_count: 0,
      used_by: [],
      active: true,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('coupons')
          .insert({
            id: newCoupon.id,
            code: newCoupon.code,
            type: newCoupon.type,
            value: newCoupon.value,
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
        // Fallback para local
      }
    }

    const local = ensureLocalFile();
    // Remove se já existir mesmo código
    const filtered = local.filter(c => c.code !== code);
    filtered.unshift(newCoupon);
    saveLocalCoupons(filtered);
    return newCoupon;
  },

  async deleteCoupon(idOrCode: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('coupons').delete().or(`id.eq.${idOrCode},code.eq.${idOrCode}`);
      } catch {
        // Fallback local
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
  }): Promise<{ success: boolean; days: number; message: string }> {
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

    // Verifica se este usuário específico já usou esse cupom
    const alreadyUsed = (coupon.used_by || []).some(u => u.user_id === params.userId);
    if (alreadyUsed) {
      throw new Error('Você já utilizou este cupom de teste nesta conta.');
    }

    const days = coupon.value || 2;
    const currentPeriodEnd = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

    // 1. Ativa a assinatura do usuário no Supabase
    if (isSupabaseConfigured()) {
      const { error: subError } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: params.userId,
          status: 'TRIAL',
          plan_type: 'MENSAL',
          payment_method: 'PIX',
          payment_id: `cupom-${coupon.code.toLowerCase()}-${Date.now()}`,
          amount: 0.00,
          current_period_end: currentPeriodEnd,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (subError) {
        console.error('Erro ao atualizar assinatura com cupom:', subError);
        throw new Error('Não foi possível ativar o acesso de teste no banco.');
      }
    }

    // 2. Atualiza o cupom (incrementa uso e vincula quem usou)
    const updatedUsedBy = [
      ...(coupon.used_by || []),
      { user_id: params.userId, email: params.email, used_at: new Date().toISOString() }
    ];
    const newUsedCount = coupon.used_count + 1;
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
      days,
      message: `Cupom ativado com sucesso! Você ganhou ${days} dias de acesso degustação.`
    };
  }
};
