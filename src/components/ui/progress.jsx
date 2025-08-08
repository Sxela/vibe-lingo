import React from 'react'

export function Progress({ value = 0, className = '' }) {
  const clamped = Math.max(0, Math.min(100, Number(value) || 0))
  return (
    <div className={["h-2 w-full bg-muted rounded", className].join(' ')}>
      <div className="h-full bg-primary rounded" style={{ width: `${clamped}%` }} />
    </div>
  )
} 