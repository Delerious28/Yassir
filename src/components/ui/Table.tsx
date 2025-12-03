import { ReactNode } from 'react'

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-auto border border-[rgb(var(--border))] rounded-xl shadow-sm bg-[rgba(var(--card-bg),0.6)] backdrop-blur-sm">
      <table className="min-w-full divide-y divide-[rgb(var(--border))]">{children}</table>
    </div>
  )
}

export function THead({ children }: { children: ReactNode }) {
  return (
    <thead className="bg-[rgba(var(--card-bg),0.9)]">
      <tr className="divide-x divide-[rgb(var(--border))]">{children}</tr>
    </thead>
  )
}

export function TH({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[rgba(var(--fg),0.75)] ${className}`}>{children}</th>
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody className="bg-[rgba(var(--card-bg),0.7)] divide-y divide-[rgb(var(--border))]">{children}</tbody>
}

export function TR({ children }: { children: ReactNode }) {
  return <tr className="divide-x divide-[rgb(var(--border))] hover:bg-[rgba(var(--accent),0.05)]">{children}</tr>
}

export function TD({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <td className={`px-4 py-3 text-sm text-[rgb(var(--fg))] ${className}`}>{children}</td>
}
