import { supabase, supabaseAdmin, getAuthenticatedUser } from '@/lib/supabase';
import { generateUuid } from '@/lib/utils/uuid';

export interface DbThirdPartyDebt {
  id: string;
  user_id: string;
  person_name: string;
  description: string;
  origin_type: 'CARD' | 'ACCOUNT' | 'ASSET_SALE';
  origin_bank_or_card?: string;
  total_amount: number;
  paid_amount: number;
  installments_total: number;
  current_installment: number;
  due_date?: string;
  status: 'PENDING' | 'PARTIAL' | 'PAID';
  notes?: string;
  created_at?: string;
}

const STORAGE_KEY = 'kaxxa_third_party_debts_backup';

function getLocalDebts(userId: string): DbThirdPartyDebt[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}_${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalDebts(userId: string, items: DbThirdPartyDebt[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(items));
  } catch (e) {
    console.error('Erro ao salvar débitos no localStorage:', e);
  }
}

export const thirdPartiesService = {
  getCachedDebts(): DbThirdPartyDebt[] {
    if (typeof window === 'undefined') return [];
    try {
      const rawUser = localStorage.getItem('kaxxa_user_cache');
      if (!rawUser) return [];
      const user = JSON.parse(rawUser);
      if (!user || !user.id) return [];
      return getLocalDebts(user.id);
    } catch {
      return [];
    }
  },

  async fetchDebts(): Promise<DbThirdPartyDebt[] | null> {
    const user = await getAuthenticatedUser();
    if (!user) return null;

    try {
      const client = supabaseAdmin || supabase;
      const { data, error } = await client
        .from('third_party_debts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data !== null) {
        let rawList = [...data];

        const formatted = rawList.map(d => ({
          ...d,
          total_amount: Number(d.total_amount || 0),
          paid_amount: Number(d.paid_amount || 0),
        })) as DbThirdPartyDebt[];

        // Sincroniza débitos criados localmente em offline/pendentes que ainda não subiram para o Supabase
        const localItems = getLocalDebts(user.id);
        const pendingLocal = localItems.filter(local => 
          local.id.startsWith('tp-') &&
          !formatted.some(remote => remote.id === local.id || (remote.person_name === local.person_name && remote.description === local.description))
        );

        const uninsertedPending: DbThirdPartyDebt[] = [];
        if (pendingLocal.length > 0) {
          for (const item of pendingLocal) {
            try {
              const { user_id, ...cleanItem } = item;
              const payloadToSync = {
                ...cleanItem,
                id: item.id || ('tp-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4)),
                user_id: user.id
              };
              const { data: inserted } = await client
                .from('third_party_debts')
                .insert(payloadToSync)
                .select()
                .single();
              if (inserted) {
                formatted.unshift({
                  ...inserted,
                  total_amount: Number(inserted.total_amount || 0),
                  paid_amount: Number(inserted.paid_amount || 0),
                } as DbThirdPartyDebt);
              } else {
                uninsertedPending.push(item);
              }
            } catch (e) {
              console.warn('Erro ao sincronizar débito de terceiro para o Supabase:', e);
              uninsertedPending.push(item);
            }
          }
        }

        const mergedAll = [...formatted, ...uninsertedPending];
        saveLocalDebts(user.id, mergedAll);
        return mergedAll;
      }
    } catch (err) {
      console.warn('Supabase indisponível para busca de débitos, usando backup local:', err);
    }

    const localData = getLocalDebts(user.id);
    return localData;
  },

  async createDebt(debt: Omit<DbThirdPartyDebt, 'id' | 'user_id' | 'created_at'>): Promise<DbThirdPartyDebt | null> {
    const user = await getAuthenticatedUser();
    if (!user) return null;

    const newItem: DbThirdPartyDebt = {
      ...debt,
      id: 'tp-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      user_id: user.id,
      created_at: new Date().toISOString(),
    };

    const payload = {
      ...debt,
      id: newItem.id,
      user_id: user.id,
    };

    let insertedData = null;

    try {
      const { data, error } = await supabase
        .from('third_party_debts')
        .insert(payload)
        .select()
        .single();

      if (!error && data) {
        insertedData = data;
      } else if (supabaseAdmin) {
        const { data: adminData } = await supabaseAdmin
          .from('third_party_debts')
          .insert(payload)
          .select()
          .single();

        if (adminData) insertedData = adminData;
      }
    } catch (err) {
      console.warn('Erro ao inserir débito no Supabase, salvando localmente:', err);
    }

    if (insertedData) {
      const saved = {
        ...insertedData,
        total_amount: Number(insertedData.total_amount || 0),
        paid_amount: Number(insertedData.paid_amount || 0),
      } as DbThirdPartyDebt;

      const currentLocal = getLocalDebts(user.id);
      saveLocalDebts(user.id, [saved, ...currentLocal.filter(d => d.id !== saved.id)]);
      return saved;
    }

    const currentLocal = getLocalDebts(user.id);
    const updated = [newItem, ...currentLocal.filter(d => d.id !== newItem.id)];
    saveLocalDebts(user.id, updated);
    return newItem;
  },

  async updateDebt(id: string, updates: Partial<DbThirdPartyDebt>): Promise<boolean> {
    const user = await getAuthenticatedUser();
    if (!user) return false;

    const currentLocal = getLocalDebts(user.id);
    const updatedLocal = currentLocal.map(item => item.id === id ? { ...item, ...updates } : item);
    saveLocalDebts(user.id, updatedLocal);

    try {
      const client = supabaseAdmin || supabase;
      const { error } = await client
        .from('third_party_debts')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

      return !error;
    } catch {
      return true;
    }
  },

  async deleteDebt(id: string): Promise<boolean> {
    const user = await getAuthenticatedUser();
    if (!user) return false;

    const currentLocal = getLocalDebts(user.id);
    const updatedLocal = currentLocal.filter(item => item.id !== id);
    saveLocalDebts(user.id, updatedLocal);

    try {
      const client = supabaseAdmin || supabase;
      const { error } = await client
        .from('third_party_debts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      return !error;
    } catch {
      return true;
    }
  },

  getCachedPeople(): { id: string; name: string }[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem('kaxxa_third_parties_backup');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  async fetchPeople(): Promise<{ id: string; name: string }[]> {
    const user = await getAuthenticatedUser();
    if (!user) return this.getCachedPeople();

    // 1. Tenta Supabase direto
    try {
      const client = supabaseAdmin || supabase;
      const { data, error } = await client
        .from('third_parties')
        .select('id, name')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      if (!error && data && data.length > 0) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('kaxxa_third_parties_backup', JSON.stringify(data));
        }
        return data as { id: string; name: string }[];
      }
    } catch (err) {
      console.warn('Supabase direto falhou para terceiros, tentando /api/db:', err);
    }

    // 2. Fallback via /api/db do mesmo domínio (à prova de adblock / falhas cliente)
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'select', table: 'third_parties', filters: { user_id: user.id } }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json?.data && Array.isArray(json.data) && json.data.length > 0) {
            const cleanList = json.data.map((p: any) => ({ id: p.id, name: p.name }));
            localStorage.setItem('kaxxa_third_parties_backup', JSON.stringify(cleanList));
            return cleanList;
          }
        }
      } catch (proxyErr) {
        console.warn('Fallback /api/db para terceiros falhou:', proxyErr);
      }
    }

    return this.getCachedPeople();
  },

  async createPerson(name: string): Promise<{ id: string; name: string } | null> {
    const user = await getAuthenticatedUser();
    if (!user) return null;

    const newId = generateUuid();
    const payload = { id: newId, user_id: user.id, name: name.trim() };
    let savedPerson: { id: string; name: string } | null = null;

    try {
      const client = supabaseAdmin || supabase;
      const { data, error } = await client
        .from('third_parties')
        .insert(payload)
        .select('id, name')
        .single();

      if (!error && data) {
        savedPerson = data as { id: string; name: string };
      }
    } catch (err) {
      console.warn('Supabase direto falhou ao criar terceiro:', err);
    }

    if (!savedPerson && typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'insert', table: 'third_parties', payload }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json?.data) {
            savedPerson = { id: json.data.id, name: json.data.name };
          }
        }
      } catch (proxyErr) {
        console.warn('Fallback /api/db ao criar terceiro falhou:', proxyErr);
      }
    }

    const finalPerson = savedPerson || { id: newId, name: payload.name };
    if (typeof window !== 'undefined') {
      const current = this.getCachedPeople();
      const updated = [...current.filter(p => p.id !== finalPerson.id && p.name !== finalPerson.name), finalPerson];
      localStorage.setItem('kaxxa_third_parties_backup', JSON.stringify(updated));
    }
    return finalPerson;
  },

  async deletePerson(id: string): Promise<boolean> {
    const user = await getAuthenticatedUser();
    if (!user) return false;

    if (typeof window !== 'undefined') {
      const current = this.getCachedPeople();
      localStorage.setItem('kaxxa_third_parties_backup', JSON.stringify(current.filter(p => p.id !== id)));
    }

    try {
      if (typeof window !== 'undefined') {
        await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete', table: 'third_parties', id }),
        });
      }
      const client = supabaseAdmin || supabase;
      await client
        .from('third_parties')
        .delete()
        .eq('id', id);
    } catch {}

    return true;
  }
};
