import { Shield } from "lucide-react"
import { Tag } from "@/components/ui/Tag"
import styles from "./Security.module.css"

// Framer "Security" section (WYSe0v1Nz).
const GUARDRAILS = [
  {
    title: "Scrubbed first",
    text: "Secrets and personal data are masked before any model, pull request, text, or log sees them.",
  },
  {
    title: "Sandboxed code",
    text: "Your code runs only in an isolated VM, with a clean environment and a timeout.",
  },
  {
    title: "Two-step shipping",
    text: "A or B opens a pull request. Only “ship” merges. Nothing is ever pushed to main.",
  },
  {
    title: "Least access",
    text: "No access to your CI workflows. Patches can’t touch CI config, lockfiles, env files, or tests.",
  },
]

export function Security() {
  return (
    <section id="security" className={styles.security}>
      <div className={styles.contentContainer}>
        <div className={styles.content}>
          <div className={styles.headingTag}>
            <Tag title="Security" icon={Shield} color="var(--white)" border="var(--white-20)" />
            <div className={styles.headingDescription}>
              <h2 className={`t-h2 ${styles.heading}`}>Fast fixes. Strict guardrails.</h2>
            </div>
          </div>
          <div className={styles.image} aria-hidden />
          <div className={styles.infoContainer}>
            {GUARDRAILS.map((g) => (
              <div key={g.title} className={styles.card}>
                <h6 className={`t-h6 ${styles.cardTitle}`}>{g.title}</h6>
                <p className={`t-body3 ${styles.cardText}`}>{g.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
