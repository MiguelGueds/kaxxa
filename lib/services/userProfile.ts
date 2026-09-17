import { supabase } from '@/lib/supabase';
import { generateUuid } from '@/lib/utils/uuid';

const UNIFIED_USER_IDS = ['b0a91108-2b2f-4e43-86a8-260969705b7f', 'b141c1ba-97c9-4b20-a662-aedeb4b38acd'];
const PROFILE_KEY_PREFIX = 'kaxxa_user_profile_';
const PROFILE_ROW_NAME = '__KAXXA_USER_PROFILE__';

export interface UserProfileData {
  avatar?: string | null;
  name?: string;
  phone?: string;
}

export const userProfileService = {
  getLocalProfile(userId?: string): UserProfileData | null {
    if (typeof window === 'undefined') return null;
    try {
      if (userId) {
        const raw = localStorage.getItem(`${PROFILE_KEY_PREFIX}${userId}`);
        if (raw) return JSON.parse(raw);
      }
      const genericRaw = localStorage.getItem('kaxxa_user_profile');
      if (genericRaw) return JSON.parse(genericRaw);

      // Fallback para chaves antigas de avatar se existirem
      const oldAvatar = userId ? localStorage.getItem(`kaxxa_user_avatar_${userId}`) : localStorage.getItem('kaxxa_user_avatar');
      if (oldAvatar && oldAvatar !== 'none') {
        return { avatar: oldAvatar };
      }
      return null;
    } catch {
      return null;
    }
  },

  async getProfile(userId: string): Promise<UserProfileData | null> {
    const local = this.getLocalProfile(userId);

    const cacheProfile = (profile: UserProfileData) => {
      if (typeof window === 'undefined') return;
      localStorage.setItem(`${PROFILE_KEY_PREFIX}${userId}`, JSON.stringify(profile));
      if (profile.avatar) {
        localStorage.setItem(`kaxxa_user_avatar_${userId}`, profile.avatar);
        localStorage.setItem('kaxxa_user_avatar', profile.avatar);
      }
    };

    try {
      const remoteQuery = await supabase
        .from('third_parties')
        .select('contact_info, user_id')
        .eq('name', PROFILE_ROW_NAME)
        .eq('user_id', userId)
        .limit(1);
      let remoteRow = remoteQuery.data?.[0];

      if (!remoteRow && typeof window !== 'undefined') {
        const response = await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'select', table: 'third_parties', filters: { user_id: userId } })
        });
        const result = await response.json().catch(() => ({}));
        remoteRow = Array.isArray(result.data)
          ? result.data.find((item: any) => item.name === PROFILE_ROW_NAME && item.contact_info)
          : undefined;
      }

      if (remoteRow?.contact_info) {
        const remoteProfile = JSON.parse(remoteRow.contact_info) as UserProfileData;
        cacheProfile(remoteProfile);
        return remoteProfile;
      }

      const { data: authData } = await supabase.auth.getUser();
      const metadata = authData?.user?.user_metadata;
      if (metadata?.avatar_url || metadata?.full_name || metadata?.phone) {
        const profileFromMetadata: UserProfileData = {
          avatar: metadata.avatar_url ?? local?.avatar ?? null,
          name: metadata.full_name ?? local?.name,
          phone: metadata.phone ?? local?.phone
        };
        cacheProfile(profileFromMetadata);
        return profileFromMetadata;
      }
    } catch (e) {
      console.warn('Erro ao carregar perfil remoto do Supabase:', e);
    }

    return local;
  },

  async saveProfile(userId: string, data: UserProfileData): Promise<void> {
    // 1. Armazena imediatamente em localStorage em múltiplas chaves para disponibilidade instantânea
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`${PROFILE_KEY_PREFIX}${userId}`, JSON.stringify(data));
        localStorage.setItem('kaxxa_user_profile', JSON.stringify(data));
        if (data.avatar) {
          localStorage.setItem(`kaxxa_user_avatar_${userId}`, data.avatar);
          localStorage.setItem('kaxxa_user_avatar', data.avatar);
        } else if (data.avatar === null) {
          localStorage.setItem(`kaxxa_user_avatar_${userId}`, 'none');
          localStorage.setItem('kaxxa_user_avatar', 'none');
        }
        window.dispatchEvent(new CustomEvent('kaxxa_avatar_updated', { detail: data.avatar || null }));
      } catch (e) {
        console.warn('Erro ao gravar localStorage:', e);
      }
    }

    // 2. Atualiza os metadados do Supabase Auth (sincronização global automática)
    try {
      const updatePayload: Record<string, any> = {};
      if (data.avatar !== undefined) updatePayload.avatar_url = data.avatar;
      if (data.name !== undefined) updatePayload.full_name = data.name;
      if (data.phone !== undefined) updatePayload.phone = data.phone;

      if (Object.keys(updatePayload).length > 0) {
        await supabase.auth.updateUser({ data: updatePayload });
      }
    } catch (e) {
      console.warn('Erro ao atualizar metadata do Supabase Auth:', e);
    }

    // 3. Persistência canônica no banco Supabase (tabela third_parties)
    try {
      const rowPayload = {
        user_id: userId,
        name: PROFILE_ROW_NAME,
        contact_info: JSON.stringify(data)
      };
      const { data: existing, error: lookupError } = await supabase
        .from('third_parties')
        .select('id')
        .eq('name', PROFILE_ROW_NAME)
        .eq('user_id', userId)
        .maybeSingle();
      if (lookupError) throw lookupError;

      const result = existing?.id
        ? await supabase.from('third_parties').update(rowPayload).eq('id', existing.id).select().single()
        : await supabase.from('third_parties').insert({ id: generateUuid(), ...rowPayload }).select().single();
      if (result.error) throw result.error;
    } catch (directError) {
      try {
        const selectResponse = await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'select', table: 'third_parties', filters: { user_id: userId } })
        });
        const selectResult = await selectResponse.json().catch(() => ({}));
        const existingRow = Array.isArray(selectResult.data)
          ? selectResult.data.find((item: any) => item.name === PROFILE_ROW_NAME)
          : null;
        const response = await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(existingRow?.id
            ? {
                action: 'update',
                table: 'third_parties',
                id: existingRow.id,
                payload: { user_id: userId, name: PROFILE_ROW_NAME, contact_info: JSON.stringify(data) }
              }
            : {
                action: 'insert',
                table: 'third_parties',
                payload: { id: generateUuid(), user_id: userId, name: PROFILE_ROW_NAME, contact_info: JSON.stringify(data) }
              })
        });
        if (!response.ok) throw new Error('Falha no fallback de perfil');
      } catch (fallbackError) {
        console.warn('Erro ao salvar perfil na nuvem Supabase:', directError, fallbackError);
        throw fallbackError;
      }
    }
  }
};
