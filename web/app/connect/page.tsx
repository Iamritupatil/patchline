import type { Metadata } from "next"
import { Plug } from "lucide-react"
import { Connect } from "@/components/sections/connect/Connect"
import { Footer } from "@/components/sections/Footer"
import { Nav } from "@/components/sections/Nav"
import { Tag } from "@/components/ui/Tag"
import pageStyles from "../page.module.css"
import styles from "./connect.module.css"

export const metadata: Metadata = {
  title: "Connect your app · Patchline",
  description: "Text Patchline once from your phone, then paste one prompt into your coding agent.",
}

export default function ConnectPage() {
  return (
    <div className={pageStyles.page}>
      <Nav />
      <main className={pageStyles.main}>
        <section id="connect" className={styles.section}>
          <div className={styles.container}>
            <div className={styles.heading}>
              <Tag title="Connect" icon={Plug} />
              <h1 className={`t-h2 ${styles.title}`}>Connect your app in two minutes.</h1>
              <p className={`t-body1 ${styles.lead}`}>
                Text Patchline once from your phone, then paste one prompt into your coding agent. That’s the whole setup.
              </p>
            </div>
            <Connect />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
