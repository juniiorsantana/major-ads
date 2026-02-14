import React, { useState } from 'react';
import { Campaign } from '../../types';
import { X, DollarSign, Loader2, AlertCircle } from 'lucide-react';

interface BudgetEditModalProps {
    campaign: Campaign;
    onSave: (campaignId: string, budgetType: 'daily_budget' | 'lifetime_budget', amountCents: number) => Promise<void>;
    onClose: () => void;
}

const BudgetEditModal: React.FC<BudgetEditModalProps> = ({ campaign, onSave, onClose }) => {
    const currentDaily = campaign.daily_budget ? campaign.daily_budget / 100 : 0;
    const currentLifetime = campaign.lifetime_budget ? campaign.lifetime_budget / 100 : 0;

    const [budgetType, setBudgetType] = useState<'daily_budget' | 'lifetime_budget'>(
        campaign.lifetime_budget ? 'lifetime_budget' : 'daily_budget'
    );
    const [amount, setAmount] = useState<string>(
        budgetType === 'daily_budget'
            ? currentDaily > 0 ? currentDaily.toFixed(2) : ''
            : currentLifetime > 0 ? currentLifetime.toFixed(2) : ''
    );
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const parsedAmount = parseFloat(amount);
    const isValid = !isNaN(parsedAmount) && parsedAmount >= 1.0;

    const handleSave = async () => {
        if (!isValid) {
            setError('O valor mínimo é R$ 1,00');
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const amountCents = Math.round(parsedAmount * 100);
            await onSave(campaign.id, budgetType, amountCents);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Erro ao atualizar budget');
        } finally {
            setSaving(false);
        }
    };

    const handleBudgetTypeChange = (type: 'daily_budget' | 'lifetime_budget') => {
        setBudgetType(type);
        if (type === 'daily_budget') {
            setAmount(currentDaily > 0 ? currentDaily.toFixed(2) : '');
        } else {
            setAmount(currentLifetime > 0 ? currentLifetime.toFixed(2) : '');
        }
        setError(null);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className="bg-white rounded-xl max-w-md w-full shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <DollarSign size={20} className="text-blue-600" />
                        <h2 className="text-lg font-bold text-slate-900">Editar Budget</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        aria-label="Fechar"
                    >
                        <X size={18} className="text-slate-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-5">
                    {/* Campaign name */}
                    <div>
                        <p className="text-sm text-slate-500">Campanha</p>
                        <p className="font-medium text-slate-900 truncate">{campaign.name}</p>
                    </div>

                    {/* Budget type toggle */}
                    <div>
                        <label className="text-sm font-medium text-slate-700 block mb-2">Tipo de Budget</label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleBudgetTypeChange('daily_budget')}
                                className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${budgetType === 'daily_budget'
                                        ? 'bg-blue-50 border-blue-300 text-blue-700'
                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                Diário
                            </button>
                            <button
                                onClick={() => handleBudgetTypeChange('lifetime_budget')}
                                className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${budgetType === 'lifetime_budget'
                                        ? 'bg-blue-50 border-blue-300 text-blue-700'
                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                Vitalício
                            </button>
                        </div>
                    </div>

                    {/* Amount input */}
                    <div>
                        <label htmlFor="budget-amount" className="text-sm font-medium text-slate-700 block mb-2">
                            Valor ({budgetType === 'daily_budget' ? 'por dia' : 'total'})
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">R$</span>
                            <input
                                id="budget-amount"
                                type="number"
                                min="1"
                                step="0.01"
                                value={amount}
                                onChange={(e) => {
                                    setAmount(e.target.value);
                                    setError(null);
                                }}
                                placeholder="0.00"
                                className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-slate-900 font-medium focus:outline-none focus:ring-2 transition-colors ${error
                                        ? 'border-red-300 focus:ring-red-200'
                                        : 'border-slate-200 focus:ring-blue-200 focus:border-blue-400'
                                    }`}
                                autoFocus
                            />
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Mínimo: R$ 1,00 — Valor será convertido para centavos automaticamente</p>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-200 flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        disabled={saving}
                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || !isValid}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {saving ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            'Salvar Budget'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BudgetEditModal;
