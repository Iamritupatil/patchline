import type { Metadata } from "next"
import { Zap } from "lucide-react"
import { Demo } from "@/components/sections/demo/Demo"
import { Footer } from "@/components/sections/Footer"
import { Nav } from "@/components/sections/Nav"
import { Tag } from "@/components/ui/Tag"
import pageStyles from "../page.module.css"
import styles from "./demo.module.css"

export const metadata: Metadata = {
  title: "Live demo · Patchline",
  description: "Break a sample app, get the text, reply A, then ship. The whole loop, right in your browser.",
}

export default function DemoPage() {
  return (
    <div className={pageStyles.page}>
      <Nav />
      <main className={pageStyles.main}>
        <section id="demo" className={styles.section}>
          <div className={styles.container}>
            <div className={styles.heading}>
              <Tag title="Live demo" icon={Zap} />
              <h1 className={`t-h2 ${styles.title}`}>Break our demo app. Fix it from the phone.</h1>
              <p className={`t-body1 ${styles.lead}`}>
                Click the broken button and watch Patchline text the founder. Reply A, then ship. No signup and no phone needed.
              </p>
            </div>
            <Demo />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
