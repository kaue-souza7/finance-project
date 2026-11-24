import "@testing-library/jest-dom/vitest";

// Node 26 expõe um localStorage experimental indefinido e o Vitest/jsdom
// não o substitui automaticamente. Fornece uma implementação em memória
// equivalente para os testes.
if (typeof globalThis.localStorage === "undefined") {
  const store = new Map<string, string>();

  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem(key: string) {
        return store.has(key) ? store.get(key)! : null;
      },
      setItem(key: string, value: string) {
        store.set(key, String(value));
      },
      removeItem(key: string) {
        store.delete(key);
      },
      clear() {
        store.clear();
      },
      key(index: number) {
        return Array.from(store.keys())[index] ?? null;
      },
      get length() {
        return store.size;
      },
    },
  });
}
