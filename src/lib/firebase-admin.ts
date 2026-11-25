import { verifySupabaseAccessToken, getServerSupabaseClient } from '../../server/db/supabase';

export const adminAuth = getServerSupabaseClient()
  ? {
      verifyIdToken: async (token: string) => {
        const user = await verifySupabaseAccessToken(token);
        if (!user) {
          throw new Error('Invalid Supabase access token');
        }
        return {
          uid: user.id,
          email: user.email,
          role: (user.user_metadata?.role as string) || 'Staff',
          ...user.user_metadata,
        };
      },
    }
  : null;
