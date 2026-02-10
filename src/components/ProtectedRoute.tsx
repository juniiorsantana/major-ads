import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabaseClient';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { session, loading } = useAuth();
    const location = useLocation();
    const [checkingOnboarding, setCheckingOnboarding] = useState(true);
    const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);

    useEffect(() => {
        const checkOnboardingStatus = async () => {
            if (session?.user) {
                const { data } = await supabase.auth.getUser();
                const completed = data.user?.user_metadata?.onboarding_completed;
                setOnboardingCompleted(completed ?? false);
            }
            setCheckingOnboarding(false);
        };

        if (!loading) {
            checkOnboardingStatus();
        }
    }, [session, loading]);

    if (loading || checkingOnboarding) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
            </div>
        );
    }

    if (!session) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // If user hasn't completed onboarding and is trying to access dashboard
    if (onboardingCompleted === false && !location.pathname.startsWith('/onboarding')) {
        return <Navigate to="/onboarding" replace />;
    }

    // If user has completed onboarding and is trying to access onboarding page
    if (onboardingCompleted === true && location.pathname.startsWith('/onboarding')) {
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
