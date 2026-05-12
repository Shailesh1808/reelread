type Section = 'overview' | 'summaries' | 'profile'

interface Props {
  active: Section
  onSelect: (s: Section) => void
}

const navItems: { id: Section; label: string }[] = [
  { id: 'summaries', label: 'Summaries' },
  { id: 'overview', label: 'Overview' },
  { id: 'profile', label: 'Profile' },
]

export default function BottomNav({ active, onSelect }: Props) {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
      <div className="flex">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-3 text-xs font-medium transition-colors ${
              active === item.id
                ? 'text-black font-bold'
                : 'text-gray-400 hover:text-gray-700'
            }`}
          >
            {active === item.id && (
              <span className="w-4 h-0.5 bg-black rounded-full mb-0.5" />
            )}
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  )
}
