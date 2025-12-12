import { ReactNode } from 'react'
import classNames from 'classnames'

export default function Card({ title, children, className }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <div
      className={classNames(
        'rounded-2xl border border-[rgba(var(--border),0.8)] bg-[rgba(var(--card-bg),0.95)] shadow-lg shadow-[rgba(var(--fg),0.05)] backdrop-blur',
        className,
      )}
    >
      {title && (
        <div className="px-5 py-3 border-b border-[rgba(var(--border),0.7)] font-semibold text-[rgb(var(--fg))] flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[rgb(var(--accent))] shadow-[0_0_0_4px_rgba(var(--accent),0.12)]" />
          {title}
        </div>
      )}
      <div className="p-5 space-y-3">{children}</div>
    </div>
  )
}
