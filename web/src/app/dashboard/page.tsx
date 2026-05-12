'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { User, Summary } from '@/types'
import Sidebar from '@/components/dashboard/Sidebar'
import BottomNav from '@/components/dashboard/BottomNav'
import Overview from '@/components/dashboard/Overview'
import Summaries from '@/components/dashboard/Summaries'
import Profile from '@/components/dashboard/Profile'
import { SummariesSkeleton, OverviewSkeleton } from '@/components/dashboard/Skeleton'

type Section = 'overview' | 'summaries' | 'profile'

function SidebarSkeleton() {
  return (
    <aside className="hidden lg:flex flex-col w-56 shrink-0 bg-black h-screen">
      <div className="px-6 py-7 border-b border-white/10">
        <span className="text-white font-extrabold text-2xl tracking-tight">ReelRead</span>
      </div>
      <nav className="flex-1 px-3 py-6 space-y-2">
        {['Summaries', 'Overview', 'Profile'].map((label) => (
          <div key={label} className="h-9 shimmer rounded opacity-20 mx-1" />
        ))}
      </nav>
      <div className="border-t border-white/10 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full shimmer opacity-20" />
          <div className="h-3 shimmer rounded w-24 opacity-20" />
        </div>
      </div>
    </aside>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [summaries, setSummaries] = useState<Summary[]>([])
  const [section, setSection] = useState<Section>('summaries')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (res.status === 401) {
          router.replace('/register')
          return null
        }
        return res.json()
      })
      .then((data) => {
        if (!data) return
        setUser(data.user)
        setSummaries(data.summaries ?? [])
      })
      .catch(() => router.replace('/register'))
      .finally(() => setLoading(false))
  }, [router])

  const handleSignOut = async () => {
    await fetch('/api/auth/signout', { method: 'POST' })
    router.replace('/')
  }

  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      {loading ? (
        <SidebarSkeleton />
      ) : (
        <Sidebar
          active={section}
          onSelect={setSection}
          userName={user?.name ?? ''}
          avatarUrl={user?.avatar_url}
          onSignOut={handleSignOut}
        />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-black">
          <span className="text-white font-bold">ReelRead</span>
          {!loading && (
            <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-black text-xs font-bold overflow-hidden">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : user?.name?.charAt(0)?.toUpperCase() || (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-gray-500">
                  <path d="M12 12c2.67 0 8 1.34 8 4v2H4v-2c0-2.66 5.33-4 8-4zm0-2a4 4 0 100-8 4 4 0 000 8z" />
                </svg>
              )}
            </div>
          )}
        </header>

        {/* Desktop top bar */}
        <header className="hidden lg:flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
          <h1 className="text-sm font-semibold text-gray-900 capitalize">{section}</h1>
          {!loading && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">{user?.name}</span>
              {/* <button
                onClick={handleSignOut}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                Sign out
              </button> */}
            </div>
          )}
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-6 pb-24 lg:pb-8">
            {loading ? (
              section === 'overview' ? <OverviewSkeleton /> : <SummariesSkeleton />
            ) : user ? (
              <>
                {section === 'summaries' && <Summaries summaries={summaries} />}
                {section === 'overview' && <Overview user={user} summaries={summaries} />}
                {section === 'profile' && <Profile user={user} summaries={summaries} onSignOut={handleSignOut} onUserUpdate={setUser} />}
              </>
            ) : null}
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <BottomNav active={section} onSelect={setSection} />
    </div>
  )
}
