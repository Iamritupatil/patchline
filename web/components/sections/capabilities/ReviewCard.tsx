"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useInView } from "framer-motion"
import { Check } from "lucide-react"
import { RippleLoader } from "@/components/ui/Loaders"
import { TextWave } from "@/components/ui/TextWave"
import styles from "./ReviewCard.module.css"

// "Components/Capability card" (qp1dFT5rB). Variants 1→6:
// 1 prompt card only · 2 "Checking guardrails" fades in (on scroll into view) · 3 Fix A / Fix B rows appear ·
// 4 selector highlights Fix A · 5 selector slides to Fix B · 6 green check on Fix B. Each step after 1s.
const spring = { type: "spring" as const, duration: 0.4, bounce: 0.2 }

export function ReviewCard() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.5 })
  const [step, setStep] = useState(1)

  useEffect(() => {
    if (inView && step === 1) setStep(2)
  }, [inView, step])

  useEffect(() => {
    if (step < 2 || step >= 6) return
    const t = setTimeout(() => setStep((s) => s + 1), 1000)
    return () => clearTimeout(t)
  }, [step])

  return (
    <div ref={ref} className={styles.card}>
      <motion.div
        layout
        transition={spring}
        className={styles.overall}
        style={{ top: step === 2 ? "43.67%" : "50.13%" }}
      >
        <motion.div layout="position" transition={spring} className={styles.promptCard}>
          <RippleLoader color="rgb(49, 91, 232)" size={24} />
          <TextWave text="Reviewing patch" color="var(--dark-40)" waveColor="var(--dark)" />
        </motion.div>

        <motion.div
          layout="position"
          transition={spring}
          initial={false}
          animate={{ opacity: step >= 2 ? 1 : 0 }}
          className={styles.guardrails}
        >
          <TextWave text="Checking guardrails" color="var(--dark-40)" waveColor="var(--dark)" />
        </motion.div>

        {step >= 3 && (
          <motion.div
            layout="position"
            className={styles.modelContainer}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={spring}
          >
            <div className={styles.modelInfo}>
              <img src="/images/8KaKKxU7M28Rzb4GcWcA3KaCnQ4.png" alt="" className={styles.avatar} />
              <p className="t-body2">Fix A</p>
            </div>
            <div className={styles.modelInfo}>
              <img src="/images/D78PPxXxhqJnQlCBn2cmf5ueuQ.png" alt="" className={styles.avatar} />
              <p className="t-body2">Fix B</p>
              <span className={styles.checkSlot}>
                <motion.span
                  className={styles.check}
                  initial={false}
                  animate={{ opacity: step >= 6 ? 1 : 0, scale: step >= 5 ? 1 : 0 }}
                  transition={spring}
                >
                  <Check size={24} color="rgb(2, 194, 59)" strokeWidth={2} aria-label="Selected" />
                </motion.span>
              </span>
            </div>
            <motion.div
              className={styles.selector}
              initial={false}
              animate={{
                opacity: step >= 4 ? 1 : 0,
                scale: step >= 4 ? 1 : 0,
                top: step >= 5 ? 50 : 0,
              }}
              transition={spring}
              aria-hidden
            />
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
