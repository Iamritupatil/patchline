import { Capabilities } from "@/components/sections/Capabilities"
import { Faq } from "@/components/sections/Faq"
import { Features } from "@/components/sections/Features"
import { Footer } from "@/components/sections/Footer"
import { Hero } from "@/components/sections/Hero"
import { HowItWorks } from "@/components/sections/HowItWorks"
import { Metrics } from "@/components/sections/Metrics"
import { Nav } from "@/components/sections/Nav"
import { OnYourPhone } from "@/components/sections/OnYourPhone"
import { Security } from "@/components/sections/Security"
import styles from "./page.module.css"

// Section order matches the Framer home page. Logos, Industries, Pricing and Testimonials are hidden there, so they are not built.
export default function Home() {
  return (
    <div className={styles.page}>
      <Nav />
      <main className={styles.main}>
        <Hero />
        <HowItWorks />
        <OnYourPhone />
        <Features />
        <Capabilities />
        <Metrics />
        <Security />
        <Faq />
      </main>
      <Footer />
    </div>
  )
}
