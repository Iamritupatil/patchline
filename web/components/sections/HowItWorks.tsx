import { Check, Command, Mic, Paperclip, RefreshCw, Sparkles } from "lucide-react"
import type { ReactNode } from "react"
import AnimatedBeam from "@/components/framer/Animated_beam"
import Typewriter from "@/components/framer/Typewriter"
import { ArcSpinner, RippleLoader } from "@/components/ui/Loaders"
import { Tag } from "@/components/ui/Tag"
import styles from "./HowItWorks.module.css"

// Framer section "How it works" (Nhcw0DMsN): heading + three illustrated cards.
export function HowItWorks() {
  return (
    <section id="how-it-works" className={styles.section}>
      <div className={styles.contentContainer}>
        <div className={styles.content}>
          <div className={styles.headingTag}>
            <Tag title="How it works" icon={Command} />
            <div className={styles.headingDescription}>
              <h2 className={`t-h2 ${styles.heading}`}>From broken to shipped, in 3 texts.</h2>
              <p className={`t-body1 ${styles.description}`}>
                Connect once. When something breaks, Patchline texts you, finds the cause, and waits for your reply.
              </p>
            </div>
          </div>

          <div className={styles.cardContent}>
            <Card
              mediaClass={styles.mediaConnect}
              title="Connect in two minutes"
              text="Scan a QR code to verify your phone, then paste one prompt into your code editor. Your phone buzzes with a test alert."
            >
              <PromptCard />
            </Card>
            <Card
              mediaClass={styles.mediaAlert}
              title="Get a text when it breaks"
              text="Patchline reads the error, your code, and past incidents, then tells you what broke in plain English."
            >
              <div className={styles.beam}>
                <AnimatedBeam
                  centerImage="/images/patchline-mark.png"
                  leftNodes={[
                    { image: "/images/ghA1dv8Ec7AjGLyCNKFyk2YW2Y.png" },
                    { image: "/images/cu4MfUe9qRDMpZkhNA7m7eIhaM.png" },
                    { image: "/images/nETSPvMOZHE9F2AVkfuiTnVEI.png" },
                  ]}
                  rightNodes={[
                    { image: "/images/Bdk9u0YFihVafXCtWkTxTzKmFu4.png" },
                    { image: "/images/zxWuBWsLWrG577sK8JjS6ztMbo.png" },
                    { image: "/images/tA26PW4Ptu6P0TTTuRjOs0Jsvs.png" },
                  ]}
                  nodeSize={48}
                  centerSize={64}
                  padding={24}
                  gap={32}
                  nodeBackground="var(--white)"
                  nodeBorderColor="#e5e7eb"
                  nodeBorderWidth={1}
                  nodeRadius={12}
                  // SVG presentation attributes: token literals (Secondary, Primary, Primary 20%) instead of CSS vars.
                  pathColor="rgb(9, 174, 255)"
                  pathWidth={3}
                  pathOpacity={0.35}
                  gradientStartColor="rgb(1, 43, 255)"
                  gradientStopColor="rgba(1, 43, 255, 0.2)"
                  curvature={75}
                  endYOffset={10}
                  duration={1}
                  delay={0}
                  stagger={0}
                  repeatDelay={0}
                  speedVariation={1}
                  easing="linear"
                  reverseFlow={false}
                />
              </div>
            </Card>
            <Card
              mediaClass={styles.mediaShip}
              title="Reply A to ship"
              text="Get two tested fixes. Reply A or B to open a pull request, then reply ship to merge and deploy."
            >
              <Checklist />
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}

function Card({ mediaClass, title, text, children }: { mediaClass: string; title: string; text: string; children: ReactNode }) {
  return (
    <div className={styles.card}>
      <div className={`${styles.cardMedia} ${mediaClass}`}>{children}</div>
      <div className={styles.cardText}>
        <h5 className={`t-h5 ${styles.cardTitle}`}>{title}</h5>
        <p className={`t-body2 ${styles.cardDescription}`}>{text}</p>
      </div>
    </div>
  )
}

// "Prompt Card" frame (YL6gfLsTV): a code-editor prompt box with a typing animation.
function PromptCard() {
  return (
    <div className={styles.promptCard} aria-hidden>
      <div className={styles.typewriter}>
        <Typewriter
          text1="Connect Patchline to this app."
          text2="Send a test alert to my phone."
          text3="Watch my checkout for errors."
          typingSpeed={50}
          pauseDuration={500}
          textColor="var(--dark)"
          font={{
            fontFamily: "var(--font-body)",
            fontWeight: 400,
            fontSize: "16px",
            textAlign: "left",
            letterSpacing: "-0.01em",
            lineHeight: "1.1em",
          }}
          showCursor
          cursorColor="var(--dark)"
          cursorBlinkSpeed={530}
        />
      </div>
      <div className={styles.promptBar}>
        <div className={styles.newSuggestion}>
          <RefreshCw size={14} strokeWidth={2} color="rgba(17,22,46,0.6)" />
          <p className={`t-body3 ${styles.newSuggestionText}`}>New suggestion</p>
        </div>
        <div className={styles.barRight}>
          <Paperclip size={16} strokeWidth={2} color="rgba(17,22,46,0.45)" />
          <Mic size={16} strokeWidth={2} color="rgba(17,22,46,0.45)" />
          <div className={styles.runAgent}>
            <p className={`t-body3 ${styles.runAgentLabel}`}>Send</p>
            <Sparkles size={14} strokeWidth={2} color="var(--white)" />
          </div>
        </div>
      </div>
    </div>
  )
}

const steps: { title: string; done: boolean }[] = [
  { title: "Reading the stack trace", done: true },
  { title: "Finding the root cause", done: true },
  { title: "Writing fix A and fix B", done: true },
  { title: "Running your tests", done: false },
  { title: "Texting you the options", done: false },
]

// Checklist frame (lGzgXaPhR) with five "UI card loading" instances (XQfVZNDnD).
// Its onAppear SET_VARIANT targets a variant id (ZL20i0Auu) that no component defines, so in Framer it is a
// no-op and the list stays as authored: three Completed, two Loading.
function Checklist() {
  return (
    <div className={styles.checklist}>
      <div className={styles.agentWorking}>
        <RippleLoader size={32} />
        <h6 className={`t-h6 ${styles.agentTitle}`}>Patchline working</h6>
      </div>
      <div className={styles.divider} />
      <ul className={styles.list}>
        {steps.map((s) => (
          <LoadingItem key={s.title} title={s.title} done={s.done} />
        ))}
      </ul>
    </div>
  )
}

// "UI card loading": Loading = ArcSpinner + title; Completed = green check + title.
function LoadingItem({ title, done }: { title: string; done: boolean }) {
  return (
    <li className={styles.loadingItem}>
      <span className={styles.loadingIcon}>
        {done ? <Check size={24} strokeWidth={2} color="rgb(43, 182, 115)" aria-label="Done" /> : <ArcSpinner color="var(--primary)" />}
      </span>
      <p className={`t-body3 ${styles.loadingTitle}`}>{title}</p>
    </li>
  )
}
