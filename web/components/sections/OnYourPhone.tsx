import { BatteryFull, ChevronRight, Command, Mic, Plus, Signal, Wifi } from "lucide-react"
import { Fragment } from "react"
import { Tag } from "@/components/ui/Tag"
import styles from "./OnYourPhone.module.css"

type Step = { step: string; title: string; text: string }

const stepsLeft: Step[] = [
  { step: "01", title: "It texts you first", text: "Plain English, seconds after the error. No dashboard to open." },
  { step: "02", title: "You get two tested fixes", text: "Fix A is the smallest safe patch. Fix B is more robust. Both passed your tests." },
]

const stepsRight: Step[] = [
  { step: "03", title: "Reply A", text: "Patchline opens a pull request with that fix. Nothing is merged yet." },
  { step: "04", title: "Reply ship", text: "It merges, and your own CI/CD deploys it. All from your phone." },
]

type Message = { from: "them" | "me"; lines: string[] }

const messages: Message[] = [
  { from: "them", lines: ["🔴 checkout-app is failing for 1 in 5 users since 2:14 PM. Payments break at checkout."] },
  {
    from: "them",
    lines: [
      "Cause: cart total is null after today’s deploy.",
      "A · 2-line null guard · tests ✅",
      "B · guard + retry · tests ✅",
      "Reply A or B.",
    ],
  },
  { from: "me", lines: ["A"] },
  { from: "them", lines: ["PR #142 is open with fix A. Reply ship to merge it."] },
  { from: "me", lines: ["ship"] },
  { from: "them", lines: ["Merged ✅ Your deploy is running."] },
]

// Framer section "On your phone" (IY9zOsTGS): an iMessage walkthrough on an iPhone built from frames,
// with two step cards on each side (stacked vertically on tablet and phone).
export function OnYourPhone() {
  return (
    <section id="on-your-phone" className={styles.section}>
      <div className={styles.contentContainer}>
        <div className={styles.content}>
          <div className={styles.headingTag}>
            <Tag title="Your phone" icon={Command} />
            <div className={styles.headingDescription}>
              <h2 className={`t-h2 ${styles.heading}`}>Here’s how it works on your phone.</h2>
              <p className={`t-body1 ${styles.description}`}>
                No app to install. Patchline is a contact in iMessage or WhatsApp, and you reply like you’d text a teammate.
              </p>
            </div>
          </div>

          <div className={styles.walkthrough}>
            <div className={`${styles.steps} ${styles.stepsLeft}`}>
              {stepsLeft.map((s) => (
                <StepCard key={s.step} {...s} />
              ))}
            </div>
            <IPhone />
            <div className={`${styles.steps} ${styles.stepsRight}`}>
              {stepsRight.map((s) => (
                <StepCard key={s.step} {...s} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function StepCard({ step, title, text }: Step) {
  return (
    <div className={styles.stepCard}>
      <p className={`t-body2 ${styles.stepNumber}`}>{step}</p>
      <h5 className={`t-h5 ${styles.stepTitle}`}>{title}</h5>
      <p className={`t-body2 ${styles.stepDescription}`}>{text}</p>
    </div>
  )
}

function IPhone() {
  return (
    <div className={styles.iphone}>
      <div className={styles.screen}>
        <div className={styles.statusBar}>
          <p className={styles.time}>9:41</p>
          <div className={styles.dynamicIsland} />
          <div className={styles.statusIcons}>
            <Signal size={15} strokeWidth={2} color="rgb(0, 0, 0)" />
            <Wifi size={15} strokeWidth={2} color="rgb(0, 0, 0)" />
            <BatteryFull size={20} strokeWidth={2} color="rgb(0, 0, 0)" />
          </div>
        </div>

        <div className={styles.contact}>
          <div className={styles.avatar} />
          <div className={styles.name}>
            <p className={styles.contactName}>Patchline</p>
            <ChevronRight size={11} strokeWidth={2} color="rgba(0, 0, 0, 0.4)" />
          </div>
        </div>

        <div className={styles.messages}>
          <p className={styles.timestamp}>Today 2:15 PM</p>
          {messages.map((m, i) => (
            <div key={i} className={m.from === "me" ? styles.sent : styles.received}>
              <div className={m.from === "me" ? styles.bubbleSent : styles.bubble}>
                <p className={m.from === "me" ? styles.messageSent : styles.message}>
                  {m.lines.map((line, j) => (
                    <Fragment key={j}>
                      {j > 0 && <br />}
                      {line}
                    </Fragment>
                  ))}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.inputBar}>
          <div className={styles.plus}>
            <Plus size={18} strokeWidth={2} color="rgba(0, 0, 0, 0.5)" />
          </div>
          <div className={styles.field}>
            <p className={styles.placeholder}>iMessage</p>
            <Mic size={16} strokeWidth={2} color="rgba(0, 0, 0, 0.35)" />
          </div>
        </div>
      </div>
    </div>
  )
}
