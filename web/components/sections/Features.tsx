import type { ReactNode } from "react"
import { LayoutGrid, Search } from "lucide-react"
import AnimatedBeamLines from "@/components/framer/Animated_lines"
import { ArcSpinner, RippleLoader } from "@/components/ui/Loaders"
import { TextWave } from "@/components/ui/TextWave"
import { FeatureIndicators } from "./features/FeatureIndicators"
import { Tag } from "@/components/ui/Tag"
import { Ticker } from "./features/Ticker"
import { UserRolesCard } from "./features/UserRolesCard"
import styles from "./Features.module.css"

// Scroll targets keep their Framer element ids (typos included) so anchors and the indicator wiring match.
const TARGETS = ["feature-trigger 1", "feature-trigge 2", "feature-trigge 3", "feature-trigge 4"]

const INDICATORS = [
  { number: "01", title: "Plain-English alerts", target: TARGETS[0] },
  { number: "02", title: "Two tested fixes", target: TARGETS[1] },
  { number: "03", title: "Ship by text", target: TARGETS[2] },
  { number: "04", title: "You stay in control", target: TARGETS[3] },
]

// Text Wave instances: defaultColor Dark 40%, waveInColor Dark.
const WAVE = { color: "var(--dark-40)", waveColor: "var(--dark)" }

type CardProps = { id: string; title: string; description: string; mockClass: string; children: ReactNode }

// "Feature card container" (sticky white shell) > "Feature card" > "Step + info" + "Content" mock.
function FeatureCard({ id, title, description, mockClass, children }: CardProps) {
  return (
    <div id={id} className={styles.cardShell}>
      <div className={styles.card}>
        <div className={styles.stepInfo}>
          <div className={styles.textTags}>
            <div className={styles.cardText}>
              <h5 className={`t-h5 ${styles.cardTitle}`}>{title}</h5>
              <p className={`t-body2 ${styles.cardDescription}`}>{description}</p>
            </div>
          </div>
        </div>
        <div className={`${styles.mock} ${mockClass}`}>{children}</div>
      </div>
    </div>
  )
}

export function Features() {
  return (
    <section id="features" className={styles.features}>
      <div className={styles.contentContainer}>
        <div className={styles.content}>
          <div className={styles.headingTag}>
            <Tag title="Features" icon={LayoutGrid} />
            <div className={styles.headingDescription}>
              <h2 className={`t-h2 ${styles.heading}`}>An on-call engineer. In your messages.</h2>
              <p className={`t-body1 ${styles.description}`}>
                Plain-English alerts, tested fixes, and one-word shipping, all from iMessage or WhatsApp.
              </p>
            </div>
          </div>

          <div className={styles.indicatorCard}>
            <FeatureIndicators items={INDICATORS} />

            <div className={styles.cardList}>
              {/* 1: reading the error logs */}
              <FeatureCard
                id={TARGETS[0]}
                title="Alerts you can actually read"
                description="No stack-trace soup. Patchline texts you what broke, who it affects, and since when, in under 30 seconds."
                mockClass={styles.mockSearch}
              >
                <div className={styles.search}>
                  <div className={styles.promptCard}>
                    <div className={styles.searchBar}>
                      <Search className={styles.searchIcon} size={20} strokeWidth={2} aria-hidden />
                      <TextWave text="Reading your error logs" {...WAVE} className={styles.waveFill} />
                    </div>
                    <div className={styles.results}>
                      <Ticker velocity={20} gap={10} className={styles.infoContainer}>
                        <p className={`t-body2 ${styles.infoText}`}>Stack trace</p>
                        <p className={`t-body2 ${styles.infoText}`}>Recent deploys</p>
                        <p className={`t-body2 ${styles.infoText}`}>Past incidents</p>
                        <p className={`t-body2 ${styles.infoText}`}>Your repo</p>
                      </Ticker>
                    </div>
                  </div>
                </div>
              </FeatureCard>

              {/* 2: testing both fixes */}
              <FeatureCard
                id={TARGETS[1]}
                title="Two fixes, both tested"
                description="Fix A is the smallest safe patch. Fix B is more robust. Both run against your own tests in an isolated sandbox first."
                mockClass={styles.mockTesting}
              >
                <div className={styles.testing}>
                  <div className={styles.testingPill}>
                    <RippleLoader size={24} color="rgb(49, 91, 232)" />
                    <TextWave text="Testing fixes" {...WAVE} className={styles.testingWave} />
                  </div>
                  <div className={styles.suggestions}>
                    <div className={styles.beams} aria-hidden>
                      <div className={styles.beamsInner}>
                        {/* SVG paint attributes can't resolve var(), so tokens are passed as their literal values:
                            track = Secondary Dark, gradient A = Primary, gradient B = Primary 20%. */}
                        <AnimatedBeamLines
                          mode="converge"
                          lineCount={3}
                          convergeX={0.5}
                          convergeY={0.95}
                          bend={0.55}
                          orientation="vertical"
                          curvature={2}
                          inset={0}
                          pathColor="rgb(9, 153, 224)"
                          pathWidth={3}
                          pathOpacity={0.2}
                          gradientStartColor="rgb(1, 43, 255)"
                          gradientStopColor="rgba(1, 43, 255, 0.2)"
                          beamLength={32}
                          duration={1.5}
                          delay={0}
                          stagger={0}
                          repeatDelay={0}
                          speedVariation={0}
                          easing="linear"
                          reverse={true}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </FeatureCard>

              {/* 3: opening the pull request */}
              <FeatureCard
                id={TARGETS[2]}
                title="Ship with one word"
                description="Reply A or B to open a pull request. Reply ship to merge it, and your own CI/CD deploys it."
                mockClass={styles.mockShipping}
              >
                <div className={styles.automation}>
                  <div className={styles.automating}>
                    {/* Primary token as a literal: it is used as an SVG stroke attribute, where var() doesn't resolve. */}
                    <ArcSpinner color="rgb(1, 43, 255)" size={24} stroke={2} />
                    <TextWave text="Patchline is opening your pull request" {...WAVE} className={styles.automatingWave} />
                  </div>
                  <div className={`${styles.results} ${styles.resultsLight}`}>
                    <Ticker velocity={40} gap={10} className={styles.infoContainer}>
                      <div className={styles.infoBlock}>
                        <p className={`t-body2 ${styles.infoText}`}>
                          Fix A is open as a pull request on its own branch. Tests ✅. Reply ship to merge it.
                        </p>
                        <p className={`t-body2 ${styles.infoText}`}>
                          Changed your mind? Reply B, or just text “keep it smaller” and Patchline rewrites the fix.
                        </p>
                      </div>
                    </Ticker>
                  </div>
                </div>
              </FeatureCard>

              {/* 4: verified phones and permissions */}
              <FeatureCard
                id={TARGETS[3]}
                title="Nothing ships without you"
                description="Only phones you’ve verified can act on your app. Nothing merges until you say ship, and Patchline never pushes to your main branch."
                mockClass={styles.mockRoles}
              >
                <UserRolesCard className={styles.roles} />
              </FeatureCard>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
