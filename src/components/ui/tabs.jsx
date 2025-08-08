import React, { useState } from 'react'

export function Tabs({ defaultValue, value: controlledValue, onValueChange, className = '', children }) {
  const [uncontrolled, setUncontrolled] = useState(defaultValue)
  const value = controlledValue ?? uncontrolled
  const setValue = (v) => {
    setUncontrolled(v)
    onValueChange?.(v)
  }
  return <div className={className} data-tabs-value={value}>{React.Children.map(children, child => React.cloneElement(child, { __tabsValue: value, __setTabsValue: setValue }))}</div>
}

export function TabsList({ className = '', __tabsValue, __setTabsValue, children }) {
  return <div className={["inline-grid gap-2", className].join(' ')}>{React.Children.map(children, child => React.cloneElement(child, { __tabsValue, __setTabsValue }))}</div>
}

export function TabsTrigger({ value, __tabsValue, __setTabsValue, children }) {
  const active = __tabsValue === value
  return (
    <button className={["px-3 py-2 rounded-md border", active ? 'bg-accent' : ''].join(' ')} onClick={() => __setTabsValue(value)}>
      {children}
    </button>
  )
}

export function TabsContent({ value, __tabsValue, className = '', children }) {
  if (__tabsValue !== value) return null
  return <div className={className}>{children}</div>
} 