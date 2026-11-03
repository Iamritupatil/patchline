import { Button } from "@/components/ui/Button"
import styles from "./Footer.module.css"

// "Pricing" (lNssWqDdu) is hidden in Framer and left out.
const productLinks = [
  { label: "How it works", href: "/#how-it-works" },
  { label: "Features", href: "/#features" },
  { label: "Capabilities", href: "/#capabilities" },
  { label: "Security", href: "/#security" },
]

// "Footer" component (HSAs7QY3s), instance V61JDu2Dv of the layout template.
export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.conversion}>
          <h2 className={`t-h2 ${styles.heading}`}>Next time your app breaks, you’ll hear it first.</h2>
          <p className={`t-body1 ${styles.description}`}>
            Connect in two minutes. Scan a code, paste one prompt, and your phone buzzes with a test alert.
          </p>
          <Button label="Connect your app" href="/connect" variant="primary" icon />
        </div>

        <div className={styles.brandRow}>
          <div className={styles.brand}>
            <div className={styles.logo} aria-hidden />
            <div className={styles.headingDescription}>
              <h3 className={`t-h3 ${styles.brandName}`}>Patchline</h3>
              <p className={`t-body2 ${styles.tagline}`}>An on-call engineer in your messages.</p>
            </div>
          </div>
          <div className={styles.productLinks}>
            <h5 className={`t-h5 ${styles.productHeading}`}>Product</h5>
            {productLinks.map((l) => (
              <a key={l.href} href={l.href} className="t-body2 link-light">
                {l.label}
              </a>
            ))}
          </div>
        </div>

        <div className={styles.legalRail}>
          <p className={`t-body2 ${styles.copyright}`}>© 2026 Patchline. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
