
import React, { useState, useEffect } from 'react';
import { metaService } from '../services/metaService';
import { geminiService } from '../services/geminiService';
import { UserContext, Campaign } from '../types';
import Sidebar from './Sidebar';

interface DashboardProps {
  userContext: UserContext;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ userContext, onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<string>('');
  const [generatingInsights, setGeneratingInsights] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (userContext.selectedAdAccount) {
        setLoading(true);
        const data = await metaService.getCampaigns(userContext.selectedAdAccount.id);
        setCampaigns(data);
        setLoading(false);
      }
    };
    loadData();
  }, [userContext.selectedAdAccount]);

  const handleGenerateInsights = async () => {
    setGeneratingInsights(true);
    try {
      const result = await geminiService.analyzeMetrics(campaigns);
      setInsights(result);
    } catch (e) {
      console.error(e);
    } finally {
      setGeneratingInsights(false);
    }
  };

  const totalSpend = campaigns.reduce((acc, c) => acc + c.spend, 0);
  const totalImpressions = campaigns.reduce((acc, c) => acc + c.impressions, 0);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={onLogout} />

      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-500">
              Account: <span className="font-semibold">{userContext.selectedAdAccount?.name}</span>
            </p>
          </div>
          <div className="flex gap-4">
             <div className="px-4 py-2 bg-white border border-slate-200 rounded-lg flex items-center gap-2">
                <img src={userContext.selectedPage?.picture} className="w-6 h-6 rounded-full" alt="" />
                <span className="text-sm font-medium">{userContext.selectedPage?.name}</span>
             </div>
             <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm">
               New Campaign
             </button>
          </div>
        </header>

        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'Total Spend', value: `$${totalSpend.toLocaleString()}`, change: '+12.5%', color: 'blue' },
                { label: 'Total Impressions', value: totalImpressions.toLocaleString(), change: '+8.2%', color: 'emerald' },
                { label: 'Active Campaigns', value: campaigns.filter(c => c.status === 'ACTIVE').length, change: 'Stable', color: 'indigo' },
              ].map((stat, i) => (
                <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-slate-500 text-sm font-medium mb-1">{stat.label}</p>
                  <div className="flex items-end justify-between">
                    <h3 className="text-2xl font-bold text-slate-800">{stat.value}</h3>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                      stat.change.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {stat.change}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* AI Optimization Card */}
            <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
               <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-2">AI Campaign Insights</h2>
                    <p className="text-blue-100 mb-4 max-w-lg">
                      Let Gemini analyze your current campaign performance and suggest optimizations to lower your CPA.
                    </p>
                    {insights ? (
                      <div className="bg-white/10 backdrop-blur rounded-lg p-4 text-sm border border-white/20 whitespace-pre-wrap">
                        {insights}
                      </div>
                    ) : (
                      <button
                        onClick={handleGenerateInsights}
                        disabled={generatingInsights}
                        className="bg-white text-blue-700 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                        {generatingInsights ? (
                           <span className="animate-spin rounded-full h-4 w-4 border-2 border-blue-700 border-t-transparent" />
                        ) : (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                          </svg>
                        )}
                        {generatingInsights ? 'Analyzing Data...' : 'Generate AI Insights'}
                      </button>
                    )}
                  </div>
                  <div className="w-32 h-32 opacity-20">
                    <svg className="w-full h-full" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
               </div>
               <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl"></div>
            </div>

            {/* Campaign Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-slate-800">Recent Campaigns</h3>
                <button className="text-sm text-blue-600 font-medium hover:underline">View All</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                      <th className="px-6 py-3">Campaign Name</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Spend</th>
                      <th className="px-6 py-3">Impressions</th>
                      <th className="px-6 py-3">CPC</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {campaigns.map((campaign) => (
                      <tr key={campaign.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-800">{campaign.name}</p>
                          <p className="text-xs text-slate-400 capitalize">{campaign.objective.toLowerCase().replace('outcome_', '')}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${
                            campaign.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                              campaign.status === 'ACTIVE' ? 'bg-emerald-600' : 'bg-slate-400'
                            }`}></span>
                            {campaign.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 font-medium">${campaign.spend.toFixed(2)}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{campaign.impressions.toLocaleString()}</td>
                        <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                          ${(campaign.spend / (campaign.clicks || 1)).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="text-slate-400 hover:text-blue-600 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ai-tools' && (
          <div className="max-w-4xl mx-auto py-12">
             <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-slate-900 mb-4">Ad Copy Generator</h2>
                <p className="text-slate-500">Use Gemini to write high-converting copy for your Meta Ads in seconds.</p>
             </div>
             <AdGenerator />
          </div>
        )}
      </main>
    </div>
  );
};

const AdGenerator: React.FC = () => {
  const [product, setProduct] = useState('');
  const [audience, setAudience] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const data = await geminiService.generateAdCopy(product, audience);
      setResults(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Product Name / Service</label>
            <input
              type="text"
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="e.g. UltraFit Wireless Headphones"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Target Audience</label>
            <input
              type="text"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="e.g. Tech enthusiasts, Gym goers"
            />
          </div>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading || !product || !audience}
          className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-100"
        >
          {loading ? 'Thinking...' : 'Generate Copies'}
        </button>
      </div>

      {results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {results.map((copy, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border-2 border-slate-100 hover:border-blue-200 transition-all shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Variation {i + 1}</span>
                <button className="text-slate-400 hover:text-slate-600">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                </button>
              </div>
              <p className="text-sm text-slate-700 mb-4 italic leading-relaxed">"{copy.primaryText}"</p>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <p className="text-xs font-bold text-slate-400 mb-1">Headline</p>
                <p className="font-bold text-slate-900">{copy.headline}</p>
                <p className="text-xs text-blue-600 mt-2 font-bold">{copy.cta}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
