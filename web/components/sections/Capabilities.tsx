import { Anchor } from "lucide-react"
import { Tag } from "@/components/ui/Tag"
import AnimatedBeamLines from "@/components/framer/Animated_lines_2"
import { MultimodalCard } from "./capabilities/MultimodalCard"
import { ReviewCard } from "./capabilities/ReviewCard"
import styles from "./Capabilities.module.css"

// AnimatedBeamLines instance cDlqstrY7 (desktop props; tablet/phone override a few).
const BEAM_PROPS = {
  mode: "converge",
  lineCount: 5,
  flipVertical: true,
  flipHorizontal: false,
  convergeX: 0.5,
  convergeY: 0.9,
  bend: 0.45,
  meetIcon: "/images/7QuYVNK6yeb3hmBB6mc2yJ1DBUg.png",
  meetIconSize: 48,
  meetIconBackground: "rgb(255, 255, 255)",
  meetIconBorderColor: "rgba(0, 0, 0, 0.2)",
  meetIconBorderWidth: 1,
  meetIconRadius: 999,
  meetIconPadding: 10,
  orientation: "horizontal",
  curvature: 0,
  inset: 24,
  showCards: true,
  cards: [{ text: "Reproduce" }, { text: "Diagnose" }, { text: "Patch" }, { text: "Test" }, { text: "Review" }],
  cardBackground: "rgb(255, 255, 255)",
  cardTextColor: "rgb(0, 0, 0)",
  cardBorderColor: "rgba(0, 0, 0, 0.2)",
  cardBorderWidth: 1,
  cardRadius: 40,
  cardPaddingX: 16,
  cardPaddingY: 8,
  cardIconSize: 18,
  fontSize: 16,
  fontWeight: 500,
  pathColor: "rgba(0, 0, 0, 0.4)",
  pathWidth: 2,
  pathOpacity: 0.2,
  gradientStartColor: "rgb(1, 43, 255)",
  gradientStopColor: "rgba(1, 43, 255, 0.2)",
  beamLength: 22,
  duration: 2,
  delay: 0,
  stagger: 0.1,
  repeatDelay: 0,
  speedVariation: 0,
  easing: "linear",
  reverse: true,
} as const

const BEAMS = [
  { className: styles.beamsDesktop, props: BEAM_PROPS },
  { className: styles.beamsTablet, props: { ...BEAM_PROPS, lineCount: 3, convergeY: 0.69 } },
  { className: styles.beamsPhone, props: { ...BEAM_PROPS, lineCount: 3, convergeY: 1, bend: 0.4, inset: 40 } },
]

function CardText({ title, body }: { title: string; body: string }) {
  return (
    <div className={styles.headingDescription}>
      <h5 className={`t-h5 ${styles.cardTitle}`}>{title}</h5>
      <p className={`t-body2 ${styles.cardBody}`}>{body}</p>
    </div>
  )
}

export function Capabilities() {
  return (
    <section id="capabilities" className={styles.capabilities}>
      <div className={styles.contentContainer}>
        <div className={styles.content}>
          <div className={styles.headingTag}>
            <Tag title="Capabilities" icon={Anchor} />
            <div className={styles.headingDescriptionTop}>
              <h2 className={`t-h2 ${styles.heading}`}>Built for real production bugs.</h2>
              <p className={`t-body1 ${styles.description}`}>
                Patchline learns your codebase, tests every fix in isolation, and keeps your secrets out of everything it
                touches.
              </p>
            </div>
          </div>

          <div className={styles.cardContainer}>
            <div className={`${styles.cardOuter} ${styles.span1}`}>
              <div className={styles.card}>
                <MultimodalCard />
                <CardText title="Works with any app" body="Any language or framework that can send an error." />
              </div>
            </div>

            <div className={`${styles.cardOuter} ${styles.span2}`}>
              <div className={styles.card}>
                <video
                  className={styles.video}
                  src="/assets/R2LuOEH4wpUQhMnB4kQDIJ4RM.mp4"
                  poster="/images/bn9SbXpnsqWIO651wPfywkNq2PA.png"
                  autoPlay
                  muted
                  loop
                  playsInline
                  aria-hidden
                />
                <CardText
                  title="Incident memory"
                  body="Remembers your repo and every past incident, so you can ask “what keeps breaking?”"
                />
              </div>
            </div>

            <div className={`${styles.cardOuter} ${styles.span2}`}>
              <div className={styles.card}>
                <div className={styles.beamsFrame}>
                  {BEAMS.map(({ className, props }) => (
                    <div key={className} className={`${styles.beams} ${className}`}>
                      <AnimatedBeamLines {...props} cards={[...props.cards]} />
                    </div>
                  ))}
                </div>
                <CardText title="Sandboxed test runs" body="Every fix runs your test suite in its own isolated VM." />
              </div>
            </div>

            <div className={`${styles.cardOuter} ${styles.span1}`}>
              <div className={styles.card}>
                <ReviewCard />
                <CardText
                  title="Reviewed before you see it"
                  body="A second review pass checks every patch before it reaches your phone."
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
