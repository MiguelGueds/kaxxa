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
    const raw = localStorage.getItem(`${STORAGE_KEY}_${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalAccounts(userId: string, items: DbAccount[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(items));
  } catch (e) {
    console.error('Erro ao salvar contas no localStorage:', e);
  }
}

export const accountsService = {
  getCachedAccounts(): DbAccount[] {
    if (typeof window === 'undefined') return [];
    try {
      const rawUser = localStorage.getItem('kaxxa_user_cache');
      if (!rawUser) return [];
      const user = JSON.parse(rawUser);
      if (!user || !user.id) return [];
      return getLocalAccounts(user.id);
    } catch {
      return [];
    }
  },

  async fetchAccounts(): Promise<DbAccount[] | null> {
    const user = await getAuthenticatedUser();
    if (!user) return null;

    try {
      const client = supabaseAdmin || supabase;
      const { data, error } = await client
        .from('accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      if (!error && data !== null) {
        let rawList = [...data];

        // Tenta buscar e migrar contas com o ID legado de e-mail (ex: usr_somoskaxxa_gmail_com)
        if (user.email) {
          const legacyId = 'usr_' + user.email.toLowerCase().replace(/[^a-z0-9]/g, '_');
          if (legacyId !== user.id) {
            const { data: legacyAccounts } = await client
              .from('accounts')
              .select('*')
              .eq('user_id', legacyId);

            if (legacyAccounts && legacyAccounts.length > 0) {
              await client
                .from('accounts')
                .update({ user_id: user.id })
                .eq('user_id', legacyId);

              legacyAccounts.forEach(acc => {
                if (!rawList.some(r => r.id === acc.id)) {
                  rawList.push({ ...acc, user_id: user.id });
                }
              });
            }
          }
        }

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
                color: cleanItem.color || '#1A44C8'
              };
              const { data: inserted, error: insertErr } = await client
                .from('accounts')
                .insert(payloadToSync)
                .select()
                .single();
              if (inserted && !insertErr) {
                formatted.unshift({
                  ...inserted,
                  balance: Number(inserted.balance ?? inserted.initial_balance ?? 0),
                  initial_balance: Number(inserted.initial_balance ?? 0),
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
      console.warn('Erro ao buscar contas do Supabase, usando backup local:', err);
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
      color: acc.color,
    };

    try {
      let insertedData = null;

      const { data, error } = await supabase
        .from('accounts')
        .insert(payload)
        .select()
        .single();

      if (!error && data) {
        insertedData = data;
      } else {
        if (supabaseAdmin) {
          const { data: adminData, error: adminErr } = await supabaseAdmin
            .from('accounts')
            .insert(payload)
            .select()
            .single();

          if (!adminErr && adminData) {
            insertedData = adminData;
          }
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

    const client = supabaseAdmin || supabase;
    const { error } = await client
      .from('accounts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    return !error;
  }
};
