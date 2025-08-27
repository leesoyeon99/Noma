import React, { createContext, useContext } from 'react'

const TabsCtx = createContext({ value: undefined, onValueChange: () => {} })

export function Tabs({ value, onValueChange, children, className }){
  return <div className={className}><TabsCtx.Provider value={{ value, onValueChange }}>{children}</TabsCtx.Provider></div>
}

export function TabsList({ children, className }){
  const cls = className ? className : 'tabs'
  return <div className={cls}>{children}</div>
}

export function TabsTrigger({ value: selfVal, children }){
  const ctx = useContext(TabsCtx)
  const isActive = ctx.value === selfVal
  return (
    <button 
      className={"tab-btn" + (isActive ? ' active' : '')}
      onClick={() => ctx.onValueChange && ctx.onValueChange(selfVal)}
    >
      {children}
    </button>
  )
}

export const TabsContent = ({ value: selfVal, children, className }) => {
  const ctx = useContext(TabsCtx)
  if (ctx.value !== selfVal) return null
  return <div className={className}>{children}</div>
}
