import { useEffect } from 'react'
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom'
import { Compass, Layers, FlaskConical, NotebookPen, Users, ArrowLeft, Rocket, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'
import { HIERARCHY } from '@/data/hierarchy'

const NAV = [
  { to: '/app', label: 'Explore', icon: Compass, end: true },
  { to: '/app/subjects', label: 'Subjects', icon: Layers },
  { to: '/app/labs', label: 'Labs', icon: FlaskConical },
  { to: '/app/notebook', label: 'Notebook', icon: NotebookPen },
  { to: '/app/grownups', label: 'Parent/Teacher', icon: Users },
]

const LAB_ROUTE_FALLBACKS: Record<string, { name: string; subject: string }> = {
  '/app/labs/molecules': { name: 'Molecules And Bonding', subject: 'Chemistry' },
  '/app/labs/orbit': { name: 'Solar System', subject: 'Space' },
  '/app/labs/atoms': { name: 'Atoms + Periodic Table', subject: 'Chemistry' },
  '/app/labs/functions': { name: 'Algebra', subject: 'Math' },
  '/app/labs/math-manipulatives': { name: 'Math Manipulatives', subject: 'Math' },
  '/app/labs/motion': { name: 'Mechanics', subject: 'Physics' },
  '/app/labs/physiology': { name: 'Human Physiology', subject: 'Biology' },
  '/app/labs/cells': { name: 'Cell Biology', subject: 'Biology' },
  '/app/labs/stars': { name: 'Stars', subject: 'Space' },
  '/app/labs/galaxies': { name: 'Galaxies', subject: 'Space' },
}

function resolveLabVisit(pathname: string) {
  if (!pathname.startsWith('/app/labs/') || pathname === '/app/labs') return null

  const matched = Object.values(HIERARCHY)
    .flatMap((subject) => subject.branches.map((branch) => ({ subject, branch })))
    .find(({ branch }) => branch.route === pathname)

  if (matched) {
    return {
      path: pathname,
      name: matched.branch.name,
      subject: matched.subject.name,
    }
  }

  const fallback = LAB_ROUTE_FALLBACKS[pathname]
  return fallback ? { path: pathname, ...fallback } : null
}

export default function AppShell() {
  const location = useLocation()
  const logTime = useAppStore((s) => s.logTime)
  const learnerProfile = useAppStore((s) => s.learnerProfile)
  const lastVisitedLab = useAppStore((s) => s.lastVisitedLab)
  const setLastVisitedLab = useAppStore((s) => s.setLastVisitedLab)

  useEffect(() => {
    const interval = setInterval(() => logTime(1), 60_000)
    return () => clearInterval(interval)
  }, [logTime])

  useEffect(() => {
    const lab = resolveLabVisit(location.pathname)
    if (lab) setLastVisitedLab(lab)
  }, [location.pathname, setLastVisitedLab])

  const continuePath =
    lastVisitedLab && lastVisitedLab.path !== location.pathname
      ? lastVisitedLab.path
      : learnerProfile?.recommendedLab

  return (
    <div className="flex h-[100svh] flex-col bg-[color:var(--color-background)]">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="flex h-8 w-8 items-center justify-center rounded-full text-[color:var(--color-ink-500)] transition-colors hover:bg-[color:var(--color-surface)] hover:text-[color:var(--color-foreground)]"
            aria-label="Back to landing page"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <Link to="/app" className="font-[family-name:var(--font-display)] text-lg text-[color:var(--color-foreground)]">
            Quantaora
          </Link>
        </div>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-[color:var(--color-brand-soft)] text-[color:var(--color-brand-strong)]'
                    : 'text-[color:var(--color-ink-500)] hover:bg-[color:var(--color-surface)] hover:text-[color:var(--color-foreground)]',
                )
              }
            >
              <item.icon className="h-4 w-4" strokeWidth={1.75} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {continuePath && (
            <Link
              to={continuePath}
              className="hidden items-center gap-1.5 rounded-full bg-[color:var(--color-surface)] px-3 py-1.5 text-xs font-semibold text-[color:var(--color-brand-strong)] transition-colors hover:bg-[color:var(--color-brand-soft)] sm:flex"
            >
              <Rocket className="h-3.5 w-3.5" strokeWidth={1.8} />
              Continue
            </Link>
          )}
          <Link
            to="/first-flight"
            className="flex h-9 min-w-9 items-center justify-center rounded-full bg-[color:var(--color-brand)] px-2.5 text-xs font-semibold text-white"
            aria-label={learnerProfile ? `Edit ${learnerProfile.name}'s profile` : 'Create learner profile'}
          >
            {learnerProfile ? (
              <span className="max-w-20 truncate">{learnerProfile.name}</span>
            ) : (
              <User className="h-4 w-4" strokeWidth={1.8} />
            )}
          </Link>
        </div>
      </header>

      <main className="min-h-0 flex-1">
        <Outlet />
      </main>

      <nav className="flex shrink-0 items-center justify-around border-t border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] py-1.5 md:hidden">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex min-w-[3.5rem] flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-[10px] font-medium transition-colors',
                isActive ? 'text-[color:var(--color-brand-strong)]' : 'text-[color:var(--color-ink-500)]',
              )
            }
          >
            <item.icon className="h-5 w-5" strokeWidth={1.75} />
            {item.label === 'Parent/Teacher' ? 'Parent' : item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
