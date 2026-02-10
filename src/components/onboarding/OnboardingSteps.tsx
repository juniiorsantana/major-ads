import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { userProfileService, UserProfileInput } from '../../services/userProfileService';
import {
    ArrowRight,
    CheckCircle2,
    Building2,
    Briefcase,
    Target,
    Loader2,
    User
} from 'lucide-react';

interface OnboardingStepsProps {
    onComplete: () => void;
}

const BUSINESS_TYPES = [
    'E-commerce',
    'Agência de Marketing',
    'Infoprodutos',
    'SaaS',
    'Serviços Profissionais',
    'Educação',
    'Saúde & Bem-estar',
    'Imobiliário',
    'Outro'
];

const GOAL_OPTIONS = [
    { value: 'increase_roi', label: 'Aumentar ROI de campanhas' },
    { value: 'reduce_cost', label: 'Reduzir custo por conversão' },
    { value: 'automate_reports', label: 'Automatizar relatórios' },
    { value: 'monitor_competition', label: 'Monitorar concorrentes' },
    { value: 'scale_investment', label: 'Escalar investimento com segurança' },
    { value: 'improve_targeting', label: 'Melhorar segmentação de público' },
    { value: 'optimize_creative', label: 'Otimizar criativos' },
    { value: 'other', label: 'Outro' }
];

export const OnboardingSteps: React.FC<OnboardingStepsProps> = ({ onComplete }) => {
    const navigate = useNavigate();
    const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState<UserProfileInput>({
        full_name: '',
        company_name: '',
        role: '',
        business_type: '',
        goals: [],
    });

    const updateField = (field: keyof UserProfileInput, value: string | string[]) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError(null);
    };

    const toggleGoal = (goalValue: string) => {
        const currentGoals = formData.goals;
        const newGoals = currentGoals.includes(goalValue)
            ? currentGoals.filter(g => g !== goalValue)
            : [...currentGoals, goalValue];
        updateField('goals', newGoals);
    };

    const validateStep = (): boolean => {
        switch (step) {
            case 1:
                if (!formData.full_name.trim()) {
                    setError('Por favor, informe seu nome completo');
                    return false;
                }
                if (!formData.company_name.trim()) {
                    setError('Por favor, informe o nome da empresa');
                    return false;
                }
                return true;
            case 2:
                if (!formData.role.trim()) {
                    setError('Por favor, informe seu cargo/função');
                    return false;
                }
                if (!formData.business_type) {
                    setError('Por favor, selecione o tipo de negócio');
                    return false;
                }
                return true;
            case 3:
                if (formData.goals.length === 0) {
                    setError('Selecione pelo menos um objetivo');
                    return false;
                }
                return true;
            default:
                return true;
        }
    };

    const handleNext = () => {
        if (!validateStep()) return;

        if (step < 3) {
            setStep((prev) => (prev + 1) as 1 | 2 | 3 | 4);
        } else {
            handleFinish();
        }
    };

    const handleFinish = async () => {
        setLoading(true);
        setError(null);

        try {
            // Save profile to Supabase
            await userProfileService.saveProfile(formData);

            // Mark onboarding as completed
            const { error: updateError } = await supabase.auth.updateUser({
                data: { onboarding_completed: true }
            });

            if (updateError) {
                console.error('Failed to update onboarding status:', updateError);
            }

            // Show success step
            setStep(4);

            // Navigate after a brief delay
            setTimeout(() => {
                onComplete();
                navigate('/dashboard');
            }, 2000);

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erro ao salvar perfil';
            console.error('Onboarding error:', errorMessage);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const StepIndicator = () => (
        <div className="flex gap-2 mb-8">
            {[1, 2, 3].map((s) => (
                <div
                    key={s}
                    className={`h-1 flex-1 transition-all duration-500 ${s <= step ? 'bg-slate-900' : 'bg-slate-200'
                        }`}
                />
            ))}
        </div>
    );

    return (
        <div className="flex min-h-[600px] bg-white border border-slate-200 shadow-2xl overflow-hidden max-w-4xl w-full mx-auto relative">

            {/* Left Panel: Content */}
            <div className="w-full md:w-[60%] p-8 md:p-12 flex flex-col relative z-10 bg-white">
                <StepIndicator />

                <div className="flex-1 flex flex-col justify-center">

                    {/* STEP 1: PERSONAL INFO */}
                    {step === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <div>
                                <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
                                    Bem-vindo ao Major<span className="text-blue-600">Hub</span>
                                </h1>
                                <p className="text-lg text-slate-600 leading-relaxed font-light">
                                    Vamos começar conhecendo você
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                        Nome Completo *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.full_name}
                                        onChange={(e) => updateField('full_name', e.target.value)}
                                        placeholder="João Silva"
                                        className="w-full px-4 py-3 border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                        Nome da Empresa *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.company_name}
                                        onChange={(e) => updateField('company_name', e.target.value)}
                                        placeholder="Sua Empresa Ltda"
                                        className="w-full px-4 py-3 border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="p-4 bg-red-50 text-red-600 text-sm border-l-2 border-red-500">
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={handleNext}
                                className="group w-full flex items-center justify-center gap-3 px-6 py-4 bg-blue-600 text-white font-bold text-lg hover:bg-blue-700 transition-all"
                            >
                                <span>Continuar</span>
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    )}

                    {/* STEP 2: PROFESSIONAL INFO */}
                    {step === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
                            <div>
                                <h2 className="text-3xl font-bold text-slate-900 mb-2">Informações Profissionais</h2>
                                <p className="text-slate-500">Queremos entender melhor seu negócio</p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                        Cargo / Função *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.role}
                                        onChange={(e) => updateField('role', e.target.value)}
                                        placeholder="Ex: Gerente de Marketing, CEO, Analista"
                                        className="w-full px-4 py-3 border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                        Tipo de Negócio *
                                    </label>
                                    <select
                                        value={formData.business_type}
                                        onChange={(e) => updateField('business_type', e.target.value)}
                                        className="w-full px-4 py-3 border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none transition-all bg-white"
                                    >
                                        <option value="">Selecione...</option>
                                        {BUSINESS_TYPES.map(type => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {error && (
                                <div className="p-4 bg-red-50 text-red-600 text-sm border-l-2 border-red-500">
                                    {error}
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setStep(1)}
                                    className="px-6 py-3 border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition-all"
                                >
                                    Voltar
                                </button>
                                <button
                                    onClick={handleNext}
                                    className="group flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-blue-600 text-white font-bold text-lg hover:bg-blue-700 transition-all"
                                >
                                    <span>Continuar</span>
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: GOALS */}
                    {step === 3 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
                            <div>
                                <h2 className="text-3xl font-bold text-slate-900 mb-2">Seus Objetivos</h2>
                                <p className="text-slate-500">O que você espera alcançar com o MajorHub?</p>
                            </div>

                            <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2">
                                {GOAL_OPTIONS.map((goal) => {
                                    const isSelected = formData.goals.includes(goal.value);
                                    return (
                                        <button
                                            key={goal.value}
                                            onClick={() => toggleGoal(goal.value)}
                                            className={`flex items-center gap-4 p-4 border-2 transition-all text-left ${isSelected
                                                    ? 'border-blue-600 bg-blue-50'
                                                    : 'border-slate-200 hover:border-slate-400'
                                                }`}
                                        >
                                            <div className={`w-5 h-5 border-2 flex items-center justify-center transition-all ${isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                                                }`}>
                                                {isSelected && <CheckCircle2 size={16} className="text-white" />}
                                            </div>
                                            <span className={`font-bold ${isSelected ? 'text-blue-900' : 'text-slate-700'}`}>
                                                {goal.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            {error && (
                                <div className="p-4 bg-red-50 text-red-600 text-sm border-l-2 border-red-500">
                                    {error}
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setStep(2)}
                                    className="px-6 py-3 border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition-all"
                                >
                                    Voltar
                                </button>
                                <button
                                    onClick={handleNext}
                                    disabled={loading}
                                    className="group flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-blue-600 text-white font-bold text-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span>Salvando...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Finalizar</span>
                                            <CheckCircle2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 4: SUCCESS */}
                    {step === 4 && (
                        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 text-center flex flex-col items-center justify-center h-full">
                            <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle2 size={48} className="text-green-500 animate-bounce" />
                            </div>

                            <div>
                                <h2 className="text-3xl font-bold text-slate-900 mb-2">Perfil Criado!</h2>
                                <p className="text-slate-500 max-w-md mx-auto">
                                    Bem-vindo, <strong>{formData.full_name}</strong>! Você está pronto para usar o MajorHub.
                                </p>
                            </div>

                            <p className="text-sm text-slate-400">Redirecionando para o dashboard...</p>
                        </div>
                    )}

                </div>
            </div>

            {/* Right Panel: Visual */}
            <div className="hidden md:flex w-[40%] bg-slate-900 relative overflow-hidden items-center justify-center p-12">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500 via-slate-900 to-black"></div>
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#475569 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>

                {/* Abstract Visual */}
                <div className="relative z-10 w-full max-w-[280px] aspect-square">
                    {/* Icons representing different steps */}
                    <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-700 ${step === 1 ? 'scale-110' : 'scale-100'}`}>
                        <div className="w-24 h-24 bg-blue-600 flex items-center justify-center shadow-[0_0_40px_rgba(37,99,235,0.5)]">
                            {step === 1 && <User size={40} className="text-white" />}
                            {step === 2 && <Briefcase size={40} className="text-white" />}
                            {step === 3 && <Target size={40} className="text-white" />}
                            {step === 4 && <CheckCircle2 size={40} className="text-white" />}
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-12 left-12 right-12 text-center">
                    <p className="text-slate-400 text-sm font-mono tracking-wider uppercase">
                        {step === 1 && "Informações Pessoais"}
                        {step === 2 && "Detalhes Profissionais"}
                        {step === 3 && "Definindo Metas"}
                        {step === 4 && "Configuração Completa"}
                    </p>
                </div>
            </div>

        </div>
    );
};
