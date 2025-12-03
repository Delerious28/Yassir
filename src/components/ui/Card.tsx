import { ReactNode } from 'react'
import classNames from 'classnames'

export default function Card({ title, children, className }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <div
      className={classNames(
        'rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card-bg))] shadow-sm',
        className,
      )}
    >
      {title && <div className="px-5 py-3 border-b border-[rgb(var(--border))] font-semibold text-[rgb(var(--fg))]">{title}</div>}
      <div className="p-5 space-y-3">{children}</div>
    </div>
  )
}
