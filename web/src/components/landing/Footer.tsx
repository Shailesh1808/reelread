import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 py-10 px-4 sm:px-6 bg-white">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-accent font-bold">ReelRead</span>
          <span className="text-gray-400 text-sm">reelread.com</span>
        </div>

        <div className="flex items-center gap-6 text-sm text-gray-400">
          <Link href="/privacy" className="hover:text-gray-900 transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-gray-900 transition-colors">
            Terms of Service
          </Link>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </div>
    </footer>
  )
}
