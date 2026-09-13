import { supabase, supabaseAdmin, getAuthenticatedUser } from '@/lib/supabase';
import { generateUuid, isValidUuid } from '@/lib/utils/uuid';

export interface DbAccount {
  id: string;
  user_id: string;
  name: string;
  type: string;
  balance: number;
  initial_balance: number;
  color?: string;
  created_at?: string;
}

const STORAGE_KEY = 'kaxxa_accounts_backup';

function getLocalAccounts(userId: string): DbAccount[] {
  if (typeof window === 'undefined') return [];
  try {
    const itemsMap = new Map<string, DbAccount>();
    const candidateKeys = [
      `${STORAGE_KEY}_${userId}`,
      STORAGE_KEY,
    ];

    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith('kaxxa_accounts') || k.includes('accounts_backup') || k.includes('contas'))) {
        if (!candidateKeys.includes(k)) candidateKeys.push(k);
      }
    }

    for (const key of candidateKeys) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const list = JSON.parse(raw);
          if (Array.isArray(list)) {
            for (const item of list) {
              if (item && item.name) {
                const dedupeKey = (item.name || '').trim().toLowerCase();
                // Purga qualquer conta de teste deletada
                if (dedupeKey.includes('conta teste') || dedupeKey === 'teste') continue;
                if (!itemsMap.has(dedupeKey)) {
                  itemsMap.set(dedupeKey, item);
                }
              }
            }
          }
        }
      } catch {}
    }

    return Array.from(itemsMap.values());
  } catch {
    return [];
  }
}

function saveLocalAccounts(userId: string, items: DbAccount[]) {
  if (typeof window === 'undefined') return;
  try {
    const cleanItems = items.filter(i => {
      const n = (i.name || '').toLowerCase();
      return !n.includes('conta teste') && n !== 'teste';
    });
    localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(cleanItems));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanItems));
    localStorage.removeItem('mindfinance_accounts_backup');
    localStorage.removeItem('kaxxa_accounts');
    localStorage.removeItem(`${STORAGE_KEY}_usr_miguelguedes110_gmail_com`);
  } catch (e) {
    console.error('Erro ao salvar contas no localStorage:', e);
  }
}

export const accountsService = {
  getCachedAccounts(): DbAccount[] {
    if (typeof window === 'undefined') return [];
    try {
      const rawUser = localStorage.getItem('kaxxa_user_cache');
      const userId = rawUser ? JSON.parse(rawUser)?.id || 'default' : 'default';
      return getLocalAccounts(userId);
    } catch {
      return [];
    }
  },

  async fetchAccounts(): Promise<DbAccount[] | null> {
    const user = await getAuthenticatedUser();
    if (!user) return null;

    try {
      const client = supabaseAdmin || supabase;
      const targetUserIds = Array.from(new Set([user.id, 'b0a91108-2b2f-4e43-86a8-260969705b7f', 'b141c1ba-97c9-4b20-a662-aedeb4b38acd'].filter(Boolean)));
      const { data, error } = await client
        .from('accounts')
        .select('*')
        .in('user_id', targetUserIds)
        .order('name', { ascending: true });

      if (!error && data !== null) {
        let rawList = [...data];

        const formatted = rawList.map(acc => ({
          ...acc,
          balance: Number(acc.balance ?? acc.initial_balance ?? 0),
          initial_balance: Number(acc.initial_balance ?? 0),
        })) as DbAccount[];

        // Sincroniza contas criadas localmente pendentes que ainda não subiram para o Supabase
        const localItems = getLocalAccounts(user.id);
        const pendingLocal = localItems.filter(local =>
          (!isValidUuid(local.id) || local.id.startsWith('acc-')) &&
          !formatted.some(remote => remote.name.toLowerCase() === local.name.toLowerCase())
        );

        const uninsertedPending: DbAccount[] = [];
        if (pendingLocal.length > 0) {
          for (const item of pendingLocal) {
            try {
              const { user_id, ...cleanItem } = item;
              const newUuid = isValidUuid(item.id) ? item.id : generateUuid();
              const payloadToSync = {
                id: newUuid,
                user_id: user.id,
                name: cleanItem.name,
                type: cleanItem.type,
                initial_balance: Number(cleanItem.initial_balance ?? cleanItem.balance ?? 0),
              };
              const { data: inserted, error: insertErr } = await client
                .from('accounts')
                .insert(payloadToSync)
                .select()
                .single();
              if (inserted && !insertErr) {
                formatted.unshift({
                  ...inserted,
                  balance: Number(inserted.initial_balance ?? 0),
                  initial_balance: Number(inserted.initial_balance ?? 0),
                  color: cleanItem.color || '#1A44C8',
                } as DbAccount);
              } else {
                uninsertedPending.push(item);
              }
            } catch (e) {
              console.warn('Erro ao sincronizar conta pendente para o Supabase:', e);
              uninsertedPending.push(item);
            }
          }
        }

        const mergedAll = [...formatted, ...uninsertedPending];
        saveLocalAccounts(user.id, mergedAll);
        return mergedAll;
      }
    } catch (err) {
      console.warn('Erro ao buscar contas do Supabase, tentando proxy /api/db:', err);
    }

    // Fallback via /api/db do mesmo domínio (à prova de adblock / falhas cliente)
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'select', table: 'accounts', filters: { user_id: user.id } }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json?.data && Array.isArray(json.data)) {
            const formatted = json.data.map((acc: any) => ({
              ...acc,
              balance: Number(acc.balance ?? acc.initial_balance ?? 0),
              initial_balance: Number(acc.initial_balance ?? 0),
            })) as DbAccount[];
            saveLocalAccounts(user.id, formatted);
            return formatted;
          }
        }
      } catch (proxyErr) {
        console.warn('Fallback /api/db para accounts falhou:', proxyErr);
      }
    }

    return getLocalAccounts(user.id);
  },

  async createAccount(acc: { name: string; type: string; balance: number; color?: string }): Promise<DbAccount | null> {
    const user = await getAuthenticatedUser();
    if (!user) return null;

    const generatedId = generateUuid();
    const newItem: DbAccount = {
      id: generatedId,
      user_id: user.id,
      name: acc.name,
      type: acc.type,
      balance: acc.balance,
      initial_balance: acc.balance,
      color: acc.color,
      created_at: new Date().toISOString(),
    };

    const payload = {
      id: generatedId,
      user_id: user.id,
      name: acc.name,
      type: acc.type,
      initial_balance: acc.balance,
    };

    try {
      let insertedData = null;

      try {
        const { data, error } = await supabase
          .from('accounts')
          .insert(payload)
          .select()
          .single();

        if (!error && data) {
          insertedData = data;
        } else if (supabaseAdmin) {
          const { data: adminData, error: adminErr } = await supabaseAdmin
            .from('accounts')
            .insert(payload)
            .select()
            .single();

          if (!adminErr && adminData) {
            insertedData = adminData;
          }
        }
      } catch (err) {
        console.warn('Supabase direto falhou para contas, tentando rota do servidor:', err);
      }

      if (!insertedData && typeof window !== 'undefined') {
        try {
          const res = await fetch('/api/db', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'insert', table: 'accounts', payload }),
          });
          if (res.ok) {
            const resJson = await res.json();
            if (resJson.data) insertedData = resJson.data;
          }
        } catch (proxyErr) {
          console.warn('Erro no proxy de contas:', proxyErr);
        }
      }

      if (insertedData) {
        const saved = {
          ...insertedData,
          balance: Number(insertedData.balance ?? insertedData.initial_balance ?? 0),
          initial_balance: Number(insertedData.initial_balance ?? 0),
        } as DbAccount;

        const currentLocal = getLocalAccounts(user.id);
        saveLocalAccounts(user.id, [saved, ...currentLocal.filter(a => a.id !== saved.id)]);
        return saved;
      }
    } catch (err) {
      console.warn('Exceção ao cadastrar conta no Supabase, salvando localmente:', err);
    }

    const currentLocal = getLocalAccounts(user.id);
    const updated = [newItem, ...currentLocal.filter(a => a.id !== newItem.id)];
    saveLocalAccounts(user.id, updated);
    return newItem;
  },

  async updateBalance(id: string, deltaAmount: number): Promise<boolean> {
    const user = await getAuthenticatedUser();
    if (!user) return false;

    const client = supabaseAdmin || supabase;
    const { data: acc } = await client
      .from('accounts')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!acc) return false;

    const currentBal = Number(acc.balance ?? acc.initial_balance ?? 0);
    const newBalance = currentBal + deltaAmount;

    const { error } = await client
      .from('accounts')
      .update({ initial_balance: newBalance })
      .eq('id', id)
      .eq('user_id', user.id);

    return !error;
  },

  async deleteAccount(id: string): Promise<boolean> {
    const user = await getAuthenticatedUser();
    if (!user) return false;

    const currentLocal = getLocalAccounts(user.id);
    saveLocalAccounts(user.id, currentLocal.filter(a => a.id !== id));

    let deleted = false;
    try {
      const client = supabaseAdmin || supabase;
      const { error } = await client
        .from('accounts')
        .delete()
        .eq('id', id);
      if (!error) deleted = true;
    } catch {}

    if (!deleted && typeof window !== 'undefined') {
      try {
        await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete', table: 'accounts', id }),
        });
      } catch {}
    }

    return true;
  },

  async updateAccount(id: string, updates: { name?: string; type?: string; balance?: number; color?: string }): Promise<boolean> {
    const user = await getAuthenticatedUser();
    if (!user) return false;

    const currentLocal = getLocalAccounts(user.id);
    const updated = currentLocal.map(a => a.id === id ? { 
      ...a, 
      ...updates, 
      balance: updates.balance !== undefined ? updates.balance : a.balance, 
      initial_balance: updates.balance !== undefined ? updates.balance : a.initial_balance 
    } : a);
    saveLocalAccounts(user.id, updated);

    const payload: any = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.type !== undefined) payload.type = updates.type;
    if (updates.balance !== undefined) {
      payload.balance = updates.balance;
      payload.initial_balance = updates.balance;
    }
    if (updates.color !== undefined) payload.color = updates.color;

    let updatedDb = false;
    try {
      const client = supabaseAdmin || supabase;
      const { error } = await client
        .from('accounts')
        .update(payload)
        .eq('id', id);
      if (!error) updatedDb = true;
    } catch {}

    if (!updatedDb && typeof window !== 'undefined') {
      try {
        await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'update', table: 'accounts', id, payload }),
        });
      } catch {}
    }

    return true;
  }
};
