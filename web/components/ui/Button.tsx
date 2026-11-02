import { ArrowRight } from "lucide-react"
import styles from "./Button.module.css"

type Props = {
  label: string
  href: string
  variant?: "primary" | "secondary" | "primaryLight"
  size?: "default" | "small"
  icon?: boolean
  newTab?: boolean
}

// "Components/Button" in Framer: pill, Button text style, optional 16px arrow, darker fill on hover.
export function Button({ label, href, variant = "primary", size = "default", icon = true, newTab = false }: Props) {
  return (
    <a
      href={href}
      className={`${styles.button} ${styles[variant]} ${size === "small" ? styles.small : ""}`}
      {...(newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      <span className="t-button">{label}</span>
      {icon && <ArrowRight className={styles.icon} size={16} strokeWidth={2} aria-hidden />}
    </a>
  )
}
