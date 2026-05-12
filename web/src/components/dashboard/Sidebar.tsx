type Section = 'overview' | 'summaries' | 'profile'

interface Props {
  active: Section
  onSelect: (s: Section) => void
  userName: string
  avatarUrl?: string | null
  onSignOut: () => void
}

const navItems: { id: Section; label: string }[] = [
  { id: 'summaries', label: 'Summaries' },
  { id: 'overview', label: 'Overview' },
  { id: 'profile', label: 'Profile' },
]

function DefaultAvatar() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-gray-500">
      <path d="M12 12c2.67 0 8 1.34 8 4v2H4v-2c0-2.66 5.33-4 8-4zm0-2a4 4 0 100-8 4 4 0 000 8z" />
    </svg>
  )
}

export default function Sidebar({ active, onSelect, userName, avatarUrl, onSignOut }: Props) {
  const initial = userName?.charAt(0)?.toUpperCase()

  return (
    <aside className="hidden lg:flex flex-col w-56 shrink-0 bg-black h-screen sticky top-0">
      {/* Logo */}
      <div className="px-6 py-7 border-b border-white/10">
        <span className="text-white font-extrabold text-2xl tracking-tight">ReelRead</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-6 space-y-0.5">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={`w-full flex items-center text-sm font-medium transition-colors text-left py-2.5 px-3 rounded-sm ${
              active === item.id
                ? 'text-white border-l-[3px] border-white bg-white/8 pl-[9px]'
                : 'text-gray-500 hover:text-gray-200 border-l-[3px] border-transparent pl-[9px]'
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {/* User section */}
      <div className="border-t border-white/10 px-5 py-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-black text-sm font-bold shrink-0 overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : initial ? (
              initial
            ) : (
              <DefaultAvatar />
            )}
          </div>
          <span className="text-sm text-gray-300 truncate font-medium">
            {userName || 'User'}
          </span>
        </div>
        <button
          onClick={onSignOut}
          className="text-xs text-gray-600 hover:text-red-400 transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}
