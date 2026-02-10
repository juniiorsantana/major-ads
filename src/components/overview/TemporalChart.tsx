import React, { useState } from 'react';
import {
    ResponsiveContainer,
    ComposedChart,
    Line,
    Area,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ReferenceLine,
    Brush,
} from 'recharts';
import { TrendingUp, BarChart2, LineChart as LineChartIcon, AreaChart } from 'lucide-react';
import { ChartDataPoint, ChartViewMode, KpiMetricKey } from '../../types';
import { KPI_METRICS } from './KpiCardsSection';

interface TemporalChartProps {
    data: ChartDataPoint[];
    comparisonData?: ChartDataPoint[];
    selectedMetric: KpiMetricKey;
    onMetricChange: (metric: KpiMetricKey) => void;
    showTrendLine?: boolean;
}

const VIEW_MODE_ICONS: Record<ChartViewMode, React.ReactNode> = {
    line: <LineChartIcon className="w-4 h-4" />,
    area: <AreaChart className="w-4 h-4" />,
    bar: <BarChart2 className="w-4 h-4" />,
};

const TemporalChart: React.FC<TemporalChartProps> = ({
    data,
    comparisonData,
    selectedMetric,
    onMetricChange,
    showTrendLine = true,
}) => {
    const [viewMode, setViewMode] = useState<ChartViewMode>('area');

    const metricConfig = KPI_METRICS.find((m) => m.key === selectedMetric);
    const primaryColor = metricConfig?.color || '#3b82f6';
    const comparisonColor = '#94a3b8';

    // Use actual data only, no demo generation
    const chartData = data;
    const hasData = data && data.length > 0;

    // Calculate average for trend line
    const average = chartData.length > 0
        ? chartData.reduce((sum, d) => sum + d.value, 0) / chartData.length
        : 0;

    // Format value based on metric type
    const formatValue = (value: number): string => {
        if (!metricConfig) return String(value);
        switch (metricConfig.format) {
            case 'currency':
                return new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2
                }).format(value);
            case 'percentage':
                return `${value.toFixed(2)}%`;
            case 'decimal':
                return value.toFixed(2);
            case 'number':
            default:
                return new Intl.NumberFormat('pt-BR').format(value);
        }
    };

    // Custom tooltip
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (!active || !payload || !payload.length) return null;

        return (
            <div className="bg-slate-800 text-white rounded-lg shadow-xl p-3 text-sm border border-slate-700">
                <p className="font-medium mb-2">{label}</p>
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: primaryColor }} />
                        <span className="text-slate-400">Atual:</span>
                        <span className="font-semibold">{formatValue(payload[0]?.value || 0)}</span>
                    </div>
                    {comparisonData && payload[1] && (
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: comparisonColor }} />
                            <span className="text-slate-400">Comparação:</span>
                            <span className="font-medium text-slate-300">{formatValue(payload[1]?.value || 0)}</span>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // Render chart element based on view mode
    const renderChartElement = () => {
        switch (viewMode) {
            case 'line':
                return (
                    <>
                        <Line
                            type="monotone"
                            dataKey="value"
                            stroke={primaryColor}
                            strokeWidth={2}
                            dot={{ fill: primaryColor, strokeWidth: 0, r: 3 }}
                            activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }}
                        />
                        {comparisonData && (
                            <Line
                                type="monotone"
                                dataKey="comparisonValue"
                                stroke={comparisonColor}
                                strokeWidth={1.5}
                                strokeDasharray="5 5"
                                dot={false}
                            />
                        )}
                    </>
                );
            case 'area':
                return (
                    <>
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={primaryColor} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={primaryColor} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke={primaryColor}
                            strokeWidth={2}
                            fill="url(#colorValue)"
                            dot={{ fill: primaryColor, strokeWidth: 0, r: 3 }}
                            activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }}
                        />
                        {comparisonData && (
                            <Line
                                type="monotone"
                                dataKey="comparisonValue"
                                stroke={comparisonColor}
                                strokeWidth={1.5}
                                strokeDasharray="5 5"
                                dot={false}
                            />
                        )}
                    </>
                );
            case 'bar':
                return (
                    <>
                        <Bar
                            dataKey="value"
                            fill={primaryColor}
                            radius={[4, 4, 0, 0]}
                            barSize={24}
                        />
                        {comparisonData && (
                            <Bar
                                dataKey="comparisonValue"
                                fill={comparisonColor}
                                radius={[4, 4, 0, 0]}
                                barSize={16}
                            />
                        )}
                    </>
                );
        }
    };

    return (
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <h2 className="text-lg font-bold text-slate-800">Evolução Temporal</h2>
                    {!hasData && (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-medium rounded-md border border-slate-200">
                            Sem Dados
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    {/* Metric Toggle */}
                    <select
                        value={selectedMetric}
                        onChange={(e) => onMetricChange(e.target.value as KpiMetricKey)}
                        className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium 
                       text-slate-700 cursor-pointer hover:border-slate-300 
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {KPI_METRICS.map((metric) => (
                            <option key={metric.key} value={metric.key}>
                                {metric.label}
                            </option>
                        ))}
                    </select>

                    {/* View Mode Toggle */}
                    <div className="flex bg-slate-100 rounded-lg p-0.5">
                        {(['line', 'area', 'bar'] as ChartViewMode[]).map((mode) => (
                            <button
                                key={mode}
                                onClick={() => setViewMode(mode)}
                                className={`p-2 rounded-md transition-all ${viewMode === mode
                                    ? 'bg-white text-slate-800 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                                title={mode === 'line' ? 'Linha' : mode === 'area' ? 'Área' : 'Barras'}
                            >
                                {VIEW_MODE_ICONS[mode]}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div className="h-[350px] min-h-[350px]">
                {hasData ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                            <XAxis
                                dataKey="label"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 12 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 12 }}
                                tickFormatter={(value) => formatValue(value)}
                                width={80}
                            />
                            <Tooltip content={<CustomTooltip />} />

                            {/* Trend Line */}
                            {showTrendLine && (
                                <ReferenceLine
                                    y={average}
                                    stroke="#94a3b8"
                                    strokeDasharray="5 5"
                                    label={{
                                        value: `Média: ${formatValue(average)}`,
                                        position: 'insideTopRight',
                                        fill: '#64748b',
                                        fontSize: 11,
                                    }}
                                />
                            )}

                            {renderChartElement()}

                            {/* Brush for Zoom */}
                            {chartData.length > 10 && (
                                <Brush
                                    dataKey="label"
                                    height={30}
                                    stroke={primaryColor}
                                    fill="#f8fafc"
                                    tickFormatter={() => ''}
                                />
                            )}
                        </ComposedChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-slate-400">Aguardando dados...</p>
                    </div>
                )}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: primaryColor }} />
                    <span className="text-slate-600">{metricConfig?.label || 'Valor'}</span>
                </div>
                {comparisonData && (
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full border-2 border-dashed" style={{ borderColor: comparisonColor }} />
                        <span className="text-slate-500">Período anterior</span>
                    </div>
                )}
                {showTrendLine && (
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-500">Média</span>
                    </div>
                )}
            </div>
        </section>
    );
};

export default TemporalChart;
