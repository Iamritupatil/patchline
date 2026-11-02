"use client"

import { AnimatePresence, motion, type Transition } from "framer-motion"
import { ArrowUp, Check, Mic, Paperclip } from "lucide-react"
import { useEffect, useState } from "react"
import { RippleLoader } from "@/components/ui/Loaders"
import { TextWave } from "@/components/ui/TextWave"
import styles from "./PromptCard.module.css"

type Step = 1 | 2 | 3 | 4 | 5

// onAppear → SET_VARIANT delays: 1 →1s→ 2 →1.5s→ 3 →1.5s→ 4 →1s→ 5 →4s→ 1 (loops).
const HOLD_MS: Record<Step, number> = { 1: 1000, 2: 1500, 3: 1500, 4: 1000, 5: 4000 }
const NEXT: Record<Step, Step> = { 1: 2, 2: 3, 3: 4, 4: 5, 5: 1 }

// Variant transition "spring-physics 400 60 1 0s".
const variantSpring: Transition = { type: "spring", stiffness: 400, damping: 60, mass: 1 }

// Appear effect "spring-duration 1s 0.2 <delay>" from opacity 0 / scale 0, plus the variant spring for layout moves.
const pop = (delay: number) => ({
  initial: { opacity: 0, scale: 0 },
  animate: { opacity: 1, scale: 1 },
  transition: { type: "spring" as const, duration: 1, bounce: 0.2, delay, layout: variantSpring },
})

// Layers that are only visible in some variants fade with the variant spring.
const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: variantSpring,
}

const chips = [
  { text: "A: open the small fix", delay: 0.2 },
  { text: "B: open the robust fix", delay: 0.4 },
  { text: "Show me the diff", delay: 0.6 },
]

export function PromptCard() {
  const [step, setStep] = useState<Step>(1)

  useEffect(() => {
    const t = setTimeout(() => setStep((s) => NEXT[s]), HOLD_MS[step])
    return () => clearTimeout(t)
  }, [step])

  const thinking = step <= 3
  const replied = step >= 4

  return (
    <div className={styles.card} aria-hidden>
      <div className={`${styles.container} ${step === 5 ? styles.containerEnd : ""}`}>
        {/* wDPQnJRot: user message, visible in every variant */}
        <motion.div layout="position" className={styles.bubble} {...pop(0.2)}>
          <p className={`t-body2 ${styles.bubbleText}`}>Checkout is broken. Fix it, keep it small.</p>
        </motion.div>

        <AnimatePresence mode="popLayout" initial={false}>
          {replied && (
            <motion.div key="reply" layout="position" className={styles.replyRow} exit={{ opacity: 0 }} transition={variantSpring}>
              <motion.div className={styles.bubble} {...pop(0.2)}>
                <p className={`t-body2 ${styles.bubbleText}`}>
                  Found it: the cart total is null after the 2:14 PM deploy. Fix A is a 2-line guard. Fix B adds a retry. Tests ✅ on both.
                </p>
              </motion.div>
            </motion.div>
          )}

          {thinking && (
            <motion.div key="thinking" layout="position" className={styles.thinkingRow} {...fade}>
              <AnimatePresence initial={false}>
                {step >= 2 && (
                  <motion.span key="ripple" className={styles.ripple} {...fade}>
                    <RippleLoader size={24} color="rgb(49, 91, 232)" />
                  </motion.span>
                )}
              </AnimatePresence>
              <motion.div
                layout="position"
                className={styles.waveWrap}
                initial={false}
                animate={{ opacity: step === 1 ? 0 : 1 }}
                transition={variantSpring}
              >
                <TextWave
                  text={step === 3 ? "Diagnosis complete" : "Reading the stack trace…"}
                  color="var(--dark-40)"
                  waveColor="var(--dark)"
                />
              </motion.div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div key="suggestions" layout="position" className={styles.suggestions} exit={{ opacity: 0 }} transition={variantSpring}>
              <div className={styles.chips}>
                {chips.map((c) => (
                  <motion.div key={c.text} className={styles.chip} {...pop(c.delay)}>
                    <p className={`t-body2 ${styles.chipText}`}>{c.text}</p>
                  </motion.div>
                ))}
              </div>
              <motion.div className={styles.suggestionsLabelRow} {...fade}>
                <p className={`t-body2 ${styles.dim}`}>Suggestions</p>
              </motion.div>
            </motion.div>
          )}

          {replied && (
            <motion.div key="status" layout="position" className={styles.statusRow} {...fade}>
              <Check className={styles.checkIcon} size={16} strokeWidth={2} aria-hidden />
              <p className={`t-body2 ${styles.dim}`}>Diagnosis complete</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* d4QEM08j1: input bar */}
      <div className={styles.promptBar}>
        <p className={`t-body2 ${styles.placeholder}`}>Reply A, B, or ship…</p>
        <div className={styles.barContainer}>
          <div className={styles.barRight}>
            <div className={styles.barLeft}>
              <Paperclip className={styles.barIcon} size={16} strokeWidth={2} aria-hidden />
            </div>
            <Mic className={styles.barIcon} size={16} strokeWidth={2} aria-hidden />
            <span className={styles.runAgent}>
              <ArrowUp className={styles.runIcon} size={14} strokeWidth={2} aria-hidden />
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
