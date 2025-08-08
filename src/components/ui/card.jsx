import React from 'react'

export function Card({ className = '', ...props }) {
  return <div className={["rounded-xl border bg-card text-card-foreground shadow", className].join(' ')} {...props} />
}

export function CardHeader({ className = '', ...props }) {
  return <div className={["p-4 border-b", className].join(' ')} {...props} />
}

export function CardTitle({ className = '', ...props }) {
  return <h3 className={["font-semibold leading-none tracking-tight", className].join(' ')} {...props} />
}

export function CardContent({ className = '', ...props }) {
  return <div className={["p-4", className].join(' ')} {...props} />
} 