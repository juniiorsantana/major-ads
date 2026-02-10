/**
 * Token Refresh Hook
 * Monitora e renova automaticamente o token Facebook
 */

import { useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { useAppStore } from '../stores/useAppStore';

const TOKEN_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutos
const TOKEN_EXPIRY_THRESHOLD = 15 * 60 * 1000; // Renovar se expira em 15 min

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

            // Se token expira em breve, renovar
            if (timeUntilExpiry < TOKEN_EXPIRY_THRESHOLD) {
                console.log('Token expiring soon, refreshing...');
                await refreshToken(fbToken);
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
                console.log('Token refreshed successfully');
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
        console.log('Token expired, disconnecting...');
        setMetaUser(null);
        localStorage.removeItem('meta_ads_connected_user');

        // Mostrar notificação ao usuário (seria bom ter um sistema de toast global)
        // Por agora, redirecionar para settings
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
