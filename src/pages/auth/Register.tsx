import React, { useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useNavigate, Link } from 'react-router-dom';

const Register: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        onboarding_completed: false
                    }
                }
            });

            if (error) throw error;

            // If email confirmation is required, show message
            if (data?.user && !data.session) {
                alert('Cadastro realizado com sucesso! Por favor, verifique seu e-mail para confirmar sua conta.');
                navigate('/login');
            } else {
                // Auto-login successful, redirect to onboarding
                navigate('/onboarding');
            }
        } catch (err: any) {
            setError(err.message || 'Falha ao cadastrar');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-brand-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
                        <span className="text-white font-black text-xl">M</span>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">Criar Conta</h2>
                    <p className="text-slate-500">Comece a otimizar seus anúncios Meta hoje</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {error}
                    </div>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            placeholder="voce@empresa.com.br"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            placeholder="Crie uma senha forte"
                            required
                            minLength={6}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-brand-600 text-white py-3.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {loading ? (
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        ) : (
                            'Criar Conta'
                        )}
                    </button>
                </form>

                <p className="mt-8 text-center text-sm text-slate-500">
                    Já tem uma conta?{' '}
                    <Link to="/login" className="font-bold text-brand-600 hover:text-blue-700">
                        Fazer login
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
