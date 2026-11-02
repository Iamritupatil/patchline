"use client"

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react"
import styles from "./Ticker.module.css"

type Props = {
  children: ReactNode
  /** Pixels per second (Framer tickerEffect `velocity`). */
  velocity: number
  /** Gap between items, also used between the original and the copy. */
  gap: number
  className?: string
}

// Framer "tickerEffect" on a vertical stack: the children scroll upward forever at a constant speed.
// The list is rendered twice and the track moves by exactly one copy (+ gap), so the loop is seamless.
export function Ticker({ children, velocity, gap, className = "" }: Props) {
  const groupRef = useRef<HTMLDivElement>(null)
  const [distance, setDistance] = useState(0)

  useEffect(() => {
    const group = groupRef.current
    if (!group) return
    const measure = () => setDistance(group.getBoundingClientRect().height + gap)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(group)
    return () => ro.disconnect()
  }, [gap])

  const vars = {
    "--ticker-gap": `${gap}px`,
    "--ticker-distance": `${distance}px`,
    "--ticker-duration": `${distance > 0 ? distance / velocity : 0}s`,
  } as CSSProperties

  return (
    <div className={`${styles.ticker} ${className}`} style={vars}>
      <div className={`${styles.track} ${distance > 0 ? styles.running : ""}`}>
        <div ref={groupRef} className={styles.group}>
          {children}
        </div>
        <div className={styles.group} aria-hidden>
          {children}
        </div>
      </div>
    </div>
  )
}
