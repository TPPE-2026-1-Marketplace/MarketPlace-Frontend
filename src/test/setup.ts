import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// No Node 25+ o localStorage nativo do Node (sem --localstorage-file) ocupa o
// global antes do jsdom e não tem os métodos da Web Storage. Usa o do jsdom.
if (typeof globalThis.localStorage?.clear !== 'function') {
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: (globalThis as { jsdom?: { window: Window } }).jsdom?.window.localStorage,
  })
}

// jsdom não implementa ResizeObserver, usado pelo ResponsiveContainer do recharts
// e por componentes Radix.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  localStorage.clear()
  sessionStorage.clear()
})
