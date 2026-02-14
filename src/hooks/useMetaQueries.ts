/**
 * Meta API Query Hooks
 * React Query hooks para todas as chamadas Meta API
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { metaService } from '../services/metaService';
import { BusinessManager, AdAccount, MetaPage, InstagramAccount, Campaign } from '../types';

// Query Keys
export const metaQueryKeys = {
    all: ['meta'] as const,
    businesses: () => [...metaQueryKeys.all, 'businesses'] as const,
    adAccounts: (businessId: string) => [...metaQueryKeys.all, 'adAccounts', businessId] as const,
    pages: (businessId: string) => [...metaQueryKeys.all, 'pages', businessId] as const,
    instagram: (pageId: string) => [...metaQueryKeys.all, 'instagram', pageId] as const,
    campaigns: (adAccountId: string) => [...metaQueryKeys.all, 'campaigns', adAccountId] as const,
    connectedUser: () => [...metaQueryKeys.all, 'connectedUser'] as const,
};

/**
 * Hook para verificar usuário Meta conectado
 */
export function useConnectedUser() {
    return useQuery({
        queryKey: metaQueryKeys.connectedUser(),
        queryFn: () => metaService.getConnectedUser(),
        staleTime: Infinity, // Não expira até logout
    });
}

/**
 * Hook para buscar Business Managers
 */
export function useBusinesses(enabled = true) {
    return useQuery<BusinessManager[]>({
        queryKey: metaQueryKeys.businesses(),
        queryFn: () => metaService.getBusinesses(),
        enabled,
        staleTime: 10 * 60 * 1000, // 10 min cache
    });
}

/**
 * Hook para buscar Ad Accounts de um BM
 */
export function useAdAccounts(businessId: string, enabled = true) {
    return useQuery<AdAccount[]>({
        queryKey: metaQueryKeys.adAccounts(businessId),
        queryFn: () => metaService.getAdAccounts(businessId),
        enabled: enabled && !!businessId,
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * Hook para buscar Pages de um BM
 */
export function usePages(businessId: string, enabled = true) {
    return useQuery<MetaPage[]>({
        queryKey: metaQueryKeys.pages(businessId),
        queryFn: () => metaService.getPages(businessId),
        enabled: enabled && !!businessId,
        staleTime: 10 * 60 * 1000,
    });
}

/**
 * Hook para buscar Instagram de uma Page
 */
export function useInstagramAccounts(pageId: string, enabled = true) {
    return useQuery<InstagramAccount[]>({
        queryKey: metaQueryKeys.instagram(pageId),
        queryFn: () => metaService.getInstagramAccounts(pageId),
        enabled: enabled && !!pageId,
        staleTime: 10 * 60 * 1000,
    });
}

/**
 * Hook para buscar Campaigns de uma Ad Account
 */
export function useCampaigns(adAccountId: string, enabled = true) {
    return useQuery<Campaign[]>({
        queryKey: metaQueryKeys.campaigns(adAccountId),
        queryFn: () => metaService.getCampaigns(adAccountId),
        enabled: enabled && !!adAccountId,
        staleTime: 2 * 60 * 1000, // 2 min - campanhas mudam mais
    });
}

/**
 * Hook para buscar campanhas de múltiplas Ad Accounts
 */
export function useCampaignsFromMultipleAccounts(adAccountIds: string[], enabled = true) {
    return useQuery<Campaign[]>({
        queryKey: ['meta', 'campaigns', 'batch', ...adAccountIds.sort()],
        queryFn: async () => {
            const results = await Promise.allSettled(
                adAccountIds.map((id) => metaService.getCampaigns(id))
            );

            return results
                .filter((r): r is PromiseFulfilledResult<Campaign[]> => r.status === 'fulfilled')
                .flatMap((r) => r.value);
        },
        enabled: enabled && adAccountIds.length > 0,
        staleTime: 2 * 60 * 1000,
    });
}

/**
 * Mutation: Login Facebook
 */
export function useMetaLogin() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => metaService.login(),
        onSuccess: (user) => {
            queryClient.setQueryData(metaQueryKeys.connectedUser(), {
                userId: user.userId,
                name: user.name,
                email: user.email,
            });
            queryClient.invalidateQueries({ queryKey: metaQueryKeys.businesses() });
        },
    });
}

/**
 * Mutation: Logout Meta
 */
export function useMetaLogout() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => metaService.logout(),
        onSuccess: () => {
            queryClient.setQueryData(metaQueryKeys.connectedUser(), null);
            queryClient.removeQueries({ queryKey: metaQueryKeys.all });
        },
    });
}

/**
 * Mutation: Criar Campanha
 */
export function useCreateCampaign() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            adAccountId,
            name,
            objective,
            status,
        }: {
            adAccountId: string;
            name: string;
            objective: string;
            status?: 'ACTIVE' | 'PAUSED';
        }) => metaService.createCampaign(adAccountId, name, objective, status),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: metaQueryKeys.campaigns(variables.adAccountId),
            });
        },
    });
}

/**
 * Mutation: Atualizar status da campanha
 */
export function useUpdateCampaignStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            campaignId,
            status,
        }: {
            campaignId: string;
            status: 'ACTIVE' | 'PAUSED';
        }) => metaService.updateCampaignStatus(campaignId, status),
        onSuccess: () => {
            // Invalida todas as campanhas pois não sabemos qual account
            queryClient.invalidateQueries({
                queryKey: metaQueryKeys.all,
                predicate: (query) => query.queryKey.includes('campaigns'),
            });
        },
    });
}

/**
 * Mutation: Atualizar budget da campanha
 */
export function useUpdateCampaignBudget() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            campaignId,
            budgetType,
            amountCents,
        }: {
            campaignId: string;
            budgetType: 'daily_budget' | 'lifetime_budget';
            amountCents: number;
        }) => metaService.updateCampaignBudget(campaignId, budgetType, amountCents),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: metaQueryKeys.all,
                predicate: (query) => query.queryKey.includes('campaigns'),
            });
        },
    });
}

/**
 * Mutation: Duplicar campanha
 */
export function useDuplicateCampaign() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            campaignId,
            adAccountId,
        }: {
            campaignId: string;
            adAccountId: string;
        }) => metaService.duplicateCampaign(campaignId, adAccountId),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: metaQueryKeys.all,
                predicate: (query) => query.queryKey.includes('campaigns'),
            });
        },
    });
}
