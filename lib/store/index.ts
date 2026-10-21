import { createFirebaseStore } from "@/lib/store/firebase";
import { createHybridStore } from "@/lib/store/hybrid";
import { browserStorage, createLocalStore, hasLocalSession } from "@/lib/store/local";
import type { HybridStore } from "@/lib/store/types";

let store: HybridStore | null = null;

/** browser only. one shared store for the whole app */
export function getStore(): HybridStore {
  if (!store) {
    const storage = browserStorage();
    store = createHybridStore(createFirebaseStore(), createLocalStore(storage), hasLocalSession(storage));
  }
  return store;
}
