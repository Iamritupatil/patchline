// Links of the "Navigation bar" component. "Pricing" (dTREWZcfg) is hidden in Framer and left out.
export const navLinks = [
  { label: "How it works", href: "/#how-it-works" },
  { label: "Features", href: "/#features" },
  { label: "Capabilities", href: "/#capabilities" },
  { label: "Security", href: "/#security" },
] as const

export const navActions = {
  secondary: { label: "Live demo", href: "/demo" },
  primary: { label: "Connect your app", href: "/connect" },
} as const
