"use client"

import { motion, type Transition } from "framer-motion"
import { Fragment, useEffect, useRef, useState, type ReactNode } from "react"
import styles from "./Reveal.module.css"

const textEase: [number, number, number, number] = [0.27, 0, 0.51, 1]

/**
 * Framer text effect with tokenization "line", trigger "onMount": each rendered line fades up from
 * opacity 0 / y 10px / blur 5px, staggered by the transition delay (0.05s per line).
 * Words are measured after layout and grouped into lines by their offsetTop.
 */
export function RevealHeading({ text, className = "" }: { text: string; className?: string }) {
  const ref = useRef<HTMLHeadingElement>(null)
  const [lines, setLines] = useState<number[] | null>(null)
  const words = text.split(" ")

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let line = -1
    let lastTop = Number.NEGATIVE_INFINITY
    const out: number[] = []
    el.querySelectorAll<HTMLElement>("[data-word]").forEach((w) => {
      if (w.offsetTop > lastTop + 2) {
        line += 1
        lastTop = w.offsetTop
      }
      out.push(line)
    })
    setLines(out)
  }, [text])

  return (
    <h1 ref={ref} className={className}>
      {words.map((word, i) => (
        <Fragment key={i}>
          <motion.span
            data-word
            className={styles.word}
            initial={{ opacity: 0, y: 10, filter: "blur(5px)" }}
            animate={lines ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined}
            transition={{ ease: textEase, duration: 0.5, delay: (lines?.[i] ?? 0) * 0.05 }}
          >
            {word}
          </motion.span>
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </h1>
  )
}

/** Framer text effect with tokenization "element": the whole paragraph fades up (y 10px, blur 2px) after 0.5s. */
export function RevealParagraph({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <motion.p
      className={className}
      initial={{ opacity: 0, y: 10, filter: "blur(2px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ ease: textEase, duration: 0.5, delay: 0.5 }}
    >
      {children}
    </motion.p>
  )
}

/** Framer appear effect (trigger "onMount", enter opacity 0) on a frame. */
export function Appear({
  children,
  className = "",
  transition,
}: {
  children: ReactNode
  className?: string
  transition: Transition
}) {
  return (
    <motion.div className={className} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={transition}>
      {children}
    </motion.div>
  )
}
