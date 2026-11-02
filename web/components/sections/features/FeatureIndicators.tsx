"use client"

import { useEffect, useState } from "react"
import styles from "./FeatureIndicators.module.css"

type Item = { number: string; title: string; target: string }

// Sticky "Feature indicator container" with four "Components/Feature indicator" (C11k882cT) instances.
// Framer: scrollVariantEffect "onScrollTarget" (threshold 0.5, replay) — indicator N is Active while card N is the
// current scroll section and Inactive otherwise. The current section is the last card whose top has crossed half the
// viewport; the cards are sticky, so once stuck they stay "crossed" until the page scrolls back above them.
export function FeatureIndicators({ items }: { items: Item[] }) {
  const [active, setActive] = useState(-1)

  useEffect(() => {
    const targets = items.map((item) => document.getElementById(item.target))
    let frame = 0
    const update = () => {
      frame = 0
      const line = window.innerHeight * 0.5
      let current = -1
      targets.forEach((el, i) => {
        if (el && el.getBoundingClientRect().top <= line) current = i
      })
      setActive(current)
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener("scroll", schedule, { passive: true })
    window.addEventListener("resize", schedule)
    return () => {
      window.removeEventListener("scroll", schedule)
      window.removeEventListener("resize", schedule)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [items])

  return (
    <div className={styles.container}>
      {items.map((item, i) => (
        <div key={item.number} className={`${styles.indicator} ${i === active ? styles.active : ""}`}>
          <span className={styles.numberContainer}>
            <span className={`t-h6 ${styles.number}`}>{item.number}</span>
          </span>
          <span className={`t-h6 ${styles.title}`}>{item.title}</span>
        </div>
      ))}
    </div>
  )
}
