import React from 'react';
import { OnboardingSteps } from '../../components/onboarding/OnboardingSteps';

const Onboarding: React.FC = () => {
    const handleOnboardingComplete = () => {
        // Logic handles navigation inside the component, but we could add analytics here
        console.log('Onboarding completed');
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="w-full max-w-6xl">
                <OnboardingSteps onComplete={handleOnboardingComplete} />

                <div className="mt-8 text-center text-slate-400 text-sm">
                    <p>© 2025 MajorHub. Todos os direitos reservados.</p>
                    <div className="flex justify-center gap-4 mt-2">
                        <span className="cursor-pointer hover:text-slate-600">Termos</span>
                        <span className="cursor-pointer hover:text-slate-600">Privacidade</span>
                        <span className="cursor-pointer hover:text-slate-600">Ajuda</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Onboarding;
