import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    icon: React.ElementType;
    variant?: 'ghost' | 'danger' | 'success' | 'primary';
    size?: 'sm' | 'md' | 'lg';
    label?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
    icon: Icon,
    variant = 'ghost',
    size = 'md',
    label,
    className,
    ...props
}) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-full transition-colors focus:outline-none disabled:opacity-50 disabled:pointer-events-none';

    const variants = {
        ghost: 'text-slate-600 hover:bg-slate-100 active:bg-slate-200',
        danger: 'text-slate-400 hover:text-red-500 hover:bg-red-50 active:bg-red-100',
        success: 'text-white bg-green-500 hover:bg-green-600 active:bg-green-700',
        primary: 'text-white bg-accent hover:brightness-110 active:scale-95',
    };

    const sizes = {
        sm: 'p-1.5',
        md: 'p-2',
        lg: 'p-3',
    };

    const iconSizes = {
        sm: 16,
        md: 20,
        lg: 24,
    };

    return (
        <button
            className={twMerge(
                clsx(
                    baseStyles,
                    variants[variant],
                    sizes[size],
                    className
                )
            )}
            title={label}
            aria-label={label}
            {...props}
        >
            <Icon size={iconSizes[size]} />
        </button>
    );
};
