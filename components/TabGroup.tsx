import React from 'react';
import { clsx } from 'clsx';

export interface Tab {
    id: string;
    label: string;
    icon?: React.ElementType;
    badge?: number;
}

interface TabGroupProps {
    tabs: Tab[];
    activeTab: string;
    onChange: (tabId: string) => void;
    variant?: 'default' | 'dark';
}

export const TabGroup: React.FC<TabGroupProps> = ({
    tabs,
    activeTab,
    onChange,
    variant = 'default',
}) => {
    const containerStyles = clsx(
        'flex p-1 rounded-xl',
        variant === 'default' ? 'bg-slate-200' : 'bg-slate-900 border border-slate-800 shadow-inner'
    );

    const getTabStyles = (isActive: boolean) => {
        if (variant === 'dark') {
            return clsx(
                'flex-1 flex items-center justify-center py-2.5 text-sm font-bold rounded-lg transition-all',
                isActive
                    ? 'bg-accent text-white shadow-md'
                    : 'text-slate-500 hover:text-slate-300'
            );
        }

        return clsx(
            'flex-1 flex items-center justify-center py-2 text-sm font-bold rounded-lg transition-all',
            isActive
                ? 'bg-white shadow text-slate-800'
                : 'text-slate-500 hover:text-slate-600'
        );
    };

    return (
        <div className={containerStyles}>
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;

                return (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => onChange(tab.id)}
                        className={getTabStyles(isActive)}
                    >
                        {Icon && <Icon size={16} className="mr-2" />}
                        {tab.label}
                        {tab.badge !== undefined && tab.badge > 0 && (
                            <span className="ml-2 bg-accent text-white text-[10px] px-1.5 rounded-full">
                                {tab.badge}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
};
