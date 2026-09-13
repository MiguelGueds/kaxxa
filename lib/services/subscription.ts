import { supabase, supabaseAdmin, getAuthenticatedUser, isSupabaseConfigured } from '@/lib/supabase';
import { isAdminEmail } from '@/lib/admin';

export interface DbSubscription {
  id: string;
  user_id: string;
  status: 'ACTIVE' | 'TRIAL' | 'PAST_DUE' | 'CANCELED' | 'INACTIVE';
  plan_type: 'MENSAL' | 'ANUAL';
  payment_method?: 'PIX' | 'CREDIT_CARD';
  payment_id?: string;
  amount?: number;
  current_period_end?: string;
  created_at?: string;
  updated_at?: string;
}

export function parseExpirationTime(dateStr?: string): number {
  if (!dateStr) return 0;
  const str = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return new Date(`${str}T23:59:59.999Z`).getTime();
  }
  const timestamp = new Date(str).getTime();
  return isNaN(timestamp) ? 0 : timestamp;
}

export function getTrialRemainingText(endDateStr?: string): { text: string; hoursRemaining: number; isExpiringSoon: boolean } {
  if (!endDateStr) return { text: '0h restantes', hoursRemaining: 0, isExpiringSoon: true };
  const end = parseExpirationTime(endDateStr);
  const now = Date.now();
  const diffMs = end - now;

  if (diffMs <= 0) return { text: 'Expirado', hoursRemaining: 0, isExpiringSoon: true };

  const hours = Math.ceil(diffMs / (1000 * 60 * 60));
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (hours <= 48) {
    return {
      text: `${hours}h restante${hours === 1 ? '' : 's'}`,
      hoursRemaining: hours,
      isExpiringSoon: true
    };
  }

  return {
    text: `${days} dias restantes`,
    hoursRemaining: hours,
    isExpiringSoon: false
  };
}

let MEMORY_SUBSCRIPTIONS: Record<string, DbSubscription> = {};

function getFs() {
  if (typeof window === 'undefined') {
    try {
      return eval('require')('fs');
    } catch {
      return null;
    }
  }
  return null;
}

function getPath() {
  if (typeof window === 'undefined') {
    try {
      return eval('require')('path');
    } catch {
      return null;
    }
  }
  return null;
}

function getSubscriptionPaths() {
  const pathMod = getPath();
  if (!pathMod) return null;
  const primaryDir = pathMod.join(process.cwd(), 'data');
  const primaryFile = pathMod.join(primaryDir, 'subscriptions.json');
  const tmpDir = '/tmp/kaxxa_data';
  const tmpFile = pathMod.join(tmpDir, 'subscriptions.json');
  return { primaryDir, primaryFile, tmpDir, tmpFile };
}

function loadLocalSubscriptions(): Record<string, DbSubscription> {
  if (Object.keys(MEMORY_SUBSCRIPTIONS).length > 0) {
    return MEMORY_SUBSCRIPTIONS;
  }

  const fsMod = getFs();
  const paths = getSubscriptionPaths();
  if (fsMod && paths) {
    const { primaryFile, tmpFile } = paths;
    for (const filePath of [tmpFile, primaryFile]) {
      try {
        if (fsMod.existsSync(filePath)) {
          const content = fsMod.readFileSync(filePath, 'utf8');
          MEMORY_SUBSCRIPTIONS = JSON.parse(content);
          return MEMORY_SUBSCRIPTIONS;
        }
      } catch {}
    }
  }
  return MEMORY_SUBSCRIPTIONS;
}

export function clearMemorySubscriptions() {
  MEMORY_SUBSCRIPTIONS = {};
}

export function saveSubscriptionLocal(sub: DbSubscription) {
  MEMORY_SUBSCRIPTIONS[sub.user_id] = sub;

  if (typeof window !== 'undefined') {
    try {
      if (sub.status === 'TRIAL' || sub.status === 'ACTIVE') {
        const isExpired = parseExpirationTime(sub.current_period_end) < Date.now();
        if (!isExpired) {
          localStorage.setItem('kaxxa_trial_active', JSON.stringify({
            id: sub.id,
            userId: sub.user_id,
            endsAt: sub.current_period_end,
            createdAt: sub.created_at
          }));
        } else {
          localStorage.removeItem('kaxxa_trial_active');
        }
      }
    } catch {}
  }

  const fsMod = getFs();
  const paths = getSubscriptionPaths();
  if (fsMod && paths) {
    const { primaryDir, primaryFile, tmpDir, tmpFile } = paths;
    try {
      if (!fsMod.existsSync(primaryDir)) fsMod.mkdirSync(primaryDir, { recursive: true });
      fsMod.writeFileSync(primaryFile, JSON.stringify(MEMORY_SUBSCRIPTIONS, null, 2), 'utf8');
    } catch {}

    try {
      if (!fsMod.existsSync(tmpDir)) fsMod.mkdirSync(tmpDir, { recursive: true });
      fsMod.writeFileSync(tmpFile, JSON.stringify(MEMORY_SUBSCRIPTIONS, null, 2), 'utf8');
    } catch {}
  }
}

export const subscriptionService = {
  /**
   * Retorna a assinatura ativa ou mais recente do usuário com o Supabase como fonte primária.
   */
  async getSubscription(): Promise<DbSubscription | null> {
    const user = await getAuthenticatedUser();
    if (!user) return null;

    // Administradores Master têm acesso irrestrito garantido
    if (isAdminEmail(user.email)) {
      return {
        id: 'admin-master',
        user_id: user.id,
        status: 'ACTIVE',
        plan_type: 'ANUAL',
        payment_method: 'CREDIT_CARD',
        amount: 0,
        current_period_end: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
      };
    }

    // 1. Fonte Primária de Verdade: Tabela subscriptions no Supabase
    if (isSupabaseConfigured()) {
      try {
        const client = supabaseAdmin || supabase;
        const { data, error } = await client
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!error && data) {
          saveSubscriptionLocal(data as DbSubscription);
          return data as DbSubscription;
        }

        // Tenta buscar por ID legado de e-mail (ex: usr_somoskaxxa_gmail_com) se o usuário tiver e-mail
        if (user.email) {
          const legacyId = 'usr_' + user.email.toLowerCase().replace(/[^a-z0-9]/g, '_');
          const { data: legacyData } = await client
            .from('subscriptions')
            .select('*')
            .eq('user_id', legacyId)
            .order('updated_at', { ascending: false, nullsFirst: false })
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (legacyData) {
            // Migra o registro para o user.id oficial do Supabase Auth
            await client
              .from('subscriptions')
              .update({ user_id: user.id, updated_at: new Date().toISOString() })
              .eq('id', legacyData.id);

            const migratedSub = { ...legacyData, user_id: user.id } as DbSubscription;
            saveSubscriptionLocal(migratedSub);
            return migratedSub;
          }
        }
      } catch (err) {
        console.warn('Supabase subscriptions indisponível, tentando auto-heal por cupom:', err);
      }

      // 2. AUTO-HEAL: Se não encontrou linha em subscriptions, verifica se o e-mail ou user_id usou um cupom no Supabase
      try {
        const client = supabaseAdmin || supabase;
        const { data: coupons } = await client.from('coupons').select('*');
        if (coupons && coupons.length > 0) {
          for (const c of coupons) {
            const usedList = Array.isArray(c.used_by) ? c.used_by : [];
            const usage = usedList.find((u: any) =>
              (u.user_id && (u.user_id === user.id || u.user_id.includes(user.id) || user.id.includes(u.user_id))) ||
              (u.email && user.email && u.email.toLowerCase() === user.email.toLowerCase())
            );

            if (usage) {
              const usedAt = usage.used_at ? parseExpirationTime(usage.used_at) : Date.now();
              const days = c.type === 'TRIAL_DAYS' ? (c.value ?? 1) : 30;
              const periodEnd = new Date((usedAt > 0 ? usedAt : Date.now()) + days * 24 * 60 * 60 * 1000).toISOString();
              const isExpired = parseExpirationTime(periodEnd) <= Date.now();

              if (!isExpired) {
                const healedSub = await this.activateSubscription({
                  userId: user.id,
                  status: 'TRIAL',
                  planType: 'MENSAL',
                  paymentMethod: 'PIX',
                  paymentId: `auto-heal-${c.code.toLowerCase()}`,
                  amount: 0,
                  durationDays: days,
                });
                return healedSub;
              } else {
                return {
                  id: `expired-coupon-${c.code.toLowerCase()}`,
                  user_id: user.id,
                  status: 'TRIAL',
                  plan_type: 'MENSAL',
                  payment_method: 'PIX',
                  amount: 0,
                  current_period_end: periodEnd,
                  created_at: new Date(usedAt).toISOString()
                };
              }
            }
          }
        }
      } catch (e) {
        console.warn('Erro na auto-recuperação de assinatura:', e);
      }
    }

    // 3. Fallback apenas se offline / Supabase indisponível
    if (typeof window !== 'undefined') {
      try {
        const localTrial = localStorage.getItem('kaxxa_trial_active');
        if (localTrial) {
          const parsed = JSON.parse(localTrial);
          const endsAt = parsed.endsAt || parsed.subscription?.current_period_end;
          if (endsAt && (parsed.userId === user.id || !parsed.userId)) {
            const isExpired = parseExpirationTime(endsAt) < Date.now();
            if (!isExpired) {
              return {
                id: parsed.id || 'trial-local',
                user_id: user.id,
                status: 'TRIAL',
                plan_type: 'MENSAL',
                payment_method: 'PIX',
                amount: 0,
                current_period_end: endsAt,
                created_at: parsed.createdAt || new Date().toISOString()
              };
            }
          }
        }
      } catch {}
    }

    const localMap = loadLocalSubscriptions();
    return localMap[user.id] || null;
  },

  /**
   * Verifica se o usuário possui acesso liberado ao sistema.
   */
  async isAccessGranted(): Promise<{ 
    granted: boolean; 
    subscription: DbSubscription | null; 
    expiredReason?: 'TRIAL_EXPIRED' | 'SUBSCRIPTION_EXPIRED' | null 
  }> {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { granted: false, subscription: null, expiredReason: null };
    }

    // Administradores Master têm acesso irrestrito garantido
    if (isAdminEmail(user.email)) {
      const adminSub: DbSubscription = {
        id: 'admin-master',
        user_id: user.id,
        status: 'ACTIVE',
        plan_type: 'ANUAL',
        payment_method: 'CREDIT_CARD',
        amount: 0,
        current_period_end: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
      };
      return { granted: true, subscription: adminSub, expiredReason: null };
    }

    let sub = await this.getSubscription();

    // Se o usuário está autenticado no Supabase e a assinatura não existe ou expirou, concede 30 dias de teste automaticamente
    if (!sub || (sub.current_period_end && parseExpirationTime(sub.current_period_end) < Date.now())) {
      try {
        sub = await this.activateSubscription({
          userId: user.id,
          status: 'TRIAL',
          planType: 'MENSAL',
          paymentMethod: 'PIX',
          paymentId: `trial-auto-${user.id.substring(0, 8)}`,
          amount: 0,
          durationDays: 30,
        });
      } catch (e) {
        console.warn('Erro ao renovar degustação de 30 dias no Supabase:', e);
      }
    }

    if (sub && (sub.status === 'ACTIVE' || sub.status === 'TRIAL')) {
      if (sub.current_period_end) {
        const isExpired = parseExpirationTime(sub.current_period_end) < Date.now();
        if (isExpired) {
          const reason = sub.status === 'TRIAL' || (sub.amount === 0) ? 'TRIAL_EXPIRED' : 'SUBSCRIPTION_EXPIRED';
          return { granted: false, subscription: sub, expiredReason: reason };
        }
        return { granted: true, subscription: sub, expiredReason: null };
      }
      return { granted: true, subscription: sub, expiredReason: null };
    }

    const reason = sub && ((sub.status as string) === 'TRIAL' || (sub.amount === 0)) ? 'TRIAL_EXPIRED' : 'SUBSCRIPTION_EXPIRED';
    return { granted: false, subscription: sub, expiredReason: reason };
  },

  /**
   * Ativa ou renova a assinatura de um usuário no Supabase e localmente.
   */
  async activateSubscription(params: {
    userId: string;
    planType?: 'MENSAL' | 'ANUAL';
    paymentMethod: 'PIX' | 'CREDIT_CARD';
    paymentId: string;
    amount?: number;
    durationDays?: number;
    status?: 'ACTIVE' | 'TRIAL';
  }): Promise<DbSubscription> {
    const planType = params.planType || 'MENSAL';
    const amount = params.amount ?? 39.90;
    const days = params.durationDays || (planType === 'ANUAL' ? 365 : 30);
    const periodEnd = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    const status = params.status || 'ACTIVE';

    const subData: DbSubscription = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      user_id: params.userId,
      status: status,
      plan_type: planType,
      payment_method: params.paymentMethod,
      payment_id: params.paymentId,
      amount: amount,
      current_period_end: periodEnd,
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    saveSubscriptionLocal(subData);

    if (isSupabaseConfigured()) {
      try {
        const client = supabaseAdmin || supabase;

        const { data: existing } = await client
          .from('subscriptions')
          .select('id')
          .eq('user_id', params.userId)
          .maybeSingle();

        if (existing?.id) {
          const { data: updated, error: updateErr } = await client
            .from('subscriptions')
            .update({
              status: status,
              plan_type: planType,
              payment_method: params.paymentMethod,
              payment_id: params.paymentId,
              amount: amount,
              current_period_end: periodEnd,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id)
            .select()
            .single();

          if (!updateErr && updated) {
            saveSubscriptionLocal(updated as DbSubscription);
            return updated as DbSubscription;
          }
        }

        const { data: inserted, error: insertErr } = await client
          .from('subscriptions')
          .insert({
            id: subData.id,
            user_id: params.userId,
            status: status,
            plan_type: planType,
            payment_method: params.paymentMethod,
            payment_id: params.paymentId,
            amount: amount,
            current_period_end: periodEnd,
            updated_at: new Date().toISOString(),
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (!insertErr && inserted) {
          saveSubscriptionLocal(inserted as DbSubscription);
          return inserted as DbSubscription;
        }
      } catch (err) {
        console.warn('Erro ao salvar assinatura no Supabase:', err);
      }
    }

    return subData;
  }
};
