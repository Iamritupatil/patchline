"use client"

import { motion } from "framer-motion"
import { Menu, X } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/Button"
import { navActions, navLinks } from "./links"
import styles from "../Nav.module.css"

// "Phone Closed" is 60px tall (8 + 44 + 8); "Phone Open" has min-height 100vh.
const CLOSED_HEIGHT = 60
// Each variant's own transition is used when switching to it.
const openTransition = { type: "spring" as const, duration: 0.35, bounce: 0.25 }
const closeTransition = { ease: [0.44, 0, 0.56, 1] as [number, number, number, number], duration: 0.35 }

// Tablet/phone variants of the "Navigation bar": tapping the trigger toggles the full-height menu,
// tapping a link closes it again.
export function MobileNav() {
  const [open, setOpen] = useState(false)
  const [viewport, setViewport] = useState(0)

  useEffect(() => {
    const update = () => setViewport(window.innerHeight)
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])

  const close = () => setOpen(false)

  return (
    <motion.nav
      className={styles.mobile}
      aria-label="Main"
      initial={false}
      animate={{ height: open ? Math.max(viewport, CLOSED_HEIGHT) : CLOSED_HEIGHT }}
      transition={open ? openTransition : closeTransition}
    >
      <div className={styles.mobileTop}>
        <a href="/#hero" className={styles.mobileLogo} aria-label="Patchline home" />
        <button
          type="button"
          className={styles.menuTrigger}
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? (
            <X className={styles.menuIcon} size={20} strokeWidth={2} aria-hidden />
          ) : (
            <Menu className={styles.menuIcon} size={20} strokeWidth={2} aria-hidden />
          )}
        </button>
      </div>
      <div className={styles.mobileLinks} inert={!open}>
        {navLinks.map((l) => (
          <a key={l.href} href={l.href} className={`t-body2 link-dark ${styles.mobileLink}`} onClick={close}>
            {l.label}
          </a>
        ))}
      </div>
      <div className={styles.mobileActions} inert={!open}>
        <Button {...navActions.secondary} variant="secondary" size="small" icon={false} />
        <Button {...navActions.primary} variant="primary" size="small" icon={false} />
      </div>
    </motion.nav>
  )
}
