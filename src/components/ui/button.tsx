'use client'

import { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// Button-Varianten definieren
const buttonVariants = cva(
  // Basis-Klassen
  'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        // Primärer Button
        primary: 'bg-primary-600 text-white hover:bg-primary-700 focus-visible:ring-primary-500 shadow-soft hover:shadow-glow active:bg-primary-800',
        // Sekundärer Button
        secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus-visible:ring-gray-500 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600',
        // Outline Button
        outline: 'border-2 border-primary-600 text-primary-600 hover:bg-primary-600 hover:text-white focus-visible:ring-primary-500',
        // Ghost Button
        ghost: 'text-gray-700 hover:bg-gray-100 focus-visible:ring-gray-500 dark:text-gray-300 dark:hover:bg-gray-800',
        // Destruktiver Button
        destructive: 'bg-error-600 text-white hover:bg-error-700 focus-visible:ring-error-500',
        // Link-Button
        link: 'text-primary-600 underline-offset-4 hover:underline focus-visible:ring-primary-500',
      },
      size: {
        // Kleine Größe
        sm: 'h-8 px-3 text-sm',
        // Standard-Größe
        md: 'h-10 px-4 text-sm',
        // Große Größe
        lg: 'h-12 px-6 text-base',
        // Sehr große Größe
        xl: 'h-14 px-8 text-lg',
        // Icon-Button
        icon: 'h-10 w-10',
      },
      // Abgerundete Ecken
      rounded: {
        default: 'rounded-lg',
        full: 'rounded-full',
        none: 'rounded-none',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      rounded: 'default',
    },
  }
)

// Button-Props definieren
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  // Zusätzliche Props
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

// Button-Komponente
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    rounded,
    loading = false,
    leftIcon,
    rightIcon,
    children, 
    disabled,
    ...props 
  }, ref) => {
    // Loading-Zustand
    const isDisabled = disabled || loading

    return (
      <button
        className={cn(buttonVariants({ variant, size, rounded, className }))}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {/* Loading-Spinner */}
        {loading && (
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
        
        {/* Linkes Icon */}
        {!loading && leftIcon && (
          <span className="mr-2">{leftIcon}</span>
        )}
        
        {/* Button-Text */}
        {children}
        
        {/* Rechtes Icon */}
        {!loading && rightIcon && (
          <span className="ml-2">{rightIcon}</span>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button, buttonVariants }
