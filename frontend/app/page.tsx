import { Navbar } from '@/components/landing/navbar'
import { Hero } from '@/components/landing/hero'
import { HowItWorks } from '@/components/landing/how-it-works'
import { Showcase } from '@/components/landing/showcase'
import { Features } from '@/components/landing/features'
import { CtaFooter } from '@/components/landing/cta-footer'

export default function LandingPage() {
  return (
    <main className="relative min-h-screen bg-background">
      <Navbar />
      <Hero />
      <HowItWorks />
      <Showcase />
      <Features />
      <CtaFooter />
    </main>
  )
}
