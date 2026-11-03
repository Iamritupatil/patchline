"use client"

import { Check, Copy, MessageCircle, RefreshCw } from "lucide-react"
import QRCode from "qrcode"
import { useCallback, useEffect, useState } from "react"
import { RippleLoader } from "@/components/ui/Loaders"
import { getStatus, newPhoneCode, newPrompt, signup, type Signup, type Status } from "@/lib/patchline-api"
import styles from "./Connect.module.css"

const STORAGE_KEY = "patchline.connect.v2"
const POLL_MS = 2000

// Reuse one signup per browser tab, so a reload doesn't create a second app.
const load = (): Signup | null => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Signup) : null
  } catch {
    return null
  }
}
const save = (s: Signup | null) => {
  try {
    if (s) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(s))
    else sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // Private mode: the page still works, it just won't survive a reload.
  }
}

/** "+17796251378" → "+1 (779) 625-1378"; other countries stay as sent. */
const formatPhone = (n: string) => n.replace(/^\+1(\d{3})(\d{3})(\d{4})$/, "+1 ($1) $2-$3")

/** Refresh whichever code has expired (phone codes and claim codes are short-lived). */
async function refreshExpired(s: Signup): Promise<Signup> {
  const now = Date.now()
  // The server refuses new phone codes once a phone is linked (409); keep the old one, the step is done anyway.
  const phone = s.phone.expiresAt <= now ? await newPhoneCode(s.sessionToken).catch(() => s.phone) : s.phone
  const connect = s.connect.expiresAt <= now ? await newPrompt(s.sessionToken) : s.connect
  return { ...s, phone, connect }
}

export function Connect() {
  const [data, setData] = useState<Signup | null>(null)
  const [status, setStatus] = useState<Status | null>(null)
  const [qr, setQr] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const start = useCallback(async (fresh: boolean) => {
    setError(null)
    try {
      const existing = fresh ? null : load()
      const s = existing ? await refreshExpired(existing) : await signup()
      save(s)
      setData(s)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn’t reach Patchline.")
    }
  }, [])

  useEffect(() => {
    void start(false)
  }, [start])

  // QR for the phone step: the sms: link pre-fills "start 123456"; otherwise the Keiki join link.
  const phoneHref = data?.phone.smsLink ?? data?.phone.joinLink ?? null
  useEffect(() => {
    if (!phoneHref) return setQr(null)
    QRCode.toDataURL(phoneHref, { margin: 1, width: 360, color: { dark: "#000000", light: "#ffffff" } })
      .then(setQr)
      .catch(() => setQr(null))
  }, [phoneHref])

  // Poll until the phone is linked and the first test alert has arrived.
  const done = !!status?.phoneConnected && !!status?.lastEventAt
  useEffect(() => {
    if (!data || done) return
    let alive = true
    const tick = async () => {
      try {
        const s = await getStatus(data.sessionToken)
        if (alive) setStatus(s)
      } catch (e) {
        // A 401 means the app no longer exists on the server (e.g. a reset): start a new one.
        if (alive && e instanceof Error && e.message.includes("401")) {
          save(null)
          void start(true)
        }
      }
    }
    void tick()
    const id = setInterval(tick, POLL_MS)
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [data, done, start])

  const copy = async () => {
    if (!data) return
    try {
      await navigator.clipboard.writeText(data.connect.prompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError("Copy failed. Select the prompt and copy it manually.")
    }
  }

  if (error && !data) {
    return (
      <div className={styles.errorBox} role="alert">
        <p className="t-body2">{error}</p>
        <button type="button" className={styles.secondaryButton} onClick={() => void start(true)}>
          <RefreshCw size={16} aria-hidden /> <span className="t-button">Try again</span>
        </button>
      </div>
    )
  }

  const phoneConnected = !!status?.phoneConnected

  return (
    <div className={styles.steps}>
      {/* Step 1: the owner texts first. Keiki can only message a phone after it has texted Patchline once. */}
      <article className={styles.card} aria-labelledby="step-phone">
        <header className={styles.cardHeader}>
          <p className={`t-body2 ${styles.step}`}>01</p>
          <h2 id="step-phone" className="t-h4">Text Patchline first</h2>
          <p className="t-body2">
            Patchline can only text you after you text it once. That one text also links your phone to your app.
          </p>
        </header>

        <div className={styles.phoneStep}>
          <div className={styles.qr}>
            {qr ? <img src={qr} alt="QR code that opens Messages with your Patchline text" width={180} height={180} /> : <RippleLoader size={32} />}
          </div>
          <ol className={`t-body2 ${styles.howTo}`}>
            <li>
              <span className={styles.desktopOnly}>Scan this code with your phone’s camera.</span>
              <span className={styles.mobileOnly}>Tap the button below.</span>
            </li>
            <li>{data?.phone.smsLink ? "Messages opens with the text already typed." : "Messages opens. Type the text below."}</li>
            <li>Tap Send. Patchline texts you back.</li>
          </ol>
        </div>

        <dl className={styles.message}>
          {data?.phone.number && (
            <div>
              <dt className="t-body3">To</dt>
              <dd className="t-body2">{formatPhone(data.phone.number)}</dd>
            </div>
          )}
          <div>
            <dt className="t-body3">Message</dt>
            <dd>
              <code className={styles.code}>{data?.phone.text ?? "start ······"}</code>
            </dd>
          </div>
        </dl>

        {phoneHref && (
          <a className={`${styles.primaryButton} ${styles.mobileOnly}`} href={phoneHref}>
            <MessageCircle size={16} aria-hidden />
            <span className="t-button">Open Messages</span>
          </a>
        )}

        <StatusLine
          ok={phoneConnected}
          waiting="Waiting for your text…"
          success={`Phone connected${status?.owners[0] ? ` (${status.owners[0]})` : ""}. Patchline texted you back.`}
        />
      </article>

      {/* Step 2: the connect prompt for the coding agent. Carries a single-use claim code, never a secret. */}
      <article className={styles.card} aria-labelledby="step-code">
        <header className={styles.cardHeader}>
          <p className={`t-body2 ${styles.step}`}>02</p>
          <h2 id="step-code" className="t-h4">Paste this into your coding agent</h2>
          <p className="t-body2">
            Open your project in Claude Code, Cursor or any coding agent and paste this prompt. It installs Patchline,
            wires up error reporting, and sends a test alert to your phone.
          </p>
        </header>

        <div className={styles.promptBox}>
          <pre className={styles.prompt} tabIndex={0} aria-label="Connect prompt">
            {data?.connect.prompt ?? "Generating your prompt…"}
          </pre>
          <button type="button" className={styles.copyButton} onClick={() => void copy()} disabled={!data}>
            {copied ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />}
            <span className="t-button">{copied ? "Copied" : "Copy prompt"}</span>
          </button>
        </div>
        <p className={`t-body3 ${styles.note}`}>The claim code in the prompt works once and expires in 30 minutes.</p>

        <StatusLine
          ok={!!status?.lastEventAt}
          waiting="Waiting for your app’s test alert…"
          success="Test alert received. You’re all set: Patchline will text you when your app breaks."
        />
      </article>

      {error && (
        <p className={`t-body3 ${styles.inlineError}`} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

function StatusLine({ ok, waiting, success }: { ok: boolean; waiting: string; success: string }) {
  return (
    <p className={`t-body3 ${styles.status} ${ok ? styles.statusOk : ""}`} aria-live="polite">
      {ok ? <Check size={16} aria-hidden /> : <RippleLoader size={16} />}
      <span>{ok ? success : waiting}</span>
    </p>
  )
}
