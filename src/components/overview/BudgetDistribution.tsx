import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface DistributionData {
    name: string;
    value: number;
    color: string;
}

interface DistributionCardProps {
    title: string;
    data: DistributionData[];
    showAsChart?: boolean;
}

const DistributionCard: React.FC<DistributionCardProps> = ({ title, data, showAsChart = true }) => {
    const hasData = data && data.length > 0;
    const total = hasData ? data.reduce((sum, item) => sum + item.value, 0) : 0;

    return (
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                {title}
            </h4>

            {!hasData ? (
                <p className="text-sm text-slate-400 py-4">Sem dados disponíveis</p>
            ) : showAsChart ? (
                <div className="flex items-center gap-3">
                    <div className="w-20 h-20 shrink-0">
                        <ResponsiveContainer width={80} height={80}>
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={20}
                                    outerRadius={35}
                                    dataKey="value"
                                    strokeWidth={0}
                                >
                                    {data.map((entry, index) => (
                                        <Cell key={index} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value: number) => [
                                        `${((value / total) * 100).toFixed(1)}%`,
                                        'Participação'
                                    ]}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex-1 space-y-1">
                        {data.slice(0, 3).map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                <span className="text-slate-600 truncate">{item.name}</span>
                                <span className="text-slate-800 font-semibold ml-auto">
                                    {((item.value / total) * 100).toFixed(0)}%
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="space-y-1.5">
                    {data.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                <span className="text-slate-600">{item.name}</span>
                            </div>
                            <span className="text-slate-800 font-semibold">
                                {((item.value / total) * 100).toFixed(0)}%
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

interface BudgetDistributionProps {
    byCampaign: DistributionData[];
    byObjective: DistributionData[];
    byPlatform: DistributionData[];
    byAudience: DistributionData[];
}

const BudgetDistribution: React.FC<BudgetDistributionProps> = ({
    byCampaign,
    byObjective,
    byPlatform,
    byAudience,
}) => {
    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-base font-bold text-slate-800 mb-4">
                Distribuição de Investimento
            </h3>

            <div className="grid grid-cols-2 gap-3">
                <DistributionCard title="Por Campanha" data={byCampaign} showAsChart />
                <DistributionCard title="Por Objetivo" data={byObjective} showAsChart />
                <DistributionCard title="Por Plataforma" data={byPlatform} showAsChart={false} />
                <DistributionCard title="Por Público" data={byAudience} showAsChart={false} />
            </div>
        </div>
    );
};

export default BudgetDistribution;
