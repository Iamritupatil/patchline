import type { NextConfig } from "next"

// Static export: the marketing site is plain HTML/CSS/JS, deployable to Vercel or any static host.
const config: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  reactStrictMode: true,
}

export default config
