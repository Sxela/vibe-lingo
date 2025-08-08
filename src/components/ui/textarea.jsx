import React from 'react'

export function Textarea({ className = '', ...props }) {
  return <textarea className={["min-h-24 px-3 py-2 rounded-md border w-full", className].join(' ')} {...props} />
} 