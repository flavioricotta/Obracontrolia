import React from 'react';
import { clsx } from 'clsx';

interface FilterChipProps {
    label: string;
    isActive: boolean;
    onClick: () => void;
    variant?: 'default' | 'dark';
}

export const FilterChip: React.FC<FilterChipProps> = ({
    label,
    isActive,
    onClick,
    variant = 'default',
}) => {
    const styles = clsx(
        'px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
        variant === 'dark'
            ? isActive
                ? 'bg-black text-white border-black'
                : 'bg-white text-slate-600 border-slate-200'
            : isActive
                ? 'bg-primary text-white'
                : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-50'
    );

    return (
        <button
            type="button"
            onClick={onClick}
            className={styles}
        >
            {label}
        </button>
    );
};
