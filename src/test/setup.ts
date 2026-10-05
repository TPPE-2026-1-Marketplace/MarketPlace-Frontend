import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach } from "vitest";

// No Node 25+ o `localStorage` nativo do Node (sem --localstorage-file) ocupa o
// global antes do jsdom e não tem os métodos da Web Storage. Usa o do jsdom.
if (typeof globalThis.localStorage?.clear !== "function") {
  const jsdomStorage = (globalThis as { jsdom?: { window: Window } }).jsdom?.window.localStorage;
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: jsdomStorage,
  });
}

// O jsdom não implementa ResizeObserver; o Radix o usa nos inputs de formulário.
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  cleanup();
});
