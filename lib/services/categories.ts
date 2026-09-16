import { supabase, getAuthenticatedUser } from '@/lib/supabase';

export interface DbCategory {
  id: string;
  user_id: string;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  parent_id?: string | null;
  color?: string;
  icon?: string;
  created_at?: string;
}

export const categoriesService = {
  async fetchCategories(): Promise<DbCategory[] | null> {
    const user = await getAuthenticatedUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .order('name', { ascending: true });

    if (!error && data && data.length > 0) return data as DbCategory[];

    if (typeof window !== 'undefined') {
      try {
        const response = await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'select',
            table: 'categories',
            filters: { user_id: user.id }
          })
        });
        const result = await response.json().catch(() => ({}));
        if (response.ok && Array.isArray(result.data)) {
          return result.data as DbCategory[];
        }
      } catch (fallbackError) {
        console.error('Erro ao buscar categorias pelo fallback:', fallbackError);
      }
    }

    if (error) console.error('Erro ao buscar categorias:', error);
    return data as DbCategory[] | null;
  },

  async createCategory(cat: {
    name: string;
    type: 'INCOME' | 'EXPENSE';
    parent_id?: string | null;
    color?: string;
    icon?: string;
  }): Promise<DbCategory | null> {
    const user = await getAuthenticatedUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('categories')
      .insert({
        ...cat,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao cadastrar categoria:', error);
      throw error;
    }

    return data as DbCategory;
  },

  async deleteCategory(id: string): Promise<boolean> {
    const user = await getAuthenticatedUser();
    if (!user) return false;

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    return !error;
  }
};

