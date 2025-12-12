import { ButtonHTMLAttributes, ReactNode } from 'react'
import classNames from 'classnames'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost'
  children: ReactNode
}

export default function Button({ variant = 'primary', className, children, ...props }: Props) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition disabled:opacity-60 disabled:cursor-not-allowed'
  const variants = {
    primary: 'bg-gradient-to-r from-[rgb(var(--accent))] to-[rgb(var(--accent2))] text-white shadow-lg shadow-[rgba(var(--accent),0.3)] hover:brightness-105 focus:ring-[rgba(var(--accent),0.4)] focus:ring-offset-[rgb(var(--card-bg))]',
    secondary: 'border border-[rgba(var(--border),0.9)] bg-[rgba(var(--card-bg),0.95)] text-[rgb(var(--fg))] hover:bg-[rgba(var(--fg),0.05)] focus:ring-[rgba(var(--accent),0.35)] focus:ring-offset-[rgb(var(--card-bg))]',
    ghost: 'text-[rgb(var(--fg))] hover:bg-[rgba(var(--fg),0.08)] focus:ring-[rgba(var(--accent),0.25)] focus:ring-offset-[rgb(var(--card-bg))]'
  }
  return (
    <button className={classNames(base, variants[variant], 'px-3 py-2', className)} {...props}>
      {children}
    </button>
  )
}
