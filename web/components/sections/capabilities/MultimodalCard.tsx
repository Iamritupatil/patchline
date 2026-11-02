"use client"

import { useEffect, useRef, useState, type CSSProperties } from "react"
import type { LucideIcon } from "lucide-react"
import { AlignLeft, Compass, FileText, MessageCircle, Music, SquarePen, Video } from "lucide-react"
import styles from "./MultimodalCard.module.css"

type Chip = { label: string; icon: LucideIcon; stroke: string }

// "Components/Multimodal card": two ticker rows of chips (50px/s, second row reversed).
const ROW_1: Chip[] = [
  { label: "Errors", icon: FileText, stroke: "rgb(237, 149, 17)" },
  { label: "Logs", icon: Music, stroke: "rgb(230, 58, 28)" },
  { label: "Webhooks", icon: Video, stroke: "rgb(179, 28, 230)" },
  { label: "Web apps", icon: Compass, stroke: "rgb(28, 58, 230)" },
]
const ROW_2: Chip[] = [
  { label: "Stack traces", icon: SquarePen, stroke: "rgb(20, 195, 204)" },
  { label: "Deploys", icon: AlignLeft, stroke: "rgb(42, 204, 20)" },
  { label: "APIs", icon: MessageCircle, stroke: "rgb(2, 196, 183)" },
]

const VELOCITY = 50 // px per second
const GAP = 16

function TickerRow({ chips, reverse = false }: { chips: Chip[]; reverse?: boolean }) {
  const groupRef = useRef<HTMLDivElement>(null)
  const [shift, setShift] = useState(0)

  useEffect(() => {
    const group = groupRef.current
    if (!group) return
    const measure = () => setShift(group.offsetWidth + GAP)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(group)
    return () => ro.disconnect()
  }, [])

  const style = { "--shift": `${shift}px`, "--duration": `${shift / VELOCITY}s` } as CSSProperties
  const trackClass = [styles.track, shift > 0 ? styles.running : "", reverse ? styles.reverse : ""].join(" ")

  return (
    <div className={styles.row}>
      <div className={trackClass} style={style}>
        {[0, 1, 2].map((copy) => (
          <div key={copy} ref={copy === 0 ? groupRef : undefined} className={styles.group} aria-hidden={copy > 0 || undefined}>
            {chips.map(({ label, icon: Icon, stroke }) => (
              <div key={label} className={styles.chip}>
                <Icon size={20} color={stroke} strokeWidth={2} aria-hidden className={styles.icon} />
                <p className="t-body2">{label}</p>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export function MultimodalCard() {
  return (
    <div className={styles.card}>
      <div className={styles.rows}>
        <TickerRow chips={ROW_1} />
        <TickerRow chips={ROW_2} reverse />
      </div>
    </div>
  )
}
