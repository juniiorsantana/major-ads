/**
 * Skeleton Loader Component
 * Componente reutilizável para estados de loading
 */

import React from 'react';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
    width?: string | number;
    height?: string | number;
    animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
    className = '',
    variant = 'rectangular',
    width,
    height,
    animation = 'pulse',
}) => {
    const baseClasses = 'bg-slate-200';

    const variantClasses: Record<string, string> = {
        text: 'rounded',
        circular: 'rounded-full',
        rectangular: '',
        rounded: 'rounded-lg',
    };

    const animationClasses: Record<string, string> = {
        pulse: 'animate-pulse',
        wave: 'animate-shimmer',
        none: '',
    };

    const style: React.CSSProperties = {
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
    };

    return (
        <div
            className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
            style={style}
        />
    );
};

// Pre-configured skeleton variants for common use cases

export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({
    lines = 1,
    className = '',
}) => (
    <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
            <Skeleton
                key={i}
                variant="text"
                height={16}
                width={i === lines - 1 && lines > 1 ? '75%' : '100%'}
            />
        ))}
    </div>
);

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div className={`bg-white rounded-xl border border-slate-200 p-6 ${className}`}>
        <div className="flex items-center gap-4 mb-4">
            <Skeleton variant="circular" width={40} height={40} />
            <div className="flex-1">
                <Skeleton variant="text" height={20} width="60%" className="mb-2" />
                <Skeleton variant="text" height={14} width="40%" />
            </div>
        </div>
        <Skeleton variant="rounded" height={100} className="mb-4" />
        <div className="flex gap-2">
            <Skeleton variant="rounded" height={32} width={80} />
            <Skeleton variant="rounded" height={32} width={80} />
        </div>
    </div>
);

export const SkeletonKpiCard: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div className={`bg-white rounded-xl border border-slate-200 p-5 ${className}`}>
        <div className="flex justify-between items-start mb-4">
            <Skeleton variant="text" height={14} width={80} />
            <Skeleton variant="circular" width={24} height={24} />
        </div>
        <Skeleton variant="text" height={32} width="50%" className="mb-2" />
        <div className="flex items-center gap-2">
            <Skeleton variant="rounded" height={20} width={60} />
            <Skeleton variant="text" height={12} width={40} />
        </div>
        <Skeleton variant="rounded" height={40} className="mt-4" />
    </div>
);

export const SkeletonTable: React.FC<{ rows?: number; columns?: number }> = ({
    rows = 5,
    columns = 5,
}) => (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="border-b border-slate-200 p-4 flex gap-4">
            {Array.from({ length: columns }).map((_, i) => (
                <Skeleton key={i} variant="text" height={16} className="flex-1" />
            ))}
        </div>
        {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={rowIndex} className="border-b border-slate-100 p-4 flex gap-4">
                {Array.from({ length: columns }).map((_, colIndex) => (
                    <Skeleton
                        key={colIndex}
                        variant="text"
                        height={14}
                        className="flex-1"
                    />
                ))}
            </div>
        ))}
    </div>
);

export default Skeleton;
