import { useEffect } from "react";

/**
 * Diagnostic mount-log hook used during the iOS Safari debug pass.
 *
 * The previous Rules-of-Hooks fix landed cleanly but didn't address
 * invisible first-paint frames. To prove which homepage surfaces actually
 * mount on a real device, each surface calls `useMountLog("Hero")` etc.
 * The hook runs `useEffect(() => console.log(...), [])` so the log only
 * fires after the component has actually committed — a missing log in
 * the device's console means the subtree crashed before paint.
 *
 * Temporary diagnostic — to be removed once the fix is verified.
 */
export function useMountLog(name: string): void {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log(`[ASTEYA] ${name} mounted`);
  }, [name]);
}
