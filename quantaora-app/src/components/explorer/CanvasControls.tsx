import { useEffect, useRef, useState } from 'react'
import {
  RotateCcw,
  Circle,
  Scissors,
  RefreshCcw,
  Shapes,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  ScanSearch,
  Eye,
  EyeOff,
  Blend,
  Play,
  Pause,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

function ToolButton({
  icon: Icon,
  label,
  title,
  active,
  disabled,
  onClick,
}: {
  icon: LucideIcon
  label: string
  title?: string
  active?: boolean
  disabled?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      title={title ?? label}
      className={cn(
        'group flex min-w-0 flex-1 items-center justify-center rounded-[var(--radius-sm)] px-1 py-2 text-[color:var(--color-ink-500)] transition-colors sm:w-full sm:flex-none sm:flex-col sm:gap-0 sm:px-1.5 sm:py-1',
        disabled && 'cursor-not-allowed opacity-35',
        !disabled &&
          (active
            ? 'bg-[color:var(--color-brand-soft)] text-[color:var(--color-brand-strong)]'
            : 'hover:bg-[color:var(--color-surface)] hover:text-[color:var(--color-foreground)]'),
      )}
    >
      <Icon className="h-4 w-4 sm:h-4 sm:w-4" strokeWidth={1.75} />
      <span className="hidden max-w-12 text-center text-[9px] font-medium leading-tight sm:block">{label}</span>
    </button>
  )
}

/** Same rail, same order, used by every 3D lab (Biology, Chemistry, Space) — only the
 *  tools that are actually implemented for that content type are passed in. */
export default function CanvasControls({
  autoRotate,
  onToggleAutoRotate,
  isolateActive,
  onToggleIsolate,
  crossSection,
  onToggleCrossSection,
  onCompare,
  compareDisabled,
  onZoomIn,
  onZoomOut,
  zoomInDisabled,
  zoomOutDisabled,
  labelsVisible,
  onToggleLabels,
  xrayActive,
  onToggleXray,
  animationAvailable,
  animationPlaying = true,
  onToggleAnimation,
  cleanViewActive,
  onToggleCleanView,
  onFitView,
  onReset,
}: {
  autoRotate: boolean
  onToggleAutoRotate: () => void
  isolateActive: boolean
  onToggleIsolate: () => void
  crossSection?: boolean
  onToggleCrossSection?: () => void
  onCompare: () => void
  compareDisabled: boolean
  onZoomIn?: () => void
  onZoomOut?: () => void
  zoomInDisabled?: boolean
  zoomOutDisabled?: boolean
  labelsVisible?: boolean
  onToggleLabels?: () => void
  xrayActive?: boolean
  onToggleXray?: () => void
  animationAvailable?: boolean
  animationPlaying?: boolean
  onToggleAnimation?: () => void
  cleanViewActive?: boolean
  onToggleCleanView?: () => void
  onFitView?: () => void
  onReset: () => void
}) {
  const controlsRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)

  useEffect(() => {
    const handleFullscreenChange = () => {
      const stage = controlsRef.current?.closest('[data-lab-stage]')
      setIsFullscreen(!!stage && document.fullscreenElement === stage)
    }

    handleFullscreenChange()
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const toggleFullscreen = () => {
    const stage = controlsRef.current?.closest('[data-lab-stage]') as HTMLElement | null
    if (!stage) return

    if (document.fullscreenElement) {
      void document.exitFullscreen()
      return
    }

    void stage.requestFullscreen()
  }
  const animationIsPlaying = !!animationAvailable && animationPlaying

  if (cleanViewActive) {
    return (
      <button
        type="button"
        onClick={onToggleCleanView}
        title="Show controls"
        className="absolute left-4 top-4 z-30 inline-flex h-11 items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/95 px-3 text-xs font-semibold text-[color:var(--color-foreground)] shadow-[var(--shadow-tactile)] backdrop-blur-sm"
      >
        <Eye className="h-4 w-4" strokeWidth={1.75} />
        Show UI
      </button>
    )
  }

  return (
    <div
      ref={controlsRef}
      data-canvas-controls
      className="absolute inset-x-3 top-3 z-30 flex max-w-[calc(100%-1.5rem)] gap-0.5 overflow-visible rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/95 p-1.5 shadow-[var(--shadow-tactile)] backdrop-blur-sm sm:left-4 sm:right-auto sm:top-4 sm:w-14 sm:flex-col sm:gap-0.5 sm:p-1"
    >
      <ToolButton icon={RotateCcw} label="Rotate" active={autoRotate} onClick={onToggleAutoRotate} />
      <ToolButton
        icon={animationIsPlaying ? Pause : Play}
        label={animationIsPlaying ? 'Pause' : 'Play'}
        title={animationAvailable ? 'Play or pause model animation' : 'No embedded GLB animation'}
        active={animationIsPlaying}
        disabled={!animationAvailable || !onToggleAnimation}
        onClick={onToggleAnimation}
      />
      <ToolButton icon={Circle} label="Isolate" active={isolateActive} onClick={onToggleIsolate} />
      <ToolButton
        icon={Scissors}
        label="Section"
        active={crossSection}
        disabled={!onToggleCrossSection}
        onClick={onToggleCrossSection}
      />
      <ToolButton icon={Shapes} label="Compare" disabled={compareDisabled} onClick={onCompare} />
      <ToolButton icon={ZoomIn} label="Zoom In" disabled={!onZoomIn || zoomInDisabled} onClick={onZoomIn} />
      <ToolButton icon={ZoomOut} label="Zoom Out" disabled={!onZoomOut || zoomOutDisabled} onClick={onZoomOut} />
      <ToolButton
        icon={isFullscreen ? Minimize2 : Maximize2}
        label={isFullscreen ? 'Exit' : 'Full'}
        title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        active={isFullscreen}
        onClick={toggleFullscreen}
      />
      <ToolButton icon={MoreHorizontal} label="More" title="More tools" active={moreOpen} onClick={() => setMoreOpen((v) => !v)} />
      <ToolButton icon={RefreshCcw} label="Reset" onClick={onReset} />
      {moreOpen && (
        <div className="absolute right-0 top-full z-40 mt-2 w-44 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-1.5 shadow-[var(--shadow-tactile-lg)] sm:left-full sm:right-auto sm:top-0 sm:ml-2 sm:mt-0">
          <button
            type="button"
            onClick={() => {
              onToggleLabels?.()
              setMoreOpen(false)
            }}
            disabled={!onToggleLabels}
            className={cn(
              'flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-left text-xs font-medium transition-colors',
              onToggleLabels
                ? 'text-[color:var(--color-foreground)] hover:bg-[color:var(--color-surface)]'
                : 'cursor-not-allowed text-[color:var(--color-ink-300)]',
            )}
          >
            {labelsVisible ? <EyeOff className="h-4 w-4" strokeWidth={1.75} /> : <Eye className="h-4 w-4" strokeWidth={1.75} />}
            {labelsVisible ? 'Hide labels' : 'Show labels'}
          </button>
          <button
            type="button"
            onClick={() => {
              onToggleXray?.()
              setMoreOpen(false)
            }}
            disabled={!onToggleXray}
            className={cn(
              'flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-left text-xs font-medium transition-colors',
              onToggleXray
                ? 'text-[color:var(--color-foreground)] hover:bg-[color:var(--color-surface)]'
                : 'cursor-not-allowed text-[color:var(--color-ink-300)]',
            )}
          >
            <Blend className="h-4 w-4" strokeWidth={1.75} />
            {xrayActive ? 'Turn off X-Ray' : 'X-Ray view'}
          </button>
          <button
            type="button"
            onClick={() => {
              onFitView?.()
              setMoreOpen(false)
            }}
            disabled={!onFitView}
            className={cn(
              'flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-left text-xs font-medium transition-colors',
              onFitView
                ? 'text-[color:var(--color-foreground)] hover:bg-[color:var(--color-surface)]'
                : 'cursor-not-allowed text-[color:var(--color-ink-300)]',
            )}
          >
            <ScanSearch className="h-4 w-4" strokeWidth={1.75} />
            Fit view
          </button>
          <button
            type="button"
            onClick={() => {
              onToggleCleanView?.()
              setMoreOpen(false)
            }}
            disabled={!onToggleCleanView}
            className={cn(
              'flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-left text-xs font-medium transition-colors',
              onToggleCleanView
                ? 'text-[color:var(--color-foreground)] hover:bg-[color:var(--color-surface)]'
                : 'cursor-not-allowed text-[color:var(--color-ink-300)]',
            )}
          >
            <EyeOff className="h-4 w-4" strokeWidth={1.75} />
            Clean view
          </button>
        </div>
      )}
    </div>
  )
}
