import React from 'react'

export function Tabs({ value, onValueChange, children }){
  return <div>{children}</div>
}

export function TabsList({ value, onValueChange, children }){
  return <div className="tabs">{children}</div>
}

export function TabsTrigger({ value: selfVal, onValueChange, children }){
  return (
    <button 
      className="tab-btn" 
      onClick={() => onValueChange(selfVal)}
    >
      {children}
    </button>
  )
}

export const TabsContent = ({children}) => <div>{children}</div>
