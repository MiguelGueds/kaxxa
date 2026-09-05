import { supabase, getAuthenticatedUser, isSupabaseConfigured } from '@/lib/supabase';
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

// Armazenamento em memória e disco para resiliência (caso a tabela do Supabase ainda não tenha sido criada)
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

export function saveSubscriptionLocal(sub: DbSubscription) {
  MEMORY_SUBSCRIPTIONS[sub.user_id] = sub;

  // No navegador, persiste também no localStorage
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('kaxxa_trial_active', JSON.stringify({
        id: sub.id,
        userId: sub.user_id,
        endsAt: sub.current_period_end,
        createdAt: sub.created_at
      }));
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
   * Retorna a assinatura ativa do usuário, com fallback resiliente.
   */
  async getSubscription(): Promise<DbSubscription | null> {
    // 1. Verificação no localStorage (no navegador) para resposta instantânea
    if (typeof window !== 'undefined') {
      try {
        const localTrial = localStorage.getItem('kaxxa_trial_active');
        if (localTrial) {
          const parsed = JSON.parse(localTrial);
          const endsAt = parsed.endsAt || parsed.subscription?.current_period_end;
          if (endsAt) {
            const isExpired = new Date(endsAt).getTime() < Date.now();
            if (!isExpired) {
              return {
                id: parsed.id || parsed.subscription?.id || 'trial-local',
                user_id: parsed.userId || parsed.subscription?.user_id || 'trial-user',
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

    const user = await getAuthenticatedUser();
    if (!user) return null;

    // Se for administrador (somoskaxxa@gmail.com), acesso vitalício de desenvolvedor
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

    // 2. Consulta ao Supabase
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!error && data) {
          saveSubscriptionLocal(data as DbSubscription);
          return data as DbSubscription;
        }
      } catch (err) {
        console.warn('Supabase subscriptions indisponível, usando fallback local:', err);
      }
    }

    // 3. Fallback local em memória / arquivo
    const localMap = loadLocalSubscriptions();
    return localMap[user.id] || null;
  },

  /**
   * Verifica se o usuário possui acesso liberado ao sistema.
   */
  async isAccessGranted(): Promise<{ granted: boolean; subscription: DbSubscription | null }> {
    // 1. Verificação PRIORITÁRIA no navegador para trials recém-ativados (não depende de rede/banco)
    if (typeof window !== 'undefined') {
      try {
        const localTrial = localStorage.getItem('kaxxa_trial_active');
        if (localTrial) {
          const parsed = JSON.parse(localTrial);
          const endsAt = parsed.endsAt || parsed.subscription?.current_period_end;
          if (endsAt) {
            const isExpired = new Date(endsAt).getTime() < Date.now();
            if (!isExpired) {
              const trialSub: DbSubscription = {
                id: parsed.id || parsed.subscription?.id || 'trial-local',
                user_id: parsed.userId || parsed.subscription?.user_id || 'trial-user',
                status: 'TRIAL',
                plan_type: 'MENSAL',
                payment_method: 'PIX',
                amount: 0,
                current_period_end: endsAt,
                created_at: parsed.createdAt || new Date().toISOString()
              };
              return { granted: true, subscription: trialSub };
            }
          }
        }
      } catch (e) {
        console.warn('Erro ao ler kaxxa_trial_active do localStorage:', e);
      }
    }

    const user = await getAuthenticatedUser();
    if (!user) {
      return { granted: false, subscription: null };
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
      return { granted: true, subscription: adminSub };
    }

    const sub = await this.getSubscription();
    if (!sub) {
      return { granted: false, subscription: null };
    }

    if (sub.status === 'ACTIVE') {
      if (sub.current_period_end) {
        const isExpired = new Date(sub.current_period_end).getTime() < Date.now();
        return { granted: !isExpired, subscription: sub };
      }
      return { granted: true, subscription: sub };
    }

    if (sub.status === 'TRIAL') {
      if (sub.current_period_end) {
        const isExpired = new Date(sub.current_period_end).getTime() < Date.now();
        return { granted: !isExpired, subscription: sub };
      }
      return { granted: true, subscription: sub };
    }

    return { granted: false, subscription: sub };
  },

  /**
   * Ativa ou renova a assinatura de um usuário com persistência dupla.
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

    // Sempre salva localmente primeiro (resiliência garantida)
    saveSubscriptionLocal(subData);

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('subscriptions')
          .upsert({
            user_id: params.userId,
            status: status,
            plan_type: planType,
            payment_method: params.paymentMethod,
            payment_id: params.paymentId,
            amount: amount,
            current_period_end: periodEnd,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' })
          .select()
          .single();

        if (!error && data) {
          saveSubscriptionLocal(data as DbSubscription);
          return data as DbSubscription;
        }
      } catch (err) {
        console.warn('Supabase subscriptions indisponível para upsert, usando local:', err);
      }
    }

    return subData;
  }
};
