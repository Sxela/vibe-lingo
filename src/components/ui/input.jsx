import React from 'react'

export function Input({ className = '', ...props }) {
  return <input className={["h-10 px-3 rounded-md border w-full", className].join(' ')} {...props} />
} 