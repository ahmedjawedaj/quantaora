import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
}

const variants: Record<string, string> = {
  primary:
    'bg-[color:var(--color-brand-strong)] text-[color:var(--color-paper-50)] hover:bg-[color:var(--color-aura-900)] shadow-[var(--shadow-tactile)]',
  secondary:
    'bg-[color:var(--color-surface-raised)] text-[color:var(--color-foreground)] border border-[color:var(--color-border)] hover:border-[color:var(--color-ink-300)]',
  outline:
    'bg-transparent text-[color:var(--color-foreground)] border border-current/20 hover:bg-[color:var(--color-surface)]',
  ghost: 'bg-transparent text-[color:var(--color-foreground)] hover:bg-[color:var(--color-surface)]',
}

const sizes: Record<string, string> = {
  sm: 'h-9 px-3.5 text-sm gap-1.5',
  md: 'h-11 px-5 text-[0.95rem] gap-2',
  lg: 'h-13 px-7 text-base gap-2.5',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-full font-medium transition-all duration-200 ease-out active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap',
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'
