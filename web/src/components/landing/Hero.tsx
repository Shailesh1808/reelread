import Link from 'next/link'

function WhatsAppMockup() {
  return (
    <div className="relative mx-auto w-full max-w-sm">
      {/* Glow effect */}
      <div className="absolute inset-0 bg-accent/5 blur-3xl rounded-full scale-75" />

      {/* Phone shell */}
      <div className="relative bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-lg">
        {/* Chat header */}
        <div className="bg-gray-900 px-4 py-3 flex items-center gap-3 border-b border-gray-700">
          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent text-sm font-bold">
            R
          </div>
          <div>
            <p className="text-sm font-semibold text-white leading-none">ReelRead</p>
            <p className="text-[11px] text-gray-400 mt-0.5">online</p>
          </div>
        </div>

        {/* Chat messages */}
        <div className="px-3 py-4 space-y-3 min-h-[320px] bg-gray-50">
          {/* User message */}
          <div className="flex justify-end">
            <div className="bg-[#005c4b] text-white text-xs px-3 py-2 rounded-xl rounded-br-sm max-w-[80%] leading-relaxed">
              https://www.instagram.com/reel/abc123/
            </div>
          </div>

          {/* Bot processing */}
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 text-gray-500 text-xs px-3 py-2 rounded-xl rounded-bl-sm max-w-[80%]">
              ⏳ Got it! Analyzing your content...
            </div>
          </div>

          {/* Bot summary */}
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 text-gray-900 text-[11px] px-3 py-2.5 rounded-xl rounded-bl-sm max-w-[90%] leading-relaxed space-y-1.5">
              <p className="font-semibold text-gray-900">🎯 What This Is About</p>
              <p className="text-gray-600">How to tailor your LinkedIn headline to get recruiter callbacks.</p>
              <p className="font-semibold text-gray-900 mt-2">💡 Key Tips</p>
              <p className="text-gray-600">1. Lead with your target role, not current title</p>
              <p className="text-gray-600">2. Add keywords from jobs you want</p>
              <p className="text-gray-600">3. Include one result metric</p>
              <p className="font-semibold text-gray-900 mt-2">📌 Bottom Line</p>
              <p className="text-gray-600">Your headline is the first filter. Make it pass.</p>
              <p className="text-gray-300 text-[10px] mt-2">─────────────────</p>
              <p className="text-accent text-[10px]">💾 Reply save · 📋 Reply last</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Hero() {
  return (
    <section className="relative pt-32 pb-24 px-4 sm:px-6 overflow-hidden bg-white">
      {/* Subtle background gradient */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-accent/3 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: copy */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 text-[#16a34a] text-xs font-medium px-3 py-1.5 rounded-full mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-slow" />
              Now in beta
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold leading-[1.08] tracking-tight mb-6 text-gray-900">
              Stop saving Reels
              <br />
              <span className="gradient-text">you never go back to.</span>
            </h1>

            <p className="text-gray-500 text-lg sm:text-xl leading-relaxed mb-8 max-w-lg mx-auto lg:mx-0">
              Send any Instagram Reel or TikTok to ReelRead on WhatsApp and get every tip,
              formatted as text, in seconds.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link
                href="/register"
                className="bg-[#18181b] text-white font-semibold px-6 py-3 rounded-lg hover:bg-[#27272a] transition-all hover:scale-[1.02] active:scale-[0.98] text-center"
              >
                Get Started Free
              </Link>
              <a
                href="#how-it-works"
                className="border border-gray-200 text-gray-900 font-medium px-6 py-3 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all text-center"
              >
                See How It Works
              </a>
            </div>

            <p className="text-gray-400 text-sm mt-4">No app download. Works in WhatsApp.</p>
          </div>

          {/* Right: mockup */}
          <div className="flex justify-center lg:justify-end">
            <WhatsAppMockup />
          </div>
        </div>
      </div>
    </section>
  )
}
