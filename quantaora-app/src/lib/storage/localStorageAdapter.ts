/**
 * Backend-free storage abstraction used by `useAppStore`'s persist middleware.
 *
 * Today this just wraps `window.localStorage` behind Zustand's `StateStorage`
 * interface (getItem/setItem/removeItem, string in/out). If the app later
 * needs IndexedDB (e.g. via Dexie) for larger payloads (snapshots, media),
 * swap the implementation below for one backed by IndexedDB — the shape
 * (`StateStorage`) and the call site in `useAppStore.ts`
 * (`createJSONStorage(() => localStorageAdapter)`) do not need to change.
 */
import type { StateStorage } from 'zustand/middleware'

const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'

export const localStorageAdapter: StateStorage = {
  getItem: (name) => {
    if (!isBrowser) return null
    try {
      return window.localStorage.getItem(name)
    } catch {
      // Storage can throw in private browsing / quota-exceeded situations.
      return null
    }
  },
  setItem: (name, value) => {
    if (!isBrowser) return
    try {
      window.localStorage.setItem(name, value)
    } catch {
      // Swallow quota/security errors — persistence is best-effort, not required.
    }
  },
  removeItem: (name) => {
    if (!isBrowser) return
    try {
      window.localStorage.removeItem(name)
    } catch {
      // no-op
    }
  },
}
