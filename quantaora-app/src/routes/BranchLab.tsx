import { useMemo, useState, type ReactNode } from 'react'
import {
  Dna,
  Atom,
  FlaskConical,
  Sigma,
  Orbit,
  Eye,
  HelpCircle,
  ArrowLeftRight,
  MessageCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Compass,
  type LucideIcon,
} from 'lucide-react'
import { useParams, Navigate } from 'react-router-dom'
import { HIERARCHY } from '@/data/hierarchy'
import { branchComponents } from '@/data/branchModules'
import { resolveContent } from '@/data/allContent'
import { componentAssetResolution } from '@/data/modelRegistry'
import type { SubjectId } from '@/data/types'
import { resolveBranchAssetPresentation } from './branchLabAssetPresentation'
import GenericViewer from '@/components/explorer/GenericViewer'
import CanvasControls from '@/components/explorer/CanvasControls'
import DetailPanel from '@/components/explorer/DetailPanel'
import ContentNav from '@/components/explorer/ContentNav'
import BottomTray from '@/components/explorer/BottomTray'
import LessonModal from '@/components/explorer/LessonModal'
import QuizModal from '@/components/explorer/QuizModal'
import CompareModal from '@/components/explorer/CompareModal'
import { Button } from '@/components/ui/Button'
import { BranchCauseEffectPanel as SharedBranchCauseEffectPanel, type GenericCauseControls } from '@/components/labs/BranchCauseEffectPanel'
import {
  BRANCH_CAUSE_EFFECT_CONFIGS as SHARED_BRANCH_CAUSE_EFFECT_CONFIGS,
  DEFAULT_ANIMALS_CONTROLS,
  DEFAULT_BIOCHEM_LINKS_CONTROLS,
  DEFAULT_CELL_CONTROLS,
  DEFAULT_EVOLUTION_CONTROLS,
  DEFAULT_PHYSIOLOGY_CONTROLS,
} from '@/data/branchCauseEffectConfigs'
import {
  BiochemCauseEffectPanel,
  DEFAULT_BIOCHEM_CONTROLS,
  DEFAULT_FLUID_CONTROLS,
  DEFAULT_HEALTH_CONTROLS,
  DEFAULT_HEAT_CONTROLS,
  DEFAULT_NEURO_CONTROLS,
  DEFAULT_SOUND_CONTROLS,
  FluidsCauseEffectPanel,
  HealthCauseEffectPanel,
  HeatCauseEffectPanel,
  NeuroCauseEffectPanel,
  SoundCauseEffectPanel,
  type BiochemControlsState,
  type FluidControlsState,
  type HealthControlsState,
  type HeatControlsState,
  type NeuroControlsState,
  type SoundControlsState,
} from '@/components/labs/BranchBespokeCauseEffectPanels'
import { branchCameraConfig } from './branchLabCamera'
import GraphsFunctionsControlPanel from '@/components/graphs-functions/GraphsFunctionsControlPanel'
import TrigonometryFoundationsLab from './TrigonometryFoundationsLab'

const SUBJECT_META: Record<SubjectId, { icon: LucideIcon; color: string; name: string }> = {
  biology: { icon: Dna, color: 'var(--color-biology-deep)', name: 'Biology' },
  physics: { icon: Atom, color: 'var(--color-physics-deep)', name: 'Physics' },
  chemistry: { icon: FlaskConical, color: 'var(--color-chemistry-deep)', name: 'Chemistry' },
  math: { icon: Sigma, color: 'var(--color-math-deep)', name: 'Math' },
  space: { icon: Orbit, color: 'var(--color-space-deep)', name: 'Space' },
}

const ZOOM_STEP = 0.55

/** Same Observe → Predict → Change → Explain → Check pattern used by the
 *  flagship labs (e.g. StarsLab), built entirely from fields every branch
 *  component already authors (lesson.predictionPrompt / practiceItem /
 *  checkpoint) so it works for any branch without inventing new content. */
function MissionStep({
  icon: Icon,
  label,
  body,
  action,
}: {
  icon: LucideIcon
  label: string
  body: string
  action?: ReactNode
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--color-brand)]" strokeWidth={1.75} />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">{label}</p>
        <p className="mt-0.5 text-sm leading-relaxed text-[color:var(--color-ink-700)]">{body}</p>
        {action && <div className="mt-2">{action}</div>}
      </div>
    </div>
  )
}

export default function BranchLab() {
  const { branchId } = useParams<{ branchId: string }>()
  const subject = Object.values(HIERARCHY).find((h) =>
    h.branches.some((b) => b.id === branchId),
  )
  const branch = subject?.branches.find((b) => b.id === branchId)
  const components = useMemo(() => branchComponents(branchId ?? ''), [branchId])
  const initialCameraConfig = branchCameraConfig(components[0]?.id)

  const [activeId, setActiveId] = useState<string | null>(components[0]?.id ?? null)
  const [activeHotspotId, setActiveHotspotId] = useState<string | null>(null)
  const [autoRotate, setAutoRotate] = useState(true)
  const [cameraDistance, setCameraDistance] = useState(initialCameraConfig.defaultDistance)
  const [labelsVisible, setLabelsVisible] = useState(false)
  const [xrayActive, setXrayActive] = useState(false)
  const [animationAvailable, setAnimationAvailable] = useState(false)
  const [animationPlaying, setAnimationPlaying] = useState(true)
  const [cleanView, setCleanView] = useState(false)
  const [resetSignal, setResetSignal] = useState(0)
  const [lessonOpen, setLessonOpen] = useState(false)
  const [quizOpen, setQuizOpen] = useState(false)
  const [compareOpen, setCompareOpen] = useState(false)
  const [missionOpen, setMissionOpen] = useState(true)
  const [soundControls, setSoundControls] = useState<SoundControlsState>(DEFAULT_SOUND_CONTROLS)
  const [fluidControls, setFluidControls] = useState<FluidControlsState>(DEFAULT_FLUID_CONTROLS)
  const [heatControls, setHeatControls] = useState<HeatControlsState>(DEFAULT_HEAT_CONTROLS)
  const [healthControls, setHealthControls] = useState<HealthControlsState>(DEFAULT_HEALTH_CONTROLS)
  const [neuroControls, setNeuroControls] = useState<NeuroControlsState>(DEFAULT_NEURO_CONTROLS)
  const [biochemControls, setBiochemControls] = useState<BiochemControlsState>(DEFAULT_BIOCHEM_CONTROLS)
  const [cellControls, setCellControls] = useState<GenericCauseControls>(DEFAULT_CELL_CONTROLS)
  const [evolutionControls, setEvolutionControls] = useState<GenericCauseControls>(DEFAULT_EVOLUTION_CONTROLS)
  const [animalsControls, setAnimalsControls] = useState<GenericCauseControls>(DEFAULT_ANIMALS_CONTROLS)
  const [biochemLinksControls, setBiochemLinksControls] = useState<GenericCauseControls>(DEFAULT_BIOCHEM_LINKS_CONTROLS)
  const [physiologyControls, setPhysiologyControls] = useState<GenericCauseControls>(DEFAULT_PHYSIOLOGY_CONTROLS)

  const resolvedContent = resolveContent(activeId ?? '')
  // DetailPanel always renders "The {content.system}" as the eyebrow label.
  // A handful of authored `system` strings already start with "The " (e.g.
  // atoms-and-elements' "The smallest piece of matter"), which doubles up to
  // "THE THE SMALLEST PIECE OF MATTER" once DetailPanel uppercases it (see
  // 10-branchlab-atoms-and-elements__desktop.png). The dedicated lab routes
  // (AtomsLab.tsx, ChemicalReactionsLab.tsx, MathManipulativesLab.tsx) already
  // strip this leading "The " before handing content to DetailPanel; mirror
  // that here so the generic branch path gets the same fix.
  const content = resolvedContent
    ? { ...resolvedContent, system: resolvedContent.system.replace(/^The\s+/i, '') }
    : resolvedContent
  const compareTarget = content?.compareCandidate ? resolveContent(content.compareCandidate) : null
  const assetResolution = content ? componentAssetResolution(content) : undefined
  // REVIEW-status assets normally fall back here, except the current
  // human-anatomy organ set used by this non-paid prototype. See
  // branchLabAssetPresentation.ts for the exact policy and tests.
  const { modelUrl, footerNote } = resolveBranchAssetPresentation(assetResolution)

  const selectComponent = (id: string) => {
    setActiveId(id)
    setActiveHotspotId(null)
    setCameraDistance(branchCameraConfig(id).defaultDistance)
    setXrayActive(false)
    setAnimationAvailable(false)
    setAnimationPlaying(true)
    setResetSignal((s) => s + 1)
  }

  if (!branchId || !subject || !branch || !content || !activeId) {
    return <Navigate to="/app/labs" replace />
  }

  if (branch.id === 'trigonometry-foundations') {
    return <TrigonometryFoundationsLab />
  }

  const meta = SUBJECT_META[subject.id]
  const otherBranches = subject.branches.filter((b) => b.id !== branch.id)
  const activeHotspot =
    content.hotspots.find((h) => h.id === activeHotspotId) ?? null
  const isolateActive = activeHotspotId !== null
  const activeIndex = components.findIndex((c) => c.id === activeId)
  const activeCameraConfig = branchCameraConfig(activeId)
  const renderConfigDrivenPanel = () => {
    if (branch.id === 'cell-biology') {
      return <SharedBranchCauseEffectPanel activeId={activeId} config={SHARED_BRANCH_CAUSE_EFFECT_CONFIGS['cell-biology']} controls={cellControls} onChange={setCellControls} />
    }
    if (branch.id === 'evolution') {
      return <SharedBranchCauseEffectPanel activeId={activeId} config={SHARED_BRANCH_CAUSE_EFFECT_CONFIGS.evolution} controls={evolutionControls} onChange={setEvolutionControls} />
    }
    if (branch.id === 'animals') {
      return <SharedBranchCauseEffectPanel activeId={activeId} config={SHARED_BRANCH_CAUSE_EFFECT_CONFIGS.animals} controls={animalsControls} onChange={setAnimalsControls} />
    }
    if (branch.id === 'biochemistry-links') {
      return <SharedBranchCauseEffectPanel activeId={activeId} config={SHARED_BRANCH_CAUSE_EFFECT_CONFIGS['biochemistry-links']} controls={biochemLinksControls} onChange={setBiochemLinksControls} />
    }
    if (branch.id === 'human-physiology') {
      return <SharedBranchCauseEffectPanel activeId={activeId} config={SHARED_BRANCH_CAUSE_EFFECT_CONFIGS['human-physiology']} controls={physiologyControls} onChange={setPhysiologyControls} />
    }
    return null
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside className="hidden shrink-0 overflow-y-auto border-r border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] lg:order-1 lg:block lg:w-[260px]">
          <ContentNav
            subjectName={meta.name}
            subjectColor={meta.color}
            defaultIcon={meta.icon}
            branchName={branch.name}
            items={components.map((c) => ({ id: c.id, name: c.name, meta: c.scientificName }))}
            activeItemId={activeId}
            onSelect={selectComponent}
            otherBranches={otherBranches}
            footerNote={footerNote}
          />
        </aside>

        <div data-lab-stage data-clean-view={cleanView ? 'true' : undefined} className="relative order-1 h-[46svh] shrink-0 lg:order-2 lg:h-auto lg:flex-1">
          <CanvasControls
            autoRotate={autoRotate}
            onToggleAutoRotate={() => setAutoRotate((v) => !v)}
            isolateActive={isolateActive}
            onToggleIsolate={() =>
              setActiveHotspotId((id) =>
                id ? null : content.hotspots[0]?.id ?? null,
              )
            }
            onCompare={() => setCompareOpen(true)}
            compareDisabled={!compareTarget}
            onZoomIn={() =>
              setCameraDistance((distance) =>
                Math.max(activeCameraConfig.minDistance, Number((distance - ZOOM_STEP).toFixed(2))),
              )
            }
            onZoomOut={() =>
              setCameraDistance((distance) =>
                Math.min(activeCameraConfig.maxDistance, Number((distance + ZOOM_STEP).toFixed(2))),
              )
            }
            zoomInDisabled={cameraDistance <= activeCameraConfig.minDistance}
            zoomOutDisabled={cameraDistance >= activeCameraConfig.maxDistance}
            labelsVisible={labelsVisible}
            onToggleLabels={() => setLabelsVisible((v) => !v)}
            xrayActive={xrayActive}
            onToggleXray={() => setXrayActive((v) => !v)}
            animationAvailable={animationAvailable}
            animationPlaying={animationPlaying}
            onToggleAnimation={() => setAnimationPlaying((v) => !v)}
            cleanViewActive={cleanView}
            onToggleCleanView={() => setCleanView((v) => !v)}
            onFitView={() => {
              setCameraDistance(activeCameraConfig.defaultDistance)
              setResetSignal((s) => s + 1)
            }}
            onReset={() => {
              setActiveHotspotId(null)
              setAutoRotate(true)
              setCameraDistance(activeCameraConfig.defaultDistance)
              setXrayActive(false)
              setAnimationPlaying(true)
              setCleanView(false)
              setResetSignal((s) => s + 1)
            }}
          />

          <div data-canvas-overlay className="pointer-events-none absolute inset-x-0 top-20 z-10 flex justify-center px-4 sm:top-4">
            <div className="max-w-[calc(100%-11rem)] truncate rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/90 px-3.5 py-1.5 text-center text-[11px] font-medium uppercase tracking-wide text-[color:var(--color-ink-500)] backdrop-blur-sm">
              <span className="sm:hidden">Tap a dot to explore</span>
              <span className="hidden sm:inline">{content.name} · drag to rotate · tap a dot to explore</span>
            </div>
          </div>

          <GenericViewer
            subject={subject.id}
            branch={branch.id}
            url={modelUrl}
            visual={content.visual}
            hotspots={content.hotspots}
            activeHotspotId={activeHotspotId}
            onSelectHotspot={(id) =>
              setActiveHotspotId((cur) => (cur === id ? null : id))
            }
            autoRotate={autoRotate}
            resetSignal={resetSignal}
            cameraDistance={cameraDistance}
            minCameraDistance={activeCameraConfig.minDistance}
            maxCameraDistance={activeCameraConfig.maxDistance}
            labelsVisible={labelsVisible}
            xrayActive={xrayActive}
            animationPlaying={animationPlaying}
            onAnimationAvailability={setAnimationAvailable}
          />
          {branch.id === 'graphs-and-functions' && (
            <GraphsFunctionsControlPanel key={content.id} content={content} />
          )}
        </div>

        <aside className="order-2 min-h-0 flex-1 overflow-y-auto border-t border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] pb-44 lg:order-3 lg:w-[360px] lg:flex-none lg:border-l lg:border-t-0 lg:pb-0">
          {/* Component switcher for every screen size, including mobile,
              where the ContentNav list in the left aside is hidden
              (lg:block only). Picking an item here drives the same
              selectComponent() path as the desktop list, so the 3D model
              visibly rebuilds around it. */}
          <div className="border-b border-[color:var(--color-border)] p-4 lg:hidden">
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">
              Component {activeIndex + 1} of {components.length}
            </p>
            <div className="mt-2.5 flex gap-1.5 overflow-x-auto pb-1">
              {components.map((c) => {
                const active = c.id === activeId
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => selectComponent(c.id)}
                    title={c.name}
                    aria-current={active}
                    className="flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-left text-xs font-medium transition-colors"
                    style={
                      active
                        ? {
                            borderColor: `color-mix(in oklch, ${meta.color} 30%, transparent)`,
                            background: `color-mix(in oklch, ${meta.color} 12%, var(--color-surface-raised))`,
                            color: meta.color,
                          }
                        : {
                            borderColor: 'var(--color-border)',
                            color: 'var(--color-ink-500)',
                          }
                    }
                  >
                    <meta.icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                    <span className="max-w-[7rem] truncate">{c.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {branch.id === 'sound' && (
            <SoundCauseEffectPanel activeId={activeId} controls={soundControls} onChange={setSoundControls} />
          )}
          {branch.id === 'fluids' && (
            <FluidsCauseEffectPanel activeId={activeId} controls={fluidControls} onChange={setFluidControls} />
          )}
          {branch.id === 'heat-and-thermodynamics' && (
            <HeatCauseEffectPanel activeId={activeId} controls={heatControls} onChange={setHeatControls} />
          )}
          {branch.id === 'health-and-disease' && (
            <HealthCauseEffectPanel activeId={activeId} controls={healthControls} onChange={setHealthControls} />
          )}
          {branch.id === 'neuroscience' && (
            <NeuroCauseEffectPanel activeId={activeId} controls={neuroControls} onChange={setNeuroControls} />
          )}
          {branch.id === 'biochemistry-foundations' && (
            <BiochemCauseEffectPanel activeId={activeId} controls={biochemControls} onChange={setBiochemControls} />
          )}
          {renderConfigDrivenPanel()}

          {/* Observe → Predict → Change → Explain → Check, built entirely
              from fields every branch component already authors. Open by
              default so the branch routes teach with a visible mission, not
              just a passive model. */}
          <div className="border-b border-[color:var(--color-border)]">
            <button
              type="button"
              onClick={() => setMissionOpen((v) => !v)}
              aria-expanded={missionOpen}
              className="flex w-full items-center justify-between gap-2 p-4 text-left"
            >
              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">
                <Compass className="h-3.5 w-3.5" strokeWidth={1.75} />
                Challenge: {content.name}
              </span>
              {missionOpen ? (
                <ChevronUp className="h-4 w-4 text-[color:var(--color-ink-500)]" strokeWidth={1.75} />
              ) : (
                <ChevronDown className="h-4 w-4 text-[color:var(--color-ink-500)]" strokeWidth={1.75} />
              )}
            </button>

            {missionOpen && (
              <div className="space-y-4 px-4 pb-4">
                <MissionStep
                  icon={Eye}
                  label="Observe"
                  body={`Rotate ${content.name} and tap a highlighted dot on the model to see how it's built.`}
                />
                <MissionStep icon={HelpCircle} label="Predict" body={content.lesson.predictionPrompt} />
                <MissionStep
                  icon={ArrowLeftRight}
                  label="Change"
                  body={
                    components.length > 1
                      ? `Pick a different component above${compareTarget ? ' or use Compare' : ''} and watch the model rebuild around it.`
                      : 'Toggle isolate or labels in the tool rail and watch the model respond.'
                  }
                />
                <MissionStep icon={MessageCircle} label="Explain" body={content.lesson.practiceItem} />
                <MissionStep
                  icon={CheckCircle2}
                  label="Check"
                  body={content.lesson.checkpoint}
                  action={
                    <Button size="sm" variant="secondary" onClick={() => setQuizOpen(true)}>
                      Open checkpoint
                    </Button>
                  }
                />
              </div>
            )}
          </div>

          <DetailPanel
            content={content}
            activeHotspot={activeHotspot}
            onClearHotspot={() => setActiveHotspotId(null)}
            onOpenLesson={() => setLessonOpen(true)}
          />
        </aside>
      </div>

      <BottomTray
        content={content}
        onOpenLesson={() => setLessonOpen(true)}
        onOpenQuiz={() => setQuizOpen(true)}
        labState={
          branch.id === 'sound'
            ? { soundControls }
            : branch.id === 'fluids'
              ? { fluidControls }
              : branch.id === 'heat-and-thermodynamics'
                ? { heatControls }
                : branch.id === 'health-and-disease'
                  ? { healthControls }
                  : branch.id === 'neuroscience'
                    ? { neuroControls }
                    : branch.id === 'biochemistry-foundations'
                      ? { biochemControls }
                      : branch.id === 'cell-biology'
                        ? { cellControls }
                        : branch.id === 'evolution'
                          ? { evolutionControls }
                          : branch.id === 'animals'
                            ? { animalsControls }
                            : branch.id === 'biochemistry-links'
                              ? { biochemLinksControls }
                              : branch.id === 'human-physiology'
                                ? { physiologyControls }
                                : undefined
        }
      />

      <LessonModal
        content={content}
        open={lessonOpen}
        onClose={() => setLessonOpen(false)}
        onStartQuiz={() => setQuizOpen(true)}
      />
      <QuizModal
        content={content}
        open={quizOpen}
        onClose={() => setQuizOpen(false)}
      />
      <CompareModal
        content={content}
        candidate={compareTarget}
        open={compareOpen}
        onClose={() => setCompareOpen(false)}
      />
    </div>
  )
}
