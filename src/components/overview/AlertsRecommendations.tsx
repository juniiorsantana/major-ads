import React from 'react';
import { AlertTriangle, AlertCircle, TrendingUp, Lightbulb, ChevronRight } from 'lucide-react';

export type AlertType = 'critical' | 'warning' | 'opportunity' | 'insight';

export interface AlertItem {
    type: AlertType;
    title: string;
    description: string;
    suggestion: string;
    campaign?: string;
}

interface AlertsRecommendationsProps {
    alerts: AlertItem[];
}

const ALERT_STYLES: Record<AlertType, {
    icon: React.ReactNode;
    bgColor: string;
    textColor: string;
    dotColor: string;
    label: string;
}> = {
    critical: {
        icon: <AlertCircle className="w-4 h-4" />,
        bgColor: 'bg-red-50',
        textColor: 'text-red-600',
        dotColor: 'bg-red-500',
        label: 'CRÍTICO',
    },
    warning: {
        icon: <AlertTriangle className="w-4 h-4" />,
        bgColor: 'bg-amber-50',
        textColor: 'text-amber-600',
        dotColor: 'bg-amber-500',
        label: 'ATENÇÃO',
    },
    opportunity: {
        icon: <TrendingUp className="w-4 h-4" />,
        bgColor: 'bg-emerald-50',
        textColor: 'text-emerald-600',
        dotColor: 'bg-emerald-500',
        label: 'OPORTUNIDADE',
    },
    insight: {
        icon: <Lightbulb className="w-4 h-4" />,
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-600',
        dotColor: 'bg-blue-500',
        label: 'INSIGHT',
    },
};

const AlertsRecommendations: React.FC<AlertsRecommendationsProps> = ({ alerts }) => {
    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Alertas e Oportunidades
                </h3>
                <span className="text-xs text-slate-500">
                    {alerts.length} {alerts.length === 1 ? 'item' : 'itens'}
                </span>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto max-h-[280px] pr-1">
                {alerts.map((alert, idx) => {
                    const style = ALERT_STYLES[alert.type];

                    return (
                        <div
                            key={idx}
                            className={`rounded-lg p-3 ${style.bgColor} border border-transparent hover:border-slate-200 transition-colors cursor-pointer`}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`p-1.5 rounded-lg bg-white ${style.textColor}`}>
                                    {style.icon}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-[10px] font-bold ${style.textColor} uppercase tracking-wider`}>
                                            {style.label}
                                        </span>
                                        {alert.campaign && (
                                            <span className="text-[10px] text-slate-500 bg-white px-1.5 py-0.5 rounded">
                                                {alert.campaign}
                                            </span>
                                        )}
                                    </div>

                                    <p className="text-sm text-slate-700 font-medium leading-snug">
                                        {alert.description}
                                    </p>

                                    <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
                                        <ChevronRight className="w-3 h-3" />
                                        <span>Sugestão: {alert.suggestion}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {alerts.length === 0 && (
                    <div className="text-center py-8 text-slate-400">
                        <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Nenhum alerta no momento</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AlertsRecommendations;
