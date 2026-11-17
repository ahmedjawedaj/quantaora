import { useState } from 'react'
import { useGLTF } from '@react-three/drei'

/**
 * Shared "Try again" retry mechanism for a GLB-loading `GlbErrorBoundary`.
 *
 * Extracted after GenericViewer.tsx, CellViewer.tsx, OrganViewer.tsx, and StarViewer.tsx were all
 * found to have independently reimplemented byte-for-byte the same buggy `retryKey`-bump handler
 * (`onRetry={() => setRetryKey((k) => k + 1)}`) — a React remount alone. drei's `useGLTF` is built
 * on @react-three/fiber's `useLoader`, which caches every load attempt (success OR failure) in
 * suspend-react's module-level cache, keyed by `[Loader, url]`. Once a fetch rejects, that cache
 * entry permanently stores the error and re-throws the SAME rejected promise for the same url on
 * every subsequent call, remount or not — so bumping a key alone re-renders the identical error
 * card with zero new network activity, making "Try again" a no-op. This mirrors the fix already
 * established in CrystalViewer.tsx (see its `retryLoad`): `useGLTF.clear(url)` evicts the stale
 * cache entry before the remount, so the next `useGLTF(url)` call genuinely re-fetches.
 *
 * `url` may be `undefined` for viewers that also render a procedural/composition fallback when no
 * GLB is configured (GenericViewer, CellViewer) — in that case there is no loader-cache entry to
 * evict, so the clear step is skipped and only the remount happens (harmless: nothing was loading
 * via useGLTF for that render anyway).
 */
export function useGlbRetry(url: string | undefined) {
  const [retryKey, setRetryKey] = useState(0)
  const retryLoad = () => {
    if (url) useGLTF.clear(url)
    setRetryKey((k) => k + 1)
  }
  return { retryKey, retryLoad }
}
