import { Activity } from "lucide-react"
import { Tag } from "@/components/ui/Tag"
import GrowthGraph from "@/components/framer/GrowthGraph"
import styles from "./Metrics.module.css"

// "Metrics card" (PxRVBBWIS) instances: plain text, no SlotCounter.
const METRICS = [
  { number: "<30s", title: "from error to first text" },
  { number: "2", title: "tested fixes per incident" },
  { number: "2", title: "replies from alert to deploy" },
  { number: "0", title: "pushes to your main branch" },
]

export function Metrics() {
  return (
    <section id="metrics" className={styles.metrics}>
      <div className={styles.contentContainer}>
        <div className={styles.content}>
          <div className={styles.headingTag}>
            <Tag title="Metrics" icon={Activity} />
            <div className={styles.headingDescription}>
              <h2 className={`t-h2 ${styles.heading}`}>From alert to deployed fix, without a laptop.</h2>
              <p className={`t-body1 ${styles.description}`}>Patchline is built around a few hard numbers.</p>
            </div>
          </div>

          <div className={styles.metricCardContainer}>
            {METRICS.map(({ number, title }) => (
              <div key={title} className={styles.metricCard}>
                <p className={`t-h3 ${styles.number}`}>{number}</p>
                <p className={`t-body2 ${styles.title}`}>{title}</p>
              </div>
            ))}
          </div>
        </div>

        {/* GrowthGraph instance pV9FeU8Fw. Colors are literal token values: SVG color attributes can't resolve CSS variables. */}
        <div className={styles.graph} aria-hidden>
          <GrowthGraph
            lineColor="rgba(9, 174, 255, 0.2)"
            useLineGradient
            lineEndColor="rgb(9, 153, 224)"
            fillColor="rgba(9, 174, 255, 0.2)"
            ruleColor="rgba(0, 0, 0, 0.1)"
            startHeight={15}
            endHeight={100}
            duration={4}
            showRules
          />
        </div>
      </div>
    </section>
  )
}
