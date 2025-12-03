import { ReactNode } from 'react'

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-auto border border-gray-200 rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">{children}</table>
    </div>
  )
}

export function THead({ children }: { children: ReactNode }) {
  return (
    <thead className="bg-gray-50">
      <tr className="divide-x divide-gray-200">{children}</tr>
    </thead>
  )
}

export function TH({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <th className={`px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 ${className}`}>{children}</th>
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody className="bg-white divide-y divide-gray-200">{children}</tbody>
}

export function TR({ children }: { children: ReactNode }) {
  return <tr className="divide-x divide-gray-200 hover:bg-gray-50">{children}</tr>
}

export function TD({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <td className={`px-4 py-2 text-sm text-gray-800 ${className}`}>{children}</td>
}
