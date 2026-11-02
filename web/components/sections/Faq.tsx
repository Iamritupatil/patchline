import { TriangleAlert } from "lucide-react"
import { Tag } from "@/components/ui/Tag"
import { FaqList, type FaqItem } from "./faq/FaqList"
import styles from "./Faq.module.css"

// Framer "FAQs" section (d8ShmMfym) with "FAQs card container" (dGKghXMEe).
const FAQS: FaqItem[] = [
  {
    question: "How quickly can I get started?",
    answer:
      "About two minutes. Scan a QR code to verify your phone, paste one prompt into your code editor, and you’ll get a test text.",
  },
  {
    question: "What apps does Patchline work with?",
    answer:
      "Any app that can send an error, in any language or framework. To write fixes, your code needs to be on GitHub.",
  },
  {
    question: "Do I need to open my laptop?",
    answer: "No. You get the alert, the diagnosis, and both fixes by text. Reply A, B, or ship from your phone.",
  },
  {
    question: "What’s the difference between fix A and fix B?",
    answer: "A is the smallest safe patch. B is the more robust fix. Both are tested against your own test suite.",
  },
  {
    question: "Can Patchline push code without me?",
    answer:
      "No. A or B only opens a pull request. Nothing merges until you reply ship, and Patchline never pushes to your main branch.",
  },
  {
    question: "What if a fix fails its tests?",
    answer: "Patchline tells you plainly, like “tests ❌ on A”, and never offers to ship a fix that failed.",
  },
  {
    question: "Is my code and data safe?",
    answer:
      "Secrets and personal data are scrubbed before anything is stored, sent, or logged. Your code is tested only in an isolated sandbox.",
  },
  {
    question: "Does it work on iMessage and WhatsApp?",
    answer: "Yes. Patchline lives in your messages, so you can reply in plain English, like “fix this, keep it small.”",
  },
]

export function Faq() {
  return (
    <section id="faqs" className={styles.faqs}>
      <div className={styles.contentContainer}>
        <div className={styles.content}>
          <div className={styles.headingTag}>
            <Tag title="FAQs" icon={TriangleAlert} />
            <div className={styles.headingDescription}>
              <h2 className={`t-h2 ${styles.heading}`}>Questions about Patchline, answered.</h2>
              <p className={`t-body1 ${styles.description}`}>
                How Patchline connects to your app, protects your code, and ships fixes.
              </p>
            </div>
          </div>
          <FaqList items={FAQS} />
        </div>
      </div>
    </section>
  )
}
