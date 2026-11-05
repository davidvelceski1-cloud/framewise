"use client";

import { useSyncExternalStore } from "react";

const noop = () => () => {};

/** true after hydration — for DOM-measuring widgets (charts) and client-only state. */
export function useMounted() {
  return useSyncExternalStore(noop, () => true, () => false);
}
