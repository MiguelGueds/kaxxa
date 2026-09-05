import { supabase, getAuthenticatedUser, isSupabaseConfigured } from '@/lib/supabase';

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

export const subscriptionService = {
  /**
   * Retorna a assinatura ativa do usuário, ou null se não houver.
   */
  async getSubscription(): Promise<DbSubscription | null> {
    const user = await getAuthenticatedUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Erro ao verificar assinatura:', error);
      return null;
    }

    return data as DbSubscription | null;
  },

  /**
   * Verifica se o usuário possui acesso liberado ao sistema.
   * Em ambiente sem Supabase configurado (demo local), libera acesso.
   * Se logado com Supabase, exige status === 'ACTIVE' ou 'TRIAL' com data válida.
   */
  async isAccessGranted(): Promise<{ granted: boolean; subscription: DbSubscription | null }> {
    if (!isSupabaseConfigured()) {
      return { granted: true, subscription: null };
    }

    const user = await getAuthenticatedUser();
    if (!user) {
      return { granted: false, subscription: null };
    }

    const sub = await this.getSubscription();
    if (!sub) {
      return { granted: false, subscription: null };
    }

    if (sub.status === 'ACTIVE') {
      // Se tiver data de expiração, valida se ainda não passou
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
   * Ativa ou renova a assinatura de um usuário.
   */
  async activateSubscription(params: {
    userId: string;
    planType?: 'MENSAL' | 'ANUAL';
    paymentMethod: 'PIX' | 'CREDIT_CARD';
    paymentId: string;
    amount?: number;
    durationDays?: number;
  }): Promise<DbSubscription | null> {
    const planType = params.planType || 'MENSAL';
    const amount = params.amount ?? 39.90;
    const days = params.durationDays || (planType === 'ANUAL' ? 365 : 30);
    const periodEnd = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: params.userId,
        status: 'ACTIVE',
        plan_type: planType,
        payment_method: params.paymentMethod,
        payment_id: params.paymentId,
        amount: amount,
        current_period_end: periodEnd,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      console.error('Erro ao ativar assinatura:', error);
      throw error;
    }

    return data as DbSubscription;
  }
};

