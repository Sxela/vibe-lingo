import React from 'react'

export function Switch({ checked, onCheckedChange, className = '', id }) {
  return (
    <input
      id={id}
      type="checkbox"
      role="switch"
      className={["h-5 w-10 appearance-none rounded-full border relative cursor-pointer", className].join(' ')}
      checked={!!checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
    />
  )
} 