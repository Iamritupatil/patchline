import type { Metadata } from "next"
import { Geist, Inter, Inter_Tight } from "next/font/google"
import { SmoothScroll } from "@/components/ui/SmoothScroll"
import "./globals.css"

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" })
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const interTight = Inter_Tight({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-inter-tight" })

export const metadata: Metadata = {
  title: "Patchline: an on-call engineer in your messages",
  description: "Your app texts you when it breaks, with two tested fixes. Reply A to ship, without opening a laptop.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${inter.variable} ${interTight.variable}`}>
      <body>
        <SmoothScroll />
        {children}
      </body>
    </html>
  )
}
