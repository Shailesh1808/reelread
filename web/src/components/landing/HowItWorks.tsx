const steps = [
  {
    number: '01',
    title: 'Send a link',
    description:
      'Share any Instagram Reel or TikTok reel directly into your WhatsApp chat with ReelRead.',
    icon: '🔗',
  },
  {
    number: '02',
    title: 'We read everything',
    description:
      'ReelRead extracts the spoken audio, on-screen text overlays, and the post caption, all simultaneously.',
    icon: '🔍',
  },
  {
    number: '03',
    title: 'Get your summary',
    description:
      'Receive a clean, structured summary right in WhatsApp: tips, action steps, and a bottom line.',
    icon: '✅',
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-4 sm:px-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-accent text-sm font-medium uppercase tracking-widest mb-3">
            How it works
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Three steps. Zero friction.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 relative">
          {/* Connector line (desktop only) */}
          <div className="hidden md:block absolute top-10 left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

          {steps.map((step, i) => (
            <div
              key={i}
              className="relative bg-white border border-gray-100 rounded-xl p-6 card-hover"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent font-bold text-sm">
                  {step.number}
                </div>
                <span className="text-2xl">{step.icon}</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900">{step.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
