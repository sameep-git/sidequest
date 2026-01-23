import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { userService } from './services';
import { supabase } from './supabase';
import type { User } from './types';

export const authService = {
  async signInWithEmail(email: string, password: string): Promise<User> {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('No user returned from Supabase auth');

    // Fetch user profile
    const user = await userService.getById(authData.user.id);
    if (!user) throw new Error('User profile not found');

    return user;
  },

  async signUpWithEmail(email: string, password: string, displayName?: string): Promise<User> {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
      },
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('No user returned from Supabase auth');

    // Ensure we have an authenticated session (Supabase may require email confirmations)
    if (!authData.session) {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
    }

    // Wait a moment for the trigger to create the user profile
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Fetch the user profile (created by trigger)
    let user = await userService.getById(authData.user.id);

    // As a fallback, create the profile manually (RLS allows auth.uid() = id)
    if (!user) {
      user = await userService.upsert({
        id: authData.user.id,
        email: authData.user.email || null,
        display_name: displayName || authData.user.user_metadata?.display_name || null,
        avatar_url: null,
        venmo_handle: null,
      });
    }

    return user;
  },

  async signInWithApple(): Promise<User> {
    try {
      const nonce = Math.random().toString(36).substring(2, 10);
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        nonce
      );

      const appleCredential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      const { data: authData, error: authError } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: appleCredential.identityToken!,
        nonce,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('No user returned from Supabase auth');

      // Upsert user profile
      const displayName = appleCredential.fullName
        ? `${appleCredential.fullName.givenName || ''} ${appleCredential.fullName.familyName || ''}`.trim()
        : null;

      const user = await userService.upsert({
        id: authData.user.id,
        email: appleCredential.email || authData.user.email || null,
        display_name: displayName || authData.user.user_metadata?.full_name || null,
        avatar_url: null,
        venmo_handle: null,
      });

      return user;
    } catch (error: any) {
      if (error.code === 'ERR_REQUEST_CANCELED') {
        throw new Error('Apple Sign In was canceled');
      }
      throw error;
    }
  },

  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentUser(): Promise<User | null> {
    const { data } = await supabase.auth.getSession();
    if (!data.session?.user) return null;

    return userService.getById(data.session.user.id);
  },

  onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const user = await userService.getById(session.user.id);
        callback(user);
      } else {
        callback(null);
      }
    });
  },
};
