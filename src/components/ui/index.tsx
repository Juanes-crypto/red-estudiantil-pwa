// ================================================
// UI COMPONENTS - Design System (SOLID + DRY)
// ================================================
// Componentes reutilizables siguiendo principios:
// - Single Responsibility
// - Open/Closed (extensible vía props)
// - Interface Segregation (props específicos)
// ================================================

import { ReactNode, ButtonHTMLAttributes } from 'react';

// ================================================
// BUTTON COMPONENTS
// ================================================

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning';
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
    loading?: boolean;
    children: ReactNode;
}

export function Button({
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    loading = false,
    disabled,
    className = '',
    children,
    ...props
}: ButtonProps) {
    const baseClasses = 'rounded-lg font-semibold transition-all flex items-center justify-center gap-2';

    const variantClasses = {
        primary: 'bg-cyan-600 hover:bg-cyan-700 text-white',
        secondary: 'bg-zinc-700 hover:bg-zinc-600 text-white',
        success: 'bg-green-600 hover:bg-green-700 text-white',
        danger: 'bg-red-600 hover:bg-red-700 text-white',
        warning: 'bg-yellow-600 hover:bg-yellow-700 text-white'
    };

    const sizeClasses = {
        sm: 'px-3 py-1 text-sm',
        md: 'px-5 py-2.5 text-base',
        lg: 'px-6 py-3 text-lg'
    };

    const classes = [
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? 'w-full' : '',
        disabled || loading ? 'opacity-50 cursor-not-allowed' : '',
        className
    ].join(' ');

    return (
        <button
            className={classes}
            disabled={disabled || loading}
            {...props}
        >
            {loading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {children}
        </button>
    );
}

// ================================================
// CARD COMPONENT
// ================================================

interface CardProps {
    children: ReactNode;
    className?: string;
    title?: string;
    footer?: ReactNode;
}

export function Card({ children, className = '', title, footer }: CardProps) {
    return (
        <div className={`bg-zinc-800 rounded-lg border border-zinc-700 ${className}`}>
            {title && (
                <div className="border-b border-zinc-700 px-6 py-4">
                    <h3 className="text-xl font-semibold text-white">{title}</h3>
                </div>
            )}
            <div className="p-6">{children}</div>
            {footer && (
                <div className="border-t border-zinc-700 px-6 py-4 bg-zinc-800/50">
                    {footer}
                </div>
            )}
        </div>
    );
}

// ================================================
// LOADING COMPONENT
// ================================================

interface LoadingProps {
    text?: string;
    size?: 'sm' | 'md' | 'lg';
}

export function Loading({ text = 'Cargando...', size = 'md' }: LoadingProps) {
    const sizeClasses = {
        sm: 'w-6 h-6',
        md: 'w-12 h-12',
        lg: 'w-16 h-16'
    };

    return (
        <div className="flex flex-col items-center justify-center gap-4 py-8">
            <div className={`${sizeClasses[size]} border-4 border-cyan-600 border-t-transparent rounded-full animate-spin`} />
            <p className="text-zinc-400">{text}</p>
        </div>
    );
}

// ================================================
// EMPTY STATE COMPONENT
// ================================================

interface EmptyStateProps {
    icon?: string;
    title: string;
    description?: string;
    action?: ReactNode;
}

export function EmptyState({ icon = '📭', title, description, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
            <div className="text-6xl">{icon}</div>
            <h3 className="text-xl font-semibold text-white">{title}</h3>
            {description && <p className="text-zinc-400 max-w-md">{description}</p>}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}

// ================================================
// ERROR COMPONENT
// ================================================

interface ErrorDisplayProps {
    error: string;
    onRetry?: () => void;
}

export function ErrorDisplay({ error, onRetry }: ErrorDisplayProps) {
    return (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-6 text-center">
            <div className="text-4xl mb-3">⚠️</div>
            <h3 className="text-lg font-semibold text-red-400 mb-2">Error</h3>
            <p className="text-red-300 text-sm mb-4">{error}</p>
            {onRetry && (
                <Button variant="danger" onClick={onRetry} size="sm">
                    Reintentar
                </Button>
            )}
        </div>
    );
}

// ================================================
// INPUT COMPONENT
// ================================================

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
}

export function Input({
    label,
    error,
    helperText,
    className = '',
    ...props
}: InputProps) {
    return (
        <div className="space-y-1">
            {label && (
                <label className="block text-sm font-medium text-zinc-300">
                    {label}
                </label>
            )}
            <input
                className={`w-full px-4 py-2 bg-zinc-700 border ${error ? 'border-red-500' : 'border-zinc-600'
                    } rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 ${error ? 'focus:ring-red-500' : 'focus:ring-cyan-500'
                    } ${className}`}
                {...props}
            />
            {error && <p className="text-sm text-red-400">{error}</p>}
            {helperText && !error && <p className="text-sm text-zinc-400">{helperText}</p>}
        </div>
    );
}

// ================================================
// SELECT COMPONENT
// ================================================

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    options: { value: string; label: string }[];
}

export function Select({
    label,
    error,
    options,
    className = '',
    ...props
}: SelectProps) {
    return (
        <div className="space-y-1">
            {label && (
                <label className="block text-sm font-medium text-zinc-300">
                    {label}
                </label>
            )}
            <select
                className={`w-full px-4 py-2 bg-zinc-700 border ${error ? 'border-red-500' : 'border-zinc-600'
                    } rounded-lg text-white focus:outline-none focus:ring-2 ${error ? 'focus:ring-red-500' : 'focus:ring-cyan-500'
                    } ${className}`}
                {...props}
            >
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
            {error && <p className="text-sm text-red-400">{error}</p>}
        </div>
    );
}

// ================================================
// BADGE COMPONENT
// ================================================

interface BadgeProps {
    variant?: 'success' | 'warning' | 'danger' | 'info';
    children: ReactNode;
    size?: 'sm' | 'md';
}

export function Badge({ variant = 'info', children, size = 'md' }: BadgeProps) {
    const variantClasses = {
        success: 'bg-green-900/50 text-green-300 border-green-700',
        warning: 'bg-yellow-900/50 text-yellow-300 border-yellow-700',
        danger: 'bg-red-900/50 text-red-300 border-red-700',
        info: 'bg-cyan-900/50 text-cyan-300 border-cyan-700'
    };

    const sizeClasses = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-3 py-1 text-sm'
    };

    return (
        <span className={`inline-flex items-center rounded-full border font-medium ${variantClasses[variant]} ${sizeClasses[size]}`}>
            {children}
        </span>
    );
}

// ================================================
// MODAL COMPONENT
// ================================================

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    footer?: ReactNode;
}

export function Modal({ isOpen, onClose, title, children, footer }: ModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/70"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-zinc-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="border-b border-zinc-700 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-white">{title}</h2>
                    <button
                        onClick={onClose}
                        className="text-zinc-400 hover:text-white text-2xl leading-none"
                    >
                        ×
                    </button>
                </div>

                <div className="p-6">{children}</div>

                {footer && (
                    <div className="border-t border-zinc-700 px-6 py-4 flex gap-3 justify-end">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}

// ================================================
// STATS CARD COMPONENT
// ================================================

interface StatsCardProps {
    title: string;
    value: string | number;
    icon?: string;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    color?: 'green' | 'yellow' | 'red' | 'cyan';
}

export function StatsCard({ title, value, icon, trend, color = 'cyan' }: StatsCardProps) {
    const colorClasses = {
        green: 'from-green-600 to-green-700',
        yellow: 'from-yellow-600 to-yellow-700',
        red: 'from-red-600 to-red-700',
        cyan: 'from-cyan-600 to-cyan-700'
    };

    return (
        <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-lg p-6 text-white`}>
            <div className="flex items-start justify-between mb-2">
                <p className="text-sm font-medium opacity-90">{title}</p>
                {icon && <span className="text-2xl">{icon}</span>}
            </div>
            <p className="text-3xl font-bold mb-1">{value}</p>
            {trend && (
                <p className={`text-sm ${trend.isPositive ? 'text-green-200' : 'text-red-200'}`}>
                    {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                </p>
            )}
        </div>
    );
}
