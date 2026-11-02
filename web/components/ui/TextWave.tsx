import type { CSSProperties } from "react"
import styles from "./TextWave.module.css"

type Props = {
  text: string
  /** Resting letter color ("defaultColor" in Framer). */
  color?: string
  /** Color of the band that sweeps across the letters ("waveInColor"). */
  waveColor?: string
  /** Seconds for one sweep. */
  duration?: number
  className?: string
  style?: CSSProperties
}

// Stand-in for the "Text Wave" marketplace component: a highlight sweeps left to right across the text, on loop.
export function TextWave({ text, color = "var(--dark-40)", waveColor = "var(--dark)", duration = 2, className = "", style }: Props) {
  return (
    <p
      className={`${styles.wave} ${className}`}
      style={{ ...style, "--wave-base": color, "--wave-hi": waveColor, "--wave-duration": `${duration}s` } as CSSProperties}
    >
      {text}
    </p>
  )
}
