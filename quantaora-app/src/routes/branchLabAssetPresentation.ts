// Relative (not `@/...`) import: this module must also resolve when run
// directly by Node's native TS loader (`node --test`, see BranchLab.test.ts),
// which does not understand the Vite/tsconfig `@/` path alias.
import { isAssetReviewPending, type AssetResolution } from '../data/modelRegistry.ts'

/**
 * Pure (non-JSX) BranchLab helpers, split out of BranchLab.tsx so this exact
 * REVIEW/missing/CLEAR fallback-decision logic can be imported and exercised
 * directly by BranchLab.test.ts with Node's built-in test runner
 * (`node --test`) — Node's native TS loader cannot parse embedded JSX, so a
 * plain .ts module is required for the logic to be test-importable without
 * adding a new test-framework/JSX-transform dependency. BranchLab.tsx is the
 * only consumer of this module.
 */

/**
 * Child-facing replacement for `assetStatusLabel()` (modelRegistry.ts). That
 * helper's copy ("premium GLB sourcing needed", "provenance needs final
 * review", "licence blocks paid launch replacement") is written for the
 * internal asset-review pipeline, not a young learner — it must never reach
 * this sidebar, and none of that internal vocabulary (REVIEW, licenseStatus,
 * NC-RISK, "pending legal clearance", etc.) may leak into it either. When a
 * real, legally-clear GLB is wired we say nothing at all (never label a
 * working model "coming soon"); when the fallback illustration is showing —
 * whether because no GLB exists yet, it's a permanently-procedural concept
 * (e.g. "coefficient"), or (per `reviewPending`) this is a generic branch
 * showing a REVIEW-status asset whose licence hasn't cleared yet — we say so
 * plainly and positively. In every one of those cases what's on screen
 * genuinely is a purpose-built illustration, so the same honest,
 * non-alarming line covers all of them without overclaiming.
 */
export function childSafeAssetNote(resolution: AssetResolution, reviewPending: boolean): string | undefined {
  if (resolution.status === 'ready' && !reviewPending) return undefined
  return 'Illustrated 3D model, built to teach this topic clearly.'
}

export interface BranchAssetPresentation {
  /** GLB url to actually render, or undefined to fall back to the branch's
   *  procedural/illustrated composition (see GenericModel.tsx / resolve.ts) —
   *  never another branch's unrelated flagship model. */
  modelUrl: string | undefined
  /** Child-facing sidebar copy, or undefined when a real, cleared model is
   *  showing and nothing needs to be said. Must never leak internal
   *  licensing/QA vocabulary (REVIEW, licenseStatus, NC-RISK, "pending legal
   *  clearance", etc.). */
  footerNote: string | undefined
}

/**
 * Pure decision function for what BranchLab shows for a component's 3D asset.
 * REVIEW-status assets normally fall back in this generic route. The exception
 * is the existing human-anatomy organ set: this prototype is intentionally not
 * preparing a paid launch yet, and those organs define the visual quality bar
 * learners expect from this product. Paid-launch provenance is still tracked in
 * docs/ASSET-LICENSES.md; the UI should not hide the best current anatomy
 * learning experience while that business decision remains out of scope.
 */
export function resolveBranchAssetPresentation(
  assetResolution: AssetResolution | undefined,
): BranchAssetPresentation {
  const reviewPending = !!assetResolution && isAssetReviewPending(assetResolution)
  const allowPrototypeReviewAsset = assetResolution?.asset?.branch === 'human-anatomy'
  const shouldFallback = reviewPending && !allowPrototypeReviewAsset
  const modelUrl = shouldFallback ? undefined : assetResolution?.resolvedUrl
  const footerNote = assetResolution ? childSafeAssetNote(assetResolution, shouldFallback) : undefined
  return { modelUrl, footerNote }
}
