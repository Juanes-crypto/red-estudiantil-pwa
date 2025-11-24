interface LogoProps {
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

const sizeMap = {
    xs: 'w-8 h-8',
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32',
};

export default function Logo({ size = 'md', className = '' }: LogoProps) {
    return (
        <img
            src="/pwa-512x512.png"
            alt="Red Estudiantil Logo"
            className={`${sizeMap[size]} ${className} object-contain`}
        />
    );
}
