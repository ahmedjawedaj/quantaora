import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4"
    >
      <nav
        className={`flex w-full max-w-6xl items-center justify-between rounded-full border px-5 py-2.5 transition-all duration-300 ${
          scrolled
            ? 'border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/90 shadow-[var(--shadow-tactile)] backdrop-blur-md'
            : 'border-transparent bg-transparent'
        }`}
      >
        <Link to="/" className="flex items-center gap-2">
          <span className="font-[family-name:var(--font-display)] text-xl tracking-tight text-[color:var(--color-foreground)]">
            Quantaora
          </span>
          <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-brand)]" />
        </Link>

        <div className="hidden items-center gap-7 text-sm font-medium text-[color:var(--color-ink-700)] md:flex">
          <a href="#studio" className="transition-colors hover:text-[color:var(--color-foreground)]">
            Studio
          </a>
          <a href="#subjects" className="transition-colors hover:text-[color:var(--color-foreground)]">
            Subjects
          </a>
          <a href="#parents" className="transition-colors hover:text-[color:var(--color-foreground)]">
            For parents
          </a>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/app/labs/atoms">
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
              Try a demo lab
            </Button>
          </Link>
          <Link to="/first-flight">
            <Button variant="primary" size="sm">
              Start your mission
            </Button>
          </Link>
        </div>
      </nav>
    </motion.header>
  )
}
