import { ButtonHTMLAttributes, ReactNode } from 'react'
import classNames from 'classnames'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost'
  children: ReactNode
}

export default function Button({ variant = 'primary', className, children, ...props }: Props) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed'
  const variants = {
    primary: 'bg-[rgba(var(--accent),0.9)] text-white hover:bg-[rgba(var(--accent),1)] focus:ring-[rgba(var(--accent),0.45)] focus:ring-offset-[rgba(var(--bg),0.85)] shadow-[0_12px_30px_rgba(0,0,0,0.12)]',
    secondary: 'bg-[rgba(var(--fg),0.07)] text-[rgb(var(--fg))] hover:bg-[rgba(var(--fg),0.12)] focus:ring-[rgba(var(--fg),0.2)] focus:ring-offset-[rgba(var(--bg),0.9)]',
    ghost: 'bg-transparent text-[rgba(var(--fg),0.9)] hover:bg-[rgba(var(--fg),0.08)] focus:ring-[rgba(var(--fg),0.15)] focus:ring-offset-[rgba(var(--bg),0.9)]'
  }
  return (
    <button className={classNames(base, variants[variant], 'px-3 py-2', className)} {...props}>
      {children}
    </button>
  )
}
