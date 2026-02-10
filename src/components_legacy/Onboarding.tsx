
import React, { useState, useEffect } from 'react';
import { metaService } from '../services/metaService';
import { UserContext, BusinessManager, AdAccount, MetaPage, InstagramAccount } from '../types';

interface OnboardingProps {
  userContext: UserContext;
  onAssetSelected: (updatedContext: UserContext) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ userContext, onAssetSelected }) => {
  const [step, setStep] = useState(1);
  const [businesses, setBusinesses] = useState<BusinessManager[]>([]);
  const [adAccounts, setAdAccounts] = useState<AdAccount[]>([]);
  const [pages, setPages] = useState<MetaPage[]>([]);
  const [instagrams, setInstagrams] = useState<InstagramAccount[]>([]);
  const [loading, setLoading] = useState(false);

  // Local selection state
  const [selectedBM, setSelectedBM] = useState<BusinessManager | undefined>(userContext.selectedBusiness);
  const [selectedAdAccount, setSelectedAdAccount] = useState<AdAccount | undefined>(userContext.selectedAdAccount);
  const [selectedPage, setSelectedPage] = useState<MetaPage | undefined>(userContext.selectedPage);

  useEffect(() => {
    const loadBMs = async () => {
      setLoading(true);
      const data = await metaService.getBusinesses();
      setBusinesses(data);
      setLoading(false);
    };
    loadBMs();
  }, []);

  const handleSelectBM = async (bm: BusinessManager) => {
    setSelectedBM(bm);
    setLoading(true);
    const accounts = await metaService.getAdAccounts(bm.id);
    const pageData = await metaService.getPages(bm.id);
    setAdAccounts(accounts);
    setPages(pageData);
    setLoading(false);
    setStep(2);
  };

  const handleSelectAccount = (acc: AdAccount) => {
    setSelectedAdAccount(acc);
    setStep(3);
  };

  const handleSelectPage = async (page: MetaPage) => {
    setSelectedPage(page);
    setLoading(true);
    const igs = await metaService.getInstagramAccounts(page.id);
    setInstagrams(igs);
    setLoading(false);
    setStep(4);
  };

  const finishOnboarding = (ig?: InstagramAccount) => {
    onAssetSelected({
      ...userContext,
      selectedBusiness: selectedBM,
      selectedAdAccount: selectedAdAccount,
      selectedPage: selectedPage,
      selectedInstagram: ig
    });
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <div className="mb-12 text-center">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Connect Your Assets</h2>
        <p className="text-slate-500">We follow Meta's official Marketing API guidelines to ensure your data stays secure.</p>

        {/* Progress Bar */}
        <div className="mt-8 flex items-center justify-center gap-4">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className={`w-3 h-3 rounded-full transition-all duration-300 ${step >= s ? 'bg-blue-600 w-8' : 'bg-slate-200'}`} />
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 p-8 md:p-12">
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm">1</span>
              Select Business Manager
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {businesses.map(bm => (
                <button
                  key={bm.id}
                  onClick={() => handleSelectBM(bm)}
                  className="group flex items-center justify-between p-6 rounded-2xl border-2 border-slate-100 hover:border-blue-500 transition-all text-left hover:bg-blue-50/50"
                >
                  <div>
                    <p className="font-bold text-slate-800 text-lg group-hover:text-blue-700 transition-colors">{bm.name}</p>
                    <p className="text-slate-400 text-sm">{bm.vertical} • ID: {bm.id}</p>
                  </div>
                  <svg className="w-6 h-6 text-slate-300 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm">2</span>
              Choose Ad Account
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {adAccounts.map(acc => (
                <button
                  key={acc.id}
                  onClick={() => handleSelectAccount(acc)}
                  className="p-6 rounded-2xl border-2 border-slate-100 hover:border-blue-500 transition-all text-left hover:bg-blue-50/50 flex flex-col h-full"
                >
                  <div className="flex-1">
                    <p className="font-bold text-slate-800">{acc.name}</p>
                    <p className="text-slate-400 text-sm">ID: {acc.id}</p>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <span className="text-xs font-bold bg-emerald-50 text-emerald-600 px-2 py-1 rounded uppercase tracking-wider">{acc.status}</span>
                    <span className="text-xs font-bold text-slate-400">{acc.currency}</span>
                  </div>
                </button>
              ))}
            </div>
            <button onClick={() => setStep(1)} className="mt-8 text-slate-400 font-medium flex items-center gap-1 hover:text-slate-600 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              Go Back
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm">3</span>
              Select Facebook Page
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {pages.map(page => (
                <button
                  key={page.id}
                  onClick={() => handleSelectPage(page)}
                  className="flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-100 hover:border-blue-500 transition-all text-left hover:bg-blue-50/50"
                >
                  <img src={page.picture} alt="" className="w-12 h-12 rounded-xl object-cover bg-slate-100" />
                  <div>
                    <p className="font-bold text-slate-800">{page.name}</p>
                    <p className="text-slate-400 text-sm">{page.category}</p>
                  </div>
                </button>
              ))}
            </div>
            <button onClick={() => setStep(2)} className="mt-8 text-slate-400 font-medium flex items-center gap-1 hover:text-slate-600 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              Go Back
            </button>
          </div>
        )}

        {step === 4 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm">4</span>
              Link Instagram (Optional)
            </h3>
            <p className="text-slate-400 mb-8 text-sm">Connecting your Instagram profile allows you to run ads on both platforms simultaneously.</p>
            <div className="grid grid-cols-1 gap-4">
              {instagrams.length > 0 ? (
                instagrams.map(ig => (
                  <button
                    key={ig.id}
                    onClick={() => finishOnboarding(ig)}
                    className="flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-100 hover:border-pink-500 transition-all text-left hover:bg-pink-50/50"
                  >
                    <img src={ig.profile_picture_url} alt="" className="w-12 h-12 rounded-full border-2 border-pink-100" />
                    <div>
                      <p className="font-bold text-slate-800">@{ig.username}</p>
                      <p className="text-slate-400 text-sm">Linked to Page</p>
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                  <p className="text-slate-400">No Instagram accounts found for this page.</p>
                </div>
              )}

              <button
                onClick={() => finishOnboarding()}
                className="mt-4 w-full bg-slate-100 text-slate-600 py-4 rounded-xl font-bold hover:bg-slate-200 transition-colors"
              >
                Continue Without Instagram
              </button>
            </div>
            <button onClick={() => setStep(3)} className="mt-8 text-slate-400 font-medium flex items-center gap-1 hover:text-slate-600 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              Go Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
