import { ReactNode } from 'react'

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-auto border border-[rgb(var(--border))] rounded-xl bg-[rgb(var(--card-bg))] shadow-sm">
      <table className="min-w-full divide-y divide-[rgb(var(--border))]">{children}</table>
    </div>
  )
}

export function THead({ children }: { children: ReactNode }) {
  return (
    <thead className="bg-[rgb(var(--card-bg))]">
      <tr className="divide-x divide-[rgb(var(--border))]">{children}</tr>
    </thead>
  )
}

export function TH({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))] ${className}`}>{children}</th>
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody className="bg-[rgb(var(--card-bg))] divide-y divide-[rgb(var(--border))]">{children}</tbody>
}

export function TR({ children }: { children: ReactNode }) {
  return <tr className="divide-x divide-[rgb(var(--border))] hover:bg-[rgba(var(--fg),0.04)]">{children}</tr>
}

export function TD({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <td className={`px-4 py-3 text-sm text-[rgb(var(--fg))] ${className}`}>{children}</td>
}
