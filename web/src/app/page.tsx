import Navbar from '@/components/landing/Navbar'
import Hero from '@/components/landing/Hero'
import HowItWorks from '@/components/landing/HowItWorks'
import WhyDifferent from '@/components/landing/WhyDifferent'
import Platforms from '@/components/landing/Platforms'
import Footer from '@/components/landing/Footer'
import Link from 'next/link'

function CTA() {
  return (
    <section className="py-24 px-4 sm:px-6 bg-black">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">
          Ready to stop{' '}
          <span className="text-accent">forgetting advice</span>?
        </h2>
        <p className="text-gray-400 text-lg mb-8">
          Join beta. Free while it lasts.
        </p>
        <Link
          href="/register"
          className="inline-block bg-white text-black font-semibold px-8 py-3.5 rounded-lg hover:bg-gray-100 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          Get Started Free →
        </Link>
        <p className="text-gray-600 text-sm mt-4">No credit card. No app download.</p>
      </div>
    </section>
  )
}

export default function LandingPage() {
  return (
    <main>
      <Navbar />
      <Hero />
      <HowItWorks />
      <WhyDifferent />
      <Platforms />
      <CTA />
      <Footer />
    </main>
  )
}
