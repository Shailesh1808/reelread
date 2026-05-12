import { FaWhatsapp } from 'react-icons/fa6'

const features = [
  {
    icon: <span className="text-3xl">🔀</span>,
    title: 'Reads 3 sources',
    description:
      'Audio transcript, on-screen text, and post caption, merged and deduplicated into one clean summary.',
  },
  {
    icon: <span className="text-3xl">🎯</span>,
    title: 'Career focused',
    description:
      'Built specifically for job seekers and career content. No lifestyle fluff. Just actionable advice.',
  },
  {
    icon: <FaWhatsapp className="w-8 h-8" style={{ color: '#25D366' }} />,
    title: 'WhatsApp native',
    description:
      'Zero new apps to install. Works in the WhatsApp you already have. Available on any phone.',
  },
  {
    icon: <span className="text-3xl">🔎</span>,
    title: 'Adjustable depth',
    description:
      'Choose Snapshot (3 bullets), Standard (full summary), or Deep Dive (every tip, nothing skipped).',
  },
]

export default function WhyDifferent() {
  return (
    <section className="py-24 px-4 sm:px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-accent text-sm font-medium uppercase tracking-widest mb-3">
            What makes it different
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Built for people who actually use this stuff
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <div
              key={i}
              className="bg-white border border-gray-100 rounded-xl p-6 card-hover"
            >
              <div className="mb-4">{f.icon}</div>
              <h3 className="text-base font-semibold mb-2 text-gray-900">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
