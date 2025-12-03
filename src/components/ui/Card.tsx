import { ReactNode } from 'react'
import classNames from 'classnames'

export default function Card({ title, children, className }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <div className={classNames("bg-white rounded-lg border border-gray-200 shadow-sm", className)}>
      {title && <div className="px-4 py-2 border-b border-gray-200 font-medium">{title}</div>}
      <div className="p-4">{children}</div>
    </div>
  )
}
