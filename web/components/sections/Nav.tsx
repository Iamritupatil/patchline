import { Button } from "@/components/ui/Button"
import { MobileNav } from "./nav/MobileNav"
import { navActions, navLinks } from "./nav/links"
import styles from "./Nav.module.css"

// Fixed page chrome: frame m4r1F18z_ holding the "Navigation bar" (UXHe4J1PZ).
// Desktop variant at >= 1200px; "Phone Closed"/"Phone Open" below (max 1000px on tablet, 500px on phone).
export function Nav() {
  return (
    <div className={styles.wrapper}>
      <nav className={styles.desktop} aria-label="Main">
        <div className={styles.logoContainer}>
          <a href="/#hero" className={styles.logo} aria-label="Patchline home" />
        </div>
        <div className={styles.links}>
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} className={`t-body2 link-dark ${styles.link}`}>
              {l.label}
            </a>
          ))}
        </div>
        <div className={styles.actions}>
          <Button {...navActions.secondary} variant="secondary" size="small" icon={false} />
          <Button {...navActions.primary} variant="primary" size="small" icon={false} />
        </div>
      </nav>
      <MobileNav />
    </div>
  )
}
