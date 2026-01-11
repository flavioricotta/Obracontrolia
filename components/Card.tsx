import React from 'react';
import { clsx } from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className, onClick }) => {
  return (
    <div 
      className={clsx("bg-white rounded-xl shadow-sm border border-slate-100 p-4", className)}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
