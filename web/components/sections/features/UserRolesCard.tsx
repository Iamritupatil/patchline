"use client"

import { ChevronDown } from "lucide-react"
import { motion, useInView } from "framer-motion"
import { useEffect, useRef, useState } from "react"
import styles from "./UserRolesCard.module.css"

// "Components/User roles card" (ezA3Bb8pm), instance with avatarVisible = false.
// Variant flow, as wired in Framer:
//   "1" --(50% in view, once)--> "2" --(onAppear +1.5s)--> "3" --(onAppear +1.5s)--> "4"
// "2" moves the "You" cursor onto the card, "3" opens the permission menu on the Owner row and highlights it,
// "4" closes the menu and moves the cursor off again. Variant changes use spring 2s / bounce 0.2.
type Variant = 1 | 2 | 3 | 4

const CURSOR: Record<Variant, { right: number; bottom: number; zIndex?: number }> = {
  1: { right: -100, bottom: -100 },
  2: { right: -1, bottom: 219 },
  3: { right: -13, bottom: 149, zIndex: 2 },
  4: { right: -100, bottom: -100 },
}

const SPRING = { type: "spring" as const, duration: 2, bounce: 0.2 }

const ROWS = [
  { name: "Owner", phone: "+1 ••• ••• 4821", permission: "Can ship" },
  { name: "Co-founder", phone: "+1 ••• ••• 1093", permission: "Can ship" },
  { name: "Contractor", phone: "+44 •••• ••• 552", permission: "Can view" },
  { name: "Unknown number", phone: "+1 ••• ••• 7710", permission: "No access" },
]

export function UserRolesCard({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.5 })
  const [variant, setVariant] = useState<Variant>(1)

  useEffect(() => {
    if (inView && variant === 1) setVariant(2)
  }, [inView, variant])

  useEffect(() => {
    if (variant !== 2 && variant !== 3) return
    const next = (variant + 1) as Variant
    const timer = window.setTimeout(() => setVariant(next), 1500)
    return () => window.clearTimeout(timer)
  }, [variant])

  const cursor = CURSOR[variant]

  return (
    <div ref={ref} className={`${styles.card} ${className}`}>
      {/* "Folder Header" */}
      <div className={styles.folderHeader}>
        <div className={styles.folderIcon} aria-hidden />
        <div className={styles.folderTitleGroup}>
          <h6 className={`t-h6 ${styles.text}`}>checkout-app</h6>
          <p className={`t-body3 ${styles.text}`}>3 verified phones</p>
        </div>
      </div>

      {/* "Invite Controls" */}
      <div className={styles.inviteControls}>
        <h6 className={`t-h6 ${styles.text}`}>Who can ship fixes</h6>
      </div>

      {/* "Access Section" > "Access List" */}
      <div className={styles.accessSection}>
        <div className={styles.accessList}>
          {ROWS.map((row, i) => (
            <div key={row.name} className={styles.accessRow}>
              <div className={styles.identity}>
                <div className={styles.details}>
                  <h6 className={`t-h6 ${styles.text}`}>{row.name}</h6>
                  <p className={`t-body3 ${styles.text}`}>{row.phone}</p>
                </div>
              </div>
              <motion.div
                className={styles.permissionSelect}
                initial={false}
                animate={{
                  boxShadow:
                    i === 0 && variant === 3
                      ? "inset 0 0 0 1px rgb(1, 43, 255)"
                      : "inset 0 0 0 1px rgba(0, 0, 0, 0.2)",
                }}
                transition={SPRING}
              >
                <p className={`t-body3 ${styles.permissionLabel}`}>{row.permission}</p>
                <ChevronDown className={styles.chevron} size={16} strokeWidth={2} aria-hidden />
              </motion.div>
            </div>
          ))}
        </div>
      </div>

      {/* "Option container": the open permission menu (variant 3 only) */}
      {variant === 3 && (
        <div className={styles.options}>
          <p className={`t-body3 ${styles.option}`}>Can view</p>
          <p className={`t-body3 ${styles.option}`}>Can ship</p>
          <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0.2, delay: 0.5 }}
          />
          <p className={`t-body3 ${styles.option}`}>No access</p>
        </div>
      )}

      {/* "Cursor" with the "You" comment bubble */}
      <motion.div
        className={styles.cursor}
        initial={false}
        animate={{ right: cursor.right, bottom: cursor.bottom }}
        transition={SPRING}
        style={{ zIndex: cursor.zIndex ?? "auto" }}
        aria-hidden
      >
        <svg className={styles.cursorIcon} width="26" height="26" viewBox="0 0 26 26" fill="none">
          <path
            d="M4 3.2 21.6 10.6c.8.3.7 1.4-.1 1.6l-7.4 2.1-3.1 7c-.3.8-1.4.7-1.6-.1L4 3.2Z"
            fill="rgb(21, 111, 238)"
            stroke="rgb(255, 255, 255)"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
        <div className={styles.comment}>
          <p className={`t-body2 ${styles.commentText}`}>You</p>
        </div>
      </motion.div>
    </div>
  )
}
