import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Sparkles, ArrowRight } from 'lucide-react';

interface WelcomeModalProps {
    userName: string;
    onClose: () => void;
}

const STORAGE_KEY = 'majorhub_welcome_modal_dismissed';

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ userName, onClose }) => {
    const navigate = useNavigate();
    const [dontShowAgain, setDontShowAgain] = useState(false);

    const handleClose = () => {
        if (dontShowAgain) {
            localStorage.setItem(STORAGE_KEY, 'true');
        }
        onClose();
    };

    const handleConnectNow = () => {
        if (dontShowAgain) {
            localStorage.setItem(STORAGE_KEY, 'true');
        }
        navigate('/settings');
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 z-50 animate-in fade-in duration-300"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md animate-in zoom-in-95 fade-in duration-300">
                <div className="bg-white shadow-2xl border border-slate-200 relative">

                    {/* Close Button */}
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 transition-colors"
                    >
                        <X size={24} />
                    </button>

                    {/* Content */}
                    <div className="p-8 text-center">
                        {/* Icon */}
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-700 mx-auto mb-6 flex items-center justify-center">
                            <Sparkles size={40} className="text-white" />
                        </div>

                        {/* Badge */}
                        <div className="inline-block px-4 py-1 bg-blue-50 text-blue-700 text-xs font-bold tracking-wider uppercase mb-4">
                            Bem-vindo
                        </div>

                        {/* Heading */}
                        <h2 className="text-3xl font-extrabold text-slate-900 mb-3">
                            Olá, {userName}!
                        </h2>

                        {/* Description */}
                        <p className="text-slate-600 leading-relaxed mb-6">
                            Seu perfil foi criado com sucesso! 🎉
                            <br />
                            <br />
                            Agora, conecte sua conta <strong>Meta Ads</strong> para começar a importar campanhas e visualizar insights poderosos em tempo real.
                        </p>

                        {/* CTA Button */}
                        <button
                            onClick={handleConnectNow}
                            className="group w-full flex items-center justify-center gap-3 px-6 py-4 bg-blue-600 text-white font-bold text-lg hover:bg-blue-700 transition-all mb-4"
                        >
                            <span>Conectar Meta Ads Agora</span>
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>

                        {/* Secondary Button */}
                        <button
                            onClick={handleClose}
                            className="text-slate-500 hover:text-slate-900 font-bold text-sm underline underline-offset-4 transition-colors"
                        >
                            Fazer isso depois
                        </button>

                        {/* Checkbox */}
                        <div className="mt-6 pt-6 border-t border-slate-200">
                            <label className="flex items-center justify-center gap-2 text-sm text-slate-500 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={dontShowAgain}
                                    onChange={(e) => setDontShowAgain(e.target.checked)}
                                    className="w-4 h-4 border-2 border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-600/20"
                                />
                                <span className="group-hover:text-slate-700 transition-colors">
                                    Não mostrar novamente
                                </span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

/**
 * Utility function to check if modal should be shown
 */
export const shouldShowWelcomeModal = (): boolean => {
    return localStorage.getItem(STORAGE_KEY) !== 'true';
};
