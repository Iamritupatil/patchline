import { Button } from "@/components/ui/Button"
import { PromptCard } from "./hero/PromptCard"
import { Appear, RevealHeading, RevealParagraph } from "./hero/Reveal"
import styles from "./Hero.module.css"

// "spring-duration 1s 0 <delay>"
const buttonsAppear = { type: "spring" as const, duration: 1, bounce: 0, delay: 0.8 }
const bgAppear = { type: "spring" as const, duration: 1, bounce: 0, delay: 1 }

// Page section "Hero" (B5_U9VCRp).
export function Hero() {
  return (
    <section id="hero" className={styles.hero}>
      <div className={styles.contentContainer}>
        <div className={styles.container}>
          <div className={styles.textButtonUi}>
            <div className={styles.textButton}>
              <div className={styles.headingBody}>
                <RevealHeading text="Your app texts you when it breaks." className={`t-h1 ${styles.heading}`} />
                <RevealParagraph className={`t-body1 ${styles.body}`}>
                  Patchline finds the root cause and writes two tested fixes. Reply A to ship, without opening a laptop.
                </RevealParagraph>
              </div>
              <Appear className={styles.buttonContainer} transition={buttonsAppear}>
                <Button label="Try the live demo" href="/demo" variant="secondary" icon={false} />
                <Button label="Connect your app" href="/connect" variant="primary" icon />
              </Appear>
            </div>
          </div>
          <Appear className={styles.bg} transition={bgAppear}>
            <PromptCard />
          </Appear>
        </div>
      </div>
    </section>
  )
}
