import type { CSSProperties } from "react"
import styles from "./Loaders.module.css"

// Stand-in for the "RippleLoader" marketplace component: a 3x3 grid of 6px dots (1px apart)
// whose opacity ripples out from the center every 1.5s.
export function RippleLoader({ color = "rgb(49, 91, 232)", size = 24 }: { color?: string; size?: number }) {
  // Ring distance from the center cell drives the delay (0.1s per ring): edges ring 1, corners ring 2.
  const rings = [2, 1, 2, 1, 0, 1, 2, 1, 2]
  return (
    <span className={styles.ripple} style={{ width: size, height: size } as CSSProperties} aria-hidden>
      {rings.map((ring, i) => (
        <span key={i} className={styles.cell} style={{ background: color, animationDelay: `${ring * 0.1}s` }} />
      ))}
    </span>
  )
}

// Stand-in for the "ArcSpinner" marketplace component: 24px ring with a 10% track and a spinning arc.
export function ArcSpinner({ color = "var(--primary)", size = 24, stroke = 2 }: { color?: string; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <svg className={styles.arc} width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Loading">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeOpacity={0.1} strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${c * 0.25} ${c}`}
      />
    </svg>
  )
}
