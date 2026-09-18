import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export interface RefundRequest {
  id: string;
  user_id: string;
  user_email: string;
  amount: number;
  payment_method: 'PIX' | 'CREDIT_CARD';
  reason?: string;
  pix_key?: string;
  status: 'PENDING' | 'REFUNDED';
  created_at: string;
  updated_at?: string;
}

let memoryRefunds: RefundRequest[] = [];

function loadLocalRefunds(): RefundRequest[] {
  return memoryRefunds;
}

function saveLocalRefunds(list: RefundRequest[]) {
  memoryRefunds = list;
}

export const refundService = {
  async createRefund(data: {
    user_id: string;
    user_email: string;
    amount?: number;
    payment_method?: 'PIX' | 'CREDIT_CARD';
    reason?: string;
    pix_key?: string;
  }): Promise<RefundRequest> {
    const newReq: RefundRequest = {
      id: `ref_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      user_id: data.user_id,
      user_email: data.user_email || 'cliente@kaxxa.com',
      amount: data.amount ?? 39.90,
      payment_method: data.payment_method || 'PIX',
      reason: data.reason || 'Sem motivo especificado',
      pix_key: data.pix_key || '',
      status: 'PENDING',
      created_at: new Date().toISOString()
    };

    // Tenta salvar no Supabase se houver tabela
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('refund_requests').insert(newReq);
      } catch (err) {
        // Silencioso se a tabela ainda não existir
      }
    }

    const current = loadLocalRefunds();
    const updated = [newReq, ...current];
    saveLocalRefunds(updated);

    return newReq;
  },

  async listRefunds(): Promise<RefundRequest[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('refund_requests')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          saveLocalRefunds(data);
          return data;
        }
      } catch {}
    }
    return loadLocalRefunds();
  },

  async markAsRefunded(id: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('refund_requests')
          .update({ status: 'REFUNDED', updated_at: new Date().toISOString() })
          .eq('id', id);
      } catch {}
    }

    const current = loadLocalRefunds();
    const idx = current.findIndex(r => r.id === id);
    if (idx !== -1) {
      current[idx].status = 'REFUNDED';
      current[idx].updated_at = new Date().toISOString();
      saveLocalRefunds([...current]);
      return true;
    }
    return false;
  }
};

