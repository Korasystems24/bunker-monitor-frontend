import type { ReactNode } from 'react'

interface CardProps {
  title?: string
  children: ReactNode
  className?: string
  headerRight?: ReactNode
}

export function Card({ title, children, className = '', headerRight }: CardProps) {
  return (
    <div className={`rounded-lg border border-surface-3 bg-surface-1 ${className}`}>
      {title && (
        <div className="flex items-center justify-between border-b border-surface-3 px-4 py-2.5">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            {title}
          </h2>
          {headerRight}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  )
}
