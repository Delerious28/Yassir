import { ReactNode } from 'react'
import classNames from 'classnames'

export default function Card({ title, children, className }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <div
      className={classNames(
        'card rounded-xl border shadow-[0_18px_48px_rgba(15,23,42,0.08)] bg-[rgb(var(--card-bg))] border-[rgb(var(--border))] backdrop-blur-sm',
        className,
      )}
      style={{
        background: 'linear-gradient(150deg, rgba(var(--card-bg),0.9), rgba(var(--card-bg),0.82))',
      }}
    >
      {title && <div className="px-5 py-3 border-b border-[rgb(var(--border))] font-semibold text-[rgb(var(--fg))]">{title}</div>}
      <div className="p-5">{children}</div>
    </div>
  )
}
