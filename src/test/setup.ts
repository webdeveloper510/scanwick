import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach } from "vitest";

function installMatchMedia(matches: (query: string) => boolean = () => false) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: matches(query),
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

installMatchMedia();

beforeEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.theme;
  installMatchMedia();
});

afterEach(() => {
  cleanup();
});
