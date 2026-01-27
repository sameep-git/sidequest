import React from 'react';
import { ActivityIndicator, Pressable, PressableProps, Text } from 'react-native';
// Actually I don't see a lib/utils. I'll just use standard prop passing and array styles or clsx if available.
// I'll stick to simple prop passing for now to be safe.

interface ButtonProps extends PressableProps {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    label?: string;
    loading?: boolean;
    children?: React.ReactNode;
    className?: string; // For NativeWind
    textClassName?: string;
}

export function Button({
    variant = 'primary',
    size = 'md',
    label,
    loading = false,
    children,
    className,
    textClassName,
    disabled,
    style,
    ...props
}: ButtonProps) {

    // Base styles
    let baseContainerStyle = "items-center justify-center rounded-2xl flex-row";
    let baseTextStyle = "font-semibold";

    // Variant styles
    let variantContainerStyle = "";
    let variantTextStyle = "";

    switch (variant) {
        case 'primary':
            variantContainerStyle = "bg-emerald-600 dark:bg-[#0F8]";
            variantTextStyle = "text-white dark:text-black";
            break;
        case 'secondary':
            variantContainerStyle = "bg-[#333]";
            variantTextStyle = "text-white";
            break;
        case 'outline':
            variantContainerStyle = "bg-transparent border-2 border-[#333]";
            variantTextStyle = "text-white";
            break;
        case 'danger':
            variantContainerStyle = "bg-red-500";
            variantTextStyle = "text-white";
            break;
        case 'ghost':
            variantContainerStyle = "bg-transparent";
            variantTextStyle = "text-white/60";
            break;
    }

    // Size styles
    let sizeContainerStyle = "";
    let sizeTextStyle = "";

    switch (size) {
        case 'sm':
            sizeContainerStyle = "px-3 py-2";
            sizeTextStyle = "text-sm";
            break;
        case 'md':
            sizeContainerStyle = "px-5 py-3"; // Matching the "Add" top button
            sizeTextStyle = "text-base";
            break;
        case 'lg':
            sizeContainerStyle = "px-6 py-4"; // Matching the bottom CTA
            sizeTextStyle = "text-lg";
            break;
        case 'icon':
            sizeContainerStyle = "p-2";
            break;
    }

    if (disabled || loading) {
        // Opacity handled via style/className usually, 
        // but here we can just append an opacity class or let the parent handle it.
        // simpler to just effectively "dim" it in logic if using pure tailwind strings
    }

    return (
        <Pressable
            disabled={disabled || loading}
            className={`${baseContainerStyle} ${variantContainerStyle} ${sizeContainerStyle} ${disabled ? 'opacity-50' : ''} ${className || ''}`}
            style={style}
            {...props}
        >
            {loading ? (
                <ActivityIndicator color={variant === 'primary' ? 'black' : 'white'} size="small" />
            ) : (
                <>
                    {children}
                    {label && (
                        <Text className={`${baseTextStyle} ${variantTextStyle} ${sizeTextStyle} ${textClassName || ''}`}>
                            {label}
                        </Text>
                    )}
                </>
            )}
        </Pressable>
    );
}
