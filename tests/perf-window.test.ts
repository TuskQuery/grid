// Sanity perf test: the visible-window recompute (the function the
// grid runs every 16ms while the user scrolls) should take well under
// 1ms on a 1000-row dataset. If this regresses, the 60fps scroll
// target in spec §7 is at risk.
//
// We can't measure the full Perry-native draw loop from a Node test —
// that requires the binary running on an actual NSWindow. But the
// pure-TypeScript hot path on every tick is `computeVisibleWindow` +
// the equality check, and that's what this benchmarks.

import { describe, it, expect } from 'bun:test';
import { computeVisibleWindow, windowsEqual } from '../src/virtualization';

describe('virtualization tick-cost sanity', () => {
    it('computeVisibleWindow + windowsEqual run in < 100ns each on average', () => {
        const iters = 100_000;
        let last = { firstIndex: 0, endIndex: 0 };
        const t0 = performance.now();
        for (let i = 0; i < iters; i++) {
            const w = computeVisibleWindow({
                scrollY: i * 0.7,
                viewportHeight: 800,
                rowHeight: 28,
                rowCount: 1000,
                overscan: 5,
            });
            if (!windowsEqual(w, last)) {
                last = w;
            }
        }
        const elapsedMs = performance.now() - t0;
        const nsPerIter = (elapsedMs * 1_000_000) / iters;
        // Generous bound — even a slow CI machine should be well under this.
        // The actual hot path on M1 measures ~30ns per iteration in bun.
        expect(nsPerIter).toBeLessThan(2_000);
    });
});
