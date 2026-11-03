"use client"

import { motion } from "framer-motion"
import {
  ArrowUp,
  BatteryFull,
  ChevronRight,
  CircleCheck,
  GitPullRequest,
  Plus,
  Rocket,
  RotateCcw,
  Signal,
  TriangleAlert,
  Wifi,
  Zap,
} from "lucide-react"
import { Fragment, useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/Button"
import phone from "../OnYourPhone.module.css"
import styles from "./Demo.module.css"

// The whole loop runs in the visitor's browser, so every visitor gets their own broken copy:
// one person's fix never fixes it for the next person.
type Phase = "working" | "broken" | "choosing" | "pr" | "deploying" | "fixed"
type Variant = "A" | "B"
type Message = { id: number; from: "them" | "me"; lines: string[] }

const SUBTOTAL = 49
const COUPON_OFF = 10

const steps: { label: string; phases: Phase[] }[] = [
  { label: "Click Apply", phases: ["working"] },
  { label: "Read the text", phases: ["broken"] },
  { label: "Reply A or B", phases: ["choosing"] },
  { label: "Reply ship", phases: ["pr"] },
  { label: "Fixed", phases: ["deploying", "fixed"] },
]

const fixes: Record<Variant, { pr: string; summary: string }> = {
  A: { pr: "PR #12 is open with fix A (1 file, +2 −1).", summary: "fix A" },
  B: { pr: "PR #12 is open with fix B (2 files, +11 −4).", summary: "fix B" },
}

const now = () => new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true })
const money = (n: number) => `$${n.toFixed(2)}`

export function Demo() {
  const [phase, setPhase] = useState<Phase>("working")
  const [variant, setVariant] = useState<Variant>("A")
  const [messages, setMessages] = useState<Message[]>([])
  const [typing, setTyping] = useState(false)
  const [applied, setApplied] = useState(false)
  const [draft, setDraft] = useState("")
  const [stamp, setStamp] = useState("")

  const timers = useRef<number[]>([])
  const nextId = useRef(0)
  const thread = useRef<HTMLDivElement>(null)
  const phoneRef = useRef<HTMLDivElement>(null)

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  useEffect(() => {
    thread.current?.scrollTo({ top: thread.current.scrollHeight, behavior: "smooth" })
  }, [messages, typing])

  const later = (ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms))
  }

  const push = (from: Message["from"], lines: string[]) =>
    setMessages((m) => [...m, { id: nextId.current++, from, lines }])

  // Patchline "types" for a moment, then the bubble lands.
  const say = (lines: string[], typingMs: number, then?: () => void) => {
    setTyping(true)
    later(typingMs, () => {
      setTyping(false)
      push("them", lines)
      then?.()
    })
  }

  const breakIt = () => {
    if (phase !== "working") return
    setPhase("broken")
    setStamp(`Today ${now()}`)
    // On stacked layouts the phone sits below the app, so bring it into view when the text arrives.
    if (window.matchMedia("(max-width: 1199.98px)").matches) {
      later(900, () => phoneRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }))
    }
    later(700, () =>
      say([`🔴 Lumen checkout is failing since ${now()}. A customer tried coupon SAVE10 and the page crashed.`], 1300, () =>
        later(500, () =>
          say(
            [
              "Cause: fixed-amount coupons have no percent, so the total becomes undefined (cart.ts:42).",
              "A · 2-line guard for amount-off coupons · tests ✅",
              "B · one coupon parser for both types + a test · tests ✅",
              "Reply A or B.",
            ],
            1800,
            () => setPhase("choosing"),
          ),
        ),
      ),
    )
  }

  const apply = () => {
    if (phase === "working") breakIt()
    else if (phase === "fixed") setApplied(true)
  }

  const reply = (raw: string) => {
    const text = raw.trim()
    if (!text || typing) return
    push("me", [text])
    setDraft("")
    const t = text.toLowerCase()
    const pick: Variant | null = /^a\b|small|smallest/.test(t) ? "A" : /^b\b|robust/.test(t) ? "B" : null

    if (phase === "choosing" && pick) {
      setVariant(pick)
      say([`${fixes[pick].pr} Nothing is merged yet. Reply ship to merge it.`], 1200, () => setPhase("pr"))
    } else if (phase === "pr" && /ship|merge|deploy/.test(t)) {
      setPhase("deploying")
      say(["Merged ✅ Your deploy is running."], 1000, () =>
        later(1200, () =>
          say([`Deployed ✅ Coupons work again. I'll text you if this comes back.`], 900, () => setPhase("fixed")),
        ),
      )
    } else if (phase === "pr") {
      say([`PR #12 with fix ${variant} is waiting. Reply ship to merge it.`], 800)
    } else if (phase === "choosing") {
      say(["Reply A for the smallest safe fix, or B for the more robust one."], 800)
    } else if (phase === "fixed" || phase === "deploying") {
      say(["All good. Checkout is healthy."], 800)
    } else if (phase === "working") {
      say(["Nothing is broken right now. Try Apply on the demo app."], 800)
    }
  }

  const reset = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    setPhase("working")
    setMessages([])
    setTyping(false)
    setApplied(false)
    setDraft("")
    setStamp("")
  }

  const crashed = phase !== "working" && phase !== "fixed"
  const chips: string[] = typing ? [] : phase === "choosing" ? ["A", "B"] : phase === "pr" ? ["ship"] : []
  const total = applied ? SUBTOTAL - COUPON_OFF : SUBTOTAL

  return (
    <div className={styles.demo}>
      <ol className={styles.steps}>
        {steps.map((s, i) => {
          const current = s.phases.includes(phase)
          const done = steps.findIndex((x) => x.phases.includes(phase)) > i
          return (
            <li
              key={s.label}
              className={`t-label ${styles.step} ${current ? styles.stepCurrent : ""} ${done ? styles.stepDone : ""}`}
            >
              <span className={styles.stepNumber}>{done ? "✓" : i + 1}</span>
              {s.label}
            </li>
          )
        })}
      </ol>

      <div className={styles.stage}>
        {/* The sample customer app: a tiny checkout with a real-looking bug. */}
        <div className={styles.browser}>
          <div className={styles.chrome}>
            <span className={styles.dot} />
            <span className={styles.dot} />
            <span className={styles.dot} />
            <span className={`t-label ${styles.url}`}>app.lumen.demo/checkout</span>
          </div>

          <div className={styles.app}>
            <div className={styles.appHeader}>
              <p className={`t-h6 ${styles.brand}`}>Lumen</p>
              <p className="t-label">Demo startup app</p>
            </div>

            <div className={styles.lines}>
              <div className={styles.line}>
                <span className="t-body3">Pro plan · monthly</span>
                <span className="t-body3">{money(39)}</span>
              </div>
              <div className={styles.line}>
                <span className="t-body3">Extra seat</span>
                <span className="t-body3">{money(10)}</span>
              </div>
              {applied && (
                <div className={`${styles.line} ${styles.discount}`}>
                  <span className="t-body3">Coupon SAVE10</span>
                  <span className="t-body3">−{money(COUPON_OFF)}</span>
                </div>
              )}
              <div className={`${styles.line} ${styles.total}`}>
                <span className="t-body2">Total</span>
                <span className="t-body2">{money(total)}</span>
              </div>
            </div>

            <div className={styles.coupon}>
              <input className={`t-body3 ${styles.couponInput}`} value="SAVE10" readOnly aria-label="Coupon code" />
              <button
                type="button"
                className={`${styles.applyButton} ${phase === "working" ? styles.pulse : ""}`}
                onClick={apply}
                disabled={applied}
              >
                <span className="t-button">{applied ? "Applied" : "Apply"}</span>
              </button>
            </div>

            {crashed && (
              <motion.div className={styles.error} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} role="alert">
                <TriangleAlert size={16} strokeWidth={2} aria-hidden />
                <div>
                  <p className={`t-body3 ${styles.errorTitle}`}>Something went wrong.</p>
                  <code className={styles.errorCode}>
                    TypeError: Cannot read properties of undefined (reading &apos;toFixed&apos;) at applyCoupon (cart.ts:42)
                  </code>
                </div>
              </motion.div>
            )}

            <div className={styles.statusRow}>
              {phase === "working" && <p className="t-label">This app is connected to Patchline. Click Apply to break it.</p>}
              {phase === "broken" && (
                <p className={`t-label ${styles.badge}`}>
                  <Zap size={12} strokeWidth={2} aria-hidden /> Error sent to Patchline. Check the phone.
                </p>
              )}
              {phase === "choosing" && (
                <p className={`t-label ${styles.badge}`}>
                  <Zap size={12} strokeWidth={2} aria-hidden /> Two fixes tested in a sandbox. Waiting for your reply.
                </p>
              )}
              {phase === "pr" && (
                <p className={`t-label ${styles.badge}`}>
                  <GitPullRequest size={12} strokeWidth={2} aria-hidden /> PR #12 open with fix {variant}. Not merged yet.
                </p>
              )}
              {phase === "deploying" && (
                <p className={`t-label ${styles.badge}`}>
                  <Rocket size={12} strokeWidth={2} aria-hidden /> Merged. Deploying fix {variant}…
                </p>
              )}
              {phase === "fixed" && (
                <p className={`t-label ${styles.badge} ${styles.badgeOk}`}>
                  <CircleCheck size={12} strokeWidth={2} aria-hidden />
                  {applied ? "Coupon applied. Fixed from a text." : `Fix ${variant} is live. Click Apply again.`}
                </p>
              )}
            </div>
          </div>

          {phase !== "working" && (
            <div className={styles.browserFooter}>
              <button type="button" className={`t-label ${styles.reset}`} onClick={reset}>
                <RotateCcw size={12} strokeWidth={2} aria-hidden /> Break it again
              </button>
              {phase === "fixed" && <Button label="Get this for your app" href="/connect" size="small" />}
            </div>
          )}
        </div>

        {/* The founder's phone, built from the same iPhone frames as the home page. */}
        <div ref={phoneRef} className={`${phone.iphone} ${styles.iphone}`}>
          <div className={phone.screen}>
            <div className={phone.statusBar}>
              <p className={phone.time}>9:41</p>
              <div className={phone.dynamicIsland} />
              <div className={phone.statusIcons}>
                <Signal size={15} strokeWidth={2} color="rgb(0, 0, 0)" />
                <Wifi size={15} strokeWidth={2} color="rgb(0, 0, 0)" />
                <BatteryFull size={20} strokeWidth={2} color="rgb(0, 0, 0)" />
              </div>
            </div>

            <div className={phone.contact}>
              <div className={phone.avatar} />
              <div className={phone.name}>
                <p className={phone.contactName}>Patchline</p>
                <ChevronRight size={11} strokeWidth={2} color="rgba(0, 0, 0, 0.4)" />
              </div>
            </div>

            <div ref={thread} className={`${phone.messages} ${styles.thread}`} data-lenis-prevent aria-live="polite">
              {stamp ? (
                <p className={phone.timestamp}>{stamp}</p>
              ) : (
                <p className={`${phone.timestamp} ${styles.empty}`}>
                  No texts yet. Break the demo app and Patchline texts you here.
                </p>
              )}
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  className={m.from === "me" ? phone.sent : phone.received}
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", duration: 0.35, bounce: 0.2 }}
                >
                  <div className={m.from === "me" ? phone.bubbleSent : phone.bubble}>
                    <p className={m.from === "me" ? phone.messageSent : phone.message}>
                      {m.lines.map((line, j) => (
                        <Fragment key={j}>
                          {j > 0 && <br />}
                          {line}
                        </Fragment>
                      ))}
                    </p>
                  </div>
                </motion.div>
              ))}
              {typing && (
                <div className={phone.received}>
                  <div className={`${phone.bubble} ${styles.typing}`} aria-label="Patchline is typing">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              )}
            </div>

            {chips.length > 0 && (
              <div className={styles.chips}>
                {chips.map((c) => (
                  <button key={c} type="button" className={styles.chip} onClick={() => reply(c)}>
                    {c}
                  </button>
                ))}
              </div>
            )}

            <form
              className={phone.inputBar}
              onSubmit={(e) => {
                e.preventDefault()
                reply(draft)
              }}
            >
              <div className={phone.plus}>
                <Plus size={18} strokeWidth={2} color="rgba(0, 0, 0, 0.5)" />
              </div>
              <div className={phone.field}>
                <input
                  className={styles.input}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="iMessage"
                  aria-label="Reply to Patchline"
                  maxLength={120}
                />
                <button type="submit" className={styles.send} disabled={!draft.trim()} aria-label="Send">
                  <ArrowUp size={14} strokeWidth={2.5} color="rgb(255, 255, 255)" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
