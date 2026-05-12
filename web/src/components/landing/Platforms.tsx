import { FaInstagram, FaTiktok, FaWhatsapp } from 'react-icons/fa6'

const platforms = [
  {
    name: 'Instagram Reels',
    icon: <FaInstagram className="w-12 h-12" style={{ color: '#E1306C' }} />,
    description: 'Paste any Reel URL from Instagram',
    example: 'instagram.com/reel/...',
  },
  {
    name: 'TikTok Videos',
    icon: <FaTiktok className="w-12 h-12" style={{ color: '#010101' }} />,
    description: 'Paste any TikTok video URL',
    example: 'tiktok.com/@user/video/...',
  },
]

export default function Platforms() {
  return (
    <section className="py-24 px-4 sm:px-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-accent text-sm font-medium uppercase tracking-widest mb-3">
            Supported platforms
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Where it works</h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
          {platforms.map((p, i) => (
            <div
              key={i}
              className="bg-white border border-gray-100 rounded-xl p-8 text-center card-hover"
            >
              <div className="flex justify-center mb-4">{p.icon}</div>
              <h3 className="text-lg font-semibold mb-1 text-gray-900">{p.name}</h3>
              <p className="text-gray-500 text-sm mb-3">{p.description}</p>
              <code className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {p.example}
              </code>
            </div>
          ))}
        </div>

        <p className="text-center text-gray-400 text-sm mt-8">
          YouTube Shorts support coming soon
        </p>
      </div>
    </section>
  )
}
