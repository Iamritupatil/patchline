"use client"

import { AnimatePresence, motion } from "framer-motion"
import { Minus, Plus } from "lucide-react"
import { useId, useState } from "react"
import styles from "./FaqList.module.css"

export type FaqItem = { question: string; answer: string }

// Framer variant transition: "spring-duration 0.4s 0.2 0s"
const spring = { type: "spring" as const, duration: 0.4, bounce: 0.2 }

// "FAQs card container" (dGKghXMEe): variants 1–8 each expand one card; clicking a card switches to its variant.
export function FaqList({ items }: { items: FaqItem[] }) {
  const [active, setActive] = useState(0)
  const baseId = useId()

  return (
    <div className={styles.container}>
      {items.map((item, i) => (
        <FaqCard
          key={item.question}
          id={`${baseId}-${i}`}
          item={item}
          expanded={i === active}
          onSelect={() => setActive(i)}
        />
      ))}
    </div>
  )
}

// "FAQ card" (eWWSXuZM8): Expanded / Collapsed / Collapsed-hover variants.
function FaqCard({
  id,
  item,
  expanded,
  onSelect,
}: {
  id: string
  item: FaqItem
  expanded: boolean
  onSelect: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const hover = hovered && !expanded

  return (
    <div className={styles.card} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <motion.button
        type="button"
        className={styles.outerContainer}
        aria-expanded={expanded}
        aria-controls={expanded ? id : undefined}
        onClick={onSelect}
        initial={false}
        animate={{ scale: hover ? 0.98 : 1 }}
        transition={spring}
      >
        <span className={styles.textContent}>
          <span className={`t-h6 ${styles.question}`}>{item.question}</span>
          <AnimatePresence initial={false}>
            {expanded && (
              <motion.span
                key="answer"
                id={id}
                className={styles.answerWrap}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={spring}
              >
                <span className={`t-body3 ${styles.answer}`}>{item.answer}</span>
              </motion.span>
            )}
          </AnimatePresence>
        </span>
        <motion.span
          className={styles.iconContainer}
          initial={false}
          animate={{ color: hover ? "rgba(0, 0, 0, 1)" : "rgba(0, 0, 0, 0.6)" }}
          transition={spring}
          aria-hidden
        >
          {expanded ? <Minus size={24} /> : <Plus size={24} />}
        </motion.span>
      </motion.button>
      <motion.div
        className={styles.whiteOverlay}
        initial={false}
        animate={{ opacity: expanded ? 1 : 0 }}
        transition={spring}
        aria-hidden
      />
    </div>
  )
}
