import { Component, type ReactNode } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface RouteErrorBoundaryProps {
  children: ReactNode
}

interface RouteErrorBoundaryState {
  hasError: boolean
}

// Class component: React only supports error boundaries via getDerivedStateFromError /
// componentDidCatch, no hook equivalent exists. Catches lazy chunk-load failures (e.g. a stale
// deep link after a redeploy) as well as render errors within a single lazily-loaded route, so
// one broken route doesn't take down the whole app shell.
export default class RouteErrorBoundary extends Component<RouteErrorBoundaryProps, RouteErrorBoundaryState> {
  state: RouteErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    console.error('Route failed to load', error)
  }

  handleRetry = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="flex h-full min-h-[60svh] w-full flex-col items-center justify-center gap-4 bg-[color:var(--color-background)] px-6 py-16 text-center"
        >
          <p className="font-[family-name:var(--font-display)] text-lg text-[color:var(--color-foreground)]">
            Oops, this page had trouble loading.
          </p>
          <p className="max-w-xs text-sm text-[color:var(--color-ink-500)]">
            Check your connection and try again — your progress is safe.
          </p>
          <Button onClick={this.handleRetry} variant="primary" size="md">
            <RefreshCw className="h-4 w-4" strokeWidth={1.8} />
            Try again
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
