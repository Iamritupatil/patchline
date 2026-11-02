"use client"

import { motion, useInView } from "framer-motion"
import { useRef, type ReactNode } from "react"
import styles from "./Tag.module.css"

type Props = { title: string; icon: ReactNode; color: string; border: string }

// Starts as an icon-only circle and expands to show the title when half of it scrolls into view
// (spring, 1s, 0.3s delay), like the Tag's Inactive -> Active scroll variant in Framer.
export function TagMotion({ title, icon, color, border }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const active = useInView(ref, { once: true, amount: 0.5 })
  const spring = { type: "spring" as const, duration: 1, bounce: 0.2, delay: 0.3 }

  return (
    <motion.div
      ref={ref}
      layout
      transition={spring}
      className={styles.tag}
      style={{ border: `1px solid ${border}`, color, borderRadius: 1000 }}
      animate={{ padding: active ? "6px 12px" : "8px" }}
    >
      <motion.span layout="position" transition={spring} className={styles.icon}>
        {icon}
      </motion.span>
      {active && (
        <motion.span
          layout="position"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={spring}
          className={`t-body3 ${styles.title}`}
          style={{ color }}
        >
          {title}
        </motion.span>
      )}
    </motion.div>
  )
}
