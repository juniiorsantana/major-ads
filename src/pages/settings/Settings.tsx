import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { metaService } from '../../services/metaService';
import { BusinessManager } from '../../types';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { Toast, ToastType } from '../../components/ui/Toast';
import { MultiSelectDropdown, MultiSelectOption } from '../../components/ui/MultiSelectDropdown';

const Settings: React.FC = () => {
    const { user } = useAuth();
    const [connecting, setConnecting] = useState(false);
    const [metaUser, setMetaUser] = useState<any>(null);
    const [businesses, setBusinesses] = useState<BusinessManager[]>([]);
    const [loadingBusinesses, setLoadingBusinesses] = useState(false);
    const [businessesError, setBusinessesError] = useState<string | null>(null);
    const [isDisconnectModalOpen, setIsDisconnectModalOpen] = useState(false);
    const [isDisconnecting, setIsDisconnecting] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: ToastType; isVisible: boolean }>({
        message: '',
        type: 'info',
        isVisible: false
    });

    const showToast = (message: string, type: ToastType) => {
        setToast(prev => ({ ...prev, isVisible: false })); // Reset animation
        setTimeout(() => {
            setToast({ message, type, isVisible: true });
        }, 100);
    };

    // Temporary selection (UI state)
    const [selectedBmIds, setSelectedBmIds] = useState<string[]>(() => {
        const stored = localStorage.getItem('marketing_pro_active_bm_ids');
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch {
                return [];
            }
        }
        // Fallback for legacy single selection
        const legacy = localStorage.getItem('marketing_pro_active_bm');
        if (legacy) return [legacy];
        return [];
    });

    // Saved selection (confirmed state)
    const [savedBmIds, setSavedBmIds] = useState<string[]>(() => {
        const stored = localStorage.getItem('marketing_pro_active_bm_ids');
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch {
                return [];
            }
        }
        const legacy = localStorage.getItem('marketing_pro_active_bm');
        if (legacy) return [legacy];
        return [];
    });

    // Check if there are unsaved changes
    const hasUnsavedChanges = React.useMemo(() => {
        return JSON.stringify(selectedBmIds.sort()) !== JSON.stringify(savedBmIds.sort());
    }, [selectedBmIds, savedBmIds]);

    React.useEffect(() => {
        const checkConnection = async () => {
            const connected = await metaService.getConnectedUser();
            if (connected) {
                setMetaUser(connected);
            }
        };
        checkConnection();
    }, []);

    React.useEffect(() => {
        const fetchBusinesses = async () => {
            // Guard: don't fetch if no user, or if we are in the middle of disconnecting
            if (metaUser && !isDisconnecting) {
                setLoadingBusinesses(true);
                setBusinessesError(null);
                try {
                    const data = await metaService.getBusinesses();
                    setBusinesses(data);

                    // Auto-select first if none selected
                    if (selectedBmIds.length === 0 && data.length > 0) {
                        const firstId = data[0].id;
                        setSelectedBmIds([firstId]);
                        localStorage.setItem('marketing_pro_active_bm_ids', JSON.stringify([firstId]));
                    }
                } catch (error: any) {
                    console.error("Falha ao buscar negócios", error);
                    setBusinessesError(error.message || "Falha ao carregar Business Managers");
                } finally {
                    setLoadingBusinesses(false);
                }
            }
        };
        fetchBusinesses();
    }, [metaUser, isDisconnecting]);


    const handleConnectFacebook = async () => {
        setConnecting(true);
        try {
            const result = await metaService.login();
            setMetaUser(result);
            showToast('Facebook conectado com sucesso!', 'success');

            // Dispatch storage event to notify other components (like Dashboard)
            window.dispatchEvent(new StorageEvent('storage', {
                key: 'meta_ads_connected_user',
                newValue: 'connected',
                url: window.location.href
            }));
        } catch (error) {
            console.error(error);
            showToast('Falha ao conectar Facebook. Tente novamente.', 'error');
        } finally {
            setConnecting(false);
        }
    };

    const handleDisconnectClick = () => {
        setIsDisconnectModalOpen(true);
    };

    const confirmDisconnect = async () => {
        setIsDisconnecting(true);
        // Clear state IMMEDIATELY to prevent downstream effects/re-renders from trying to fetch
        setMetaUser(null);
        setBusinesses([]);
        setBusinessesError(null);
        localStorage.removeItem('marketing_pro_active_bm');
        localStorage.removeItem('marketing_pro_active_bm_ids');

        try {
            await metaService.logout();
            setIsDisconnectModalOpen(false);
            showToast('Conta desconectada com sucesso.', 'info');
        } catch (error) {
            console.error("Erro ao desconectar:", error);
            showToast("Erro ao desconectar. Tente novamente.", 'error');
        } finally {
            setIsDisconnecting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <header>
                <h1 className="text-2xl font-bold text-slate-900">Configurações</h1>
                <p className="text-slate-500">Gerencie sua conta e integrações</p>
            </header>

            <div className="grid gap-8">
                {/* Profile Section */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        Perfil do Usuário
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-500 mb-1">E-mail</label>
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-slate-800 font-medium">
                                {user?.email}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-500 mb-1">ID do Usuário</label>
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-slate-500 font-mono text-xs">
                                {user?.id}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Integrations Section */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        Integrações
                    </h2>

                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">f</div>
                            <div>
                                <p className="font-bold text-slate-800">Facebook Ads</p>
                                <p className="text-sm text-slate-500">Conectar à API de Marketing</p>
                            </div>
                        </div>
                        {metaUser ? (
                            <div className="text-right flex items-center gap-4">
                                <div>
                                    <p className="text-sm font-bold text-emerald-600">Conectado</p>
                                    <p className="text-xs text-slate-400">{metaUser.name}</p>
                                </div>
                                <button
                                    onClick={handleDisconnectClick}
                                    className="text-xs text-red-500 hover:text-red-700 underline"
                                >
                                    Desconectar
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={handleConnectFacebook}
                                disabled={connecting}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                {connecting ? 'Conectando...' : 'Conectar'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Business Assets Section */}
                {metaUser && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                            Ativos do Negócio
                        </h2>

                        <MultiSelectDropdown
                            options={businesses.map((bm: BusinessManager): MultiSelectOption => ({
                                id: bm.id,
                                name: bm.name,
                                subtitle: bm.id,
                                meta: bm.vertical || 'NOT_SET'
                            }))}
                            selectedIds={selectedBmIds}
                            onChange={(newSelection) => {
                                // Only update temporary state, don't save yet
                                setSelectedBmIds(newSelection);
                            }}
                            label="Business Managers"
                            description="Selecione os Business Managers que deseja usar no painel."
                            placeholder="Clique para selecionar Business Managers..."
                            loading={loadingBusinesses}
                            error={businessesError}
                            emptyMessage="Nenhum Business Manager encontrado para esta conta."
                        />

                        {/* Save Button */}
                        {metaUser && businesses.length > 0 && (
                            <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-200">
                                <p className="text-sm text-slate-500">
                                    {hasUnsavedChanges
                                        ? `${selectedBmIds.length} Business Manager(s) selecionado(s) - não salvo`
                                        : `${savedBmIds.length} Business Manager(s) ativo(s)`
                                    }
                                </p>
                                <button
                                    onClick={() => {
                                        localStorage.setItem('marketing_pro_active_bm_ids', JSON.stringify(selectedBmIds));
                                        if (selectedBmIds.length > 0) {
                                            localStorage.setItem('marketing_pro_active_bm', selectedBmIds[0]);
                                        } else {
                                            localStorage.removeItem('marketing_pro_active_bm');
                                        }
                                        setSavedBmIds(selectedBmIds);
                                        showToast('Business Managers salvos com sucesso!', 'success');

                                        // Trigger storage event for cross-tab sync (manual dispatch for same tab)
                                        window.dispatchEvent(new StorageEvent('storage', {
                                            key: 'marketing_pro_active_bm_ids',
                                            newValue: JSON.stringify(selectedBmIds),
                                            url: window.location.href
                                        }));
                                    }}
                                    disabled={!hasUnsavedChanges || loadingBusinesses}
                                    className={`
                                        px-6 py-2.5 rounded-lg font-medium transition-all
                                        ${hasUnsavedChanges && !loadingBusinesses
                                            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md'
                                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                        }
                                    `}
                                >
                                    {hasUnsavedChanges ? 'Salvar Seleção' : 'Salvo'}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <ConfirmModal
                isOpen={isDisconnectModalOpen}
                onClose={() => setIsDisconnectModalOpen(false)}
                onConfirm={confirmDisconnect}
                title="Desconectar Facebook?"
                message="Ao desconectar, você perderá o acesso aos dados das suas campanhas neste painel. Você poderá reconectar a qualquer momento."
                confirmText="Desconectar"
                cancelText="Cancelar"
                isDestructive={true}
                loading={isDisconnecting}
            />

            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.isVisible}
                onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
            />
        </div >
    );
};

export default Settings;
