import React, { useEffect, useRef, useState } from 'react'

function useRightGutterWidth(containerRef) {
  const [gutter, setGutter] = useState(0)

  useEffect(() => {
    const calc = () => {
      const el = containerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const vw = window.innerWidth
      const g = Math.max(0, Math.round(vw - rect.right))
      setGutter(g)
    }

    calc()
    window.addEventListener('resize', calc, { passive: true })
    window.addEventListener('scroll', calc, { passive: true })
    let ro
    if (containerRef.current && 'ResizeObserver' in window) {
      ro = new ResizeObserver(calc)
      ro.observe(containerRef.current)
    }
    return () => {
      window.removeEventListener('resize', calc)
      window.removeEventListener('scroll', calc)
      if (ro) ro.disconnect()
    }
  }, [])

  return gutter
}

export default function AppLayout({ children, className }){
  const ref = useRef(null)
  const gutter = useRightGutterWidth(ref)
  return (
    <div
      ref={ref}
      className={`w-full flex-1 ${className || ''}`}
      style={{ marginRight: gutter ? `-${gutter}px` : undefined }}
    >
      {children}
    </div>
  )
}


