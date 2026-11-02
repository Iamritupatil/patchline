import type { LucideIcon } from "lucide-react"
import { TagMotion } from "./TagMotion"

type Props = {
  title: string
  icon: LucideIcon
  /** Icon and text color. Defaults to black; dark sections pass white. */
  color?: string
  /** Border color. Defaults to Dark/20%. */
  border?: string
}

// "Components/Tag" in Framer. The icon is rendered here (server side) because components
// can't be passed to client components as props; the animation lives in TagMotion.
export function Tag({ title, icon: Icon, color = "var(--dark)", border = "var(--dark-20)" }: Props) {
  return <TagMotion title={title} color={color} border={border} icon={<Icon size={16} strokeWidth={2} aria-hidden />} />
}
