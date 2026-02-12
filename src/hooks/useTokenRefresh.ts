/**
 * Token Refresh Hook
 * Monitora e renova automaticamente o token Facebook
 */

import { useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { useAppStore } from '../stores/useAppStore';
import { toast } from '../hooks/useToast';

const TOKEN_CHECK_INTERVAL = 5 * 60 * 1000;
const TOKEN_EXPIRY_THRESHOLD = 15 * 60 * 1000;
const TOKEN_WARNING_THRESHOLD = 60 * 60 * 1000; // Avisar quando falta 1h

interface TokenInfo {
    expiresAt: number;
    isLongLived: boolean;
}

export function useTokenRefresh() {
    const navigate = useNavigate();
    const { metaUser, setMetaUser } = useAppStore();
    const intervalRef = useRef<number | null>(null);

    const checkAndRefreshToken = useCallback(async () => {
        if (!metaUser) return;

        try {
            // Buscar info do token do user metadata
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const fbToken = user.user_metadata?.facebook_access_token;
            const tokenExpiry = user.user_metadata?.token_expires_at;

            if (!fbToken) {
                console.warn('No Facebook token found');
                return;
            }

            // Se não temos info de expiração, assumir que pode precisar refresh
            if (!tokenExpiry) {
                console.log('No token expiry info, attempting refresh...');
                await refreshToken(fbToken);
                return;
            }

            const expiresAt = new Date(tokenExpiry).getTime();
            const now = Date.now();
            const timeUntilExpiry = expiresAt - now;

            // Se token expirou
            if (timeUntilExpiry <= 0) {
                handleTokenExpired();
                return;
            }

            // Se token expira em breve, renovar
            if (timeUntilExpiry < TOKEN_EXPIRY_THRESHOLD) {
                console.log('[TokenRefresh] Token expiring soon, refreshing...');
                await refreshToken(fbToken);
            } else if (timeUntilExpiry < TOKEN_WARNING_THRESHOLD) {
                // Avisar o usuário que o token expira em breve
                const minutesLeft = Math.round(timeUntilExpiry / 60000);
                toast.warning(`Token do Facebook expira em ${minutesLeft} minutos. Será renovado automaticamente.`);
            }
        } catch (error) {
            console.error('Token refresh check failed:', error);
        }
    }, [metaUser]);

    const refreshToken = async (currentToken: string) => {
        try {
            const { data, error } = await supabase.functions.invoke('meta-auth', {
                body: {
                    action: 'refresh_token',
                    access_token: currentToken,
                },
            });

            if (error) {
                throw new Error(error.message);
            }

            if (data?.success) {
                console.log('[TokenRefresh] Token refreshed successfully');
                toast.success('Token do Facebook renovado com sucesso.');
                return true;
            }

            // Se refresh falhar, desconectar
            console.error('Token refresh failed:', data?.error);
            handleTokenExpired();
            return false;
        } catch (error) {
            console.error('Token refresh error:', error);
            handleTokenExpired();
            return false;
        }
    };

    const handleTokenExpired = useCallback(() => {
        console.log('[TokenRefresh] Token expired, disconnecting...');
        setMetaUser(null);
        localStorage.removeItem('meta_ads_connected_user');

        toast.error('Sessão Facebook expirada. Por favor, reconecte sua conta.');

        navigate('/settings', {
            state: { message: 'Sessão Facebook expirada. Por favor, reconecte.' }
        });
    }, [setMetaUser, navigate]);

    // Iniciar verificação periódica
    useEffect(() => {
        if (!metaUser) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            return;
        }

        // Verificar imediatamente
        checkAndRefreshToken();

        // Configurar intervalo
        intervalRef.current = window.setInterval(
            checkAndRefreshToken,
            TOKEN_CHECK_INTERVAL
        );

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [metaUser, checkAndRefreshToken]);

    return {
        checkAndRefreshToken,
        refreshToken,
    };
}

export default useTokenRefresh;
