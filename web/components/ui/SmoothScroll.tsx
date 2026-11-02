"use client"

import Lenis from "lenis"
import "lenis/dist/lenis.css"
import { useEffect } from "react"

// The Framer layout's "Lenis" component: smooth, vertical, intensity 18 (= 1.8s eased scroll).
// Anchor links (#features, #how-it-works…) glide too. Skipped when the visitor prefers reduced motion.
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const lenis = new Lenis({ duration: 1.8, orientation: "vertical", anchors: true, autoRaf: true })
    return () => lenis.destroy()
  }, [])
  return null
}
