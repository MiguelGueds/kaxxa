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

    try {
      const targetUserIds = UNIFIED_USER_IDS.includes(userId) ? UNIFIED_USER_IDS : [userId];
      const { data, error } = await supabase
        .from('third_parties')
        .select('contact_info, user_id')
        .eq('name', PROFILE_ROW_NAME)
        .in('user_id', targetUserIds)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (!error && data && data.length > 0 && data[0].contact_info) {
        try {
          const remoteProfile: UserProfileData = JSON.parse(data[0].contact_info);
          if (remoteProfile) {
            if (typeof window !== 'undefined') {
              localStorage.setItem(`${PROFILE_KEY_PREFIX}${userId}`, JSON.stringify(remoteProfile));
              if (remoteProfile.avatar) {
                localStorage.setItem(`kaxxa_user_avatar_${userId}`, remoteProfile.avatar);
                localStorage.setItem('kaxxa_user_avatar', remoteProfile.avatar);
              }
            }
            return remoteProfile;
          }
        } catch {}
      } else if (local?.avatar) {
        // Se existe avatar salvo localmente no dispositivo atual mas ainda não está na nuvem, sobe agora!
        this.saveProfile(userId, local).catch(() => {});
      }
    } catch (e) {
      console.warn('Erro ao carregar perfil remoto do Supabase:', e);
    }

    return local;
  },

  async saveProfile(userId: string, data: UserProfileData): Promise<void> {
    if (typeof window !== 'undefined') {
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
    }

    try {
      const targetUserIds = UNIFIED_USER_IDS.includes(userId) ? UNIFIED_USER_IDS : [userId];

      for (const uid of targetUserIds) {
        const { data: existing } = await supabase
          .from('third_parties')
          .select('id')
          .eq('name', PROFILE_ROW_NAME)
          .eq('user_id', uid)
          .maybeSingle();

        const rowPayload = {
          user_id: uid,
          name: PROFILE_ROW_NAME,
          contact_info: JSON.stringify(data)
        };

        if (existing?.id) {
          await supabase
            .from('third_parties')
            .update(rowPayload)
            .eq('id', existing.id);
        } else {
          await supabase
            .from('third_parties')
            .insert({
              id: generateUuid(),
              ...rowPayload
            });
        }
      }
    } catch (e) {
      console.warn('Erro ao salvar perfil na nuvem Supabase:', e);
    }
  }
};
