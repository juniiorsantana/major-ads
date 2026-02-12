
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { userProfileService } from './userProfileService';
import { supabase } from './supabaseClient';

// Mock Supabase client
vi.mock('./supabaseClient', () => ({
    supabase: {
        auth: {
            getUser: vi.fn()
        },
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn(),
            insert: vi.fn(),
            update: vi.fn().mockReturnThis()
        }))
    }
}));

describe('UserProfileService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('hasProfile', () => {
        it('should return true when profile exists', async () => {
            // Mock successful authentication
            // @ts-ignore
            supabase.auth.getUser.mockResolvedValue({
                data: { user: { id: 'test-user-id' } },
                error: null
            });

            // Mock profile found
            const mockSingle = vi.fn().mockResolvedValue({
                data: { id: 'test-user-id', full_name: 'Test User' },
                error: null
            });

            // @ts-ignore
            supabase.from.mockReturnValue({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: mockSingle
            });

            const result = await userProfileService.hasProfile();
            expect(result).toBe(true);
        });

        it('should return false when profile does not exist', async () => {
            // Mock successful authentication
            // @ts-ignore
            supabase.auth.getUser.mockResolvedValue({
                data: { user: { id: 'test-user-id' } },
                error: null
            });

            // Mock profile not found (PGRST116)
            const mockSingle = vi.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116', message: 'Not found' }
            });

            // @ts-ignore
            supabase.from.mockReturnValue({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: mockSingle
            });

            const result = await userProfileService.hasProfile();
            expect(result).toBe(false);
        });
    });
});
