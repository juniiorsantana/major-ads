/**
 * User Profile Service
 * Manages user profile data collected during onboarding
 */

import { supabase } from './supabaseClient';

export interface UserProfile {
    id: string;
    full_name: string;
    company_name: string;
    role: string;
    business_type: string;
    goals: string[];
    created_at?: string;
    updated_at?: string;
}

export type UserProfileInput = Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>;

class UserProfileService {
    /**
     * Save user profile after onboarding
     */
    async saveProfile(profile: UserProfileInput): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            throw new Error('User must be authenticated to save profile');
        }

        const { error } = await supabase
            .from('user_profiles')
            .insert({
                id: user.id,
                ...profile,
            });

        if (error) {
            console.error('Failed to save user profile:', error);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);
            console.error('Error details:', error.details);
            throw new Error(`Não foi possível salvar seu perfil. Erro: ${error.message || 'Desconhecido'}`);
        }
    }

    /**
     * Get current user's profile
     */
    async getProfile(): Promise<UserProfile | null> {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return null;
        }

        const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // No profile found, this is OK
                return null;
            }
            console.error('Failed to fetch user profile:', error);
            return null;
        }

        return data as UserProfile;
    }

    /**
     * Update user profile
     */
    async updateProfile(updates: Partial<UserProfileInput>): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            throw new Error('User must be authenticated to update profile');
        }

        const { error } = await supabase
            .from('user_profiles')
            .update(updates)
            .eq('id', user.id);

        if (error) {
            console.error('Failed to update user profile:', error);
            throw new Error('Não foi possível atualizar seu perfil. Tente novamente.');
        }
    }

    /**
     * Check if user has completed their profile
     */
    async hasProfile(): Promise<boolean> {
        const profile = await this.getProfile();
        return profile !== null;
    }
}

export const userProfileService = new UserProfileService();
