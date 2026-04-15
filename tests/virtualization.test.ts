import { describe, it, expect } from 'bun:test';
import {
    computeVisibleWindow,
    windowsEqual,
    totalContentHeight,
} from '../src/virtualization';

describe('computeVisibleWindow', () => {
    const base = { rowHeight: 28, rowCount: 1000, overscan: 5 };

    it('shows the top of the dataset when scrollY=0', () => {
        const w = computeVisibleWindow({ ...base, scrollY: 0, viewportHeight: 600 });
        expect(w.firstIndex).toBe(0); // clamped from -5
        // viewport fits ceil(600/28) = 22 rows, +5 overscan = 27
        expect(w.endIndex).toBe(27);
    });

    it('opens a window of the right size in the middle', () => {
        // scroll halfway into a 1000-row dataset (28 * 500 = 14000)
        const w = computeVisibleWindow({ ...base, scrollY: 14000, viewportHeight: 600 });
        // floor(14000/28) - 5 = 500 - 5 = 495
        expect(w.firstIndex).toBe(495);
        // ceil((14000+600)/28) + 5 = ceil(521.43) + 5 = 522 + 5 = 527
        expect(w.endIndex).toBe(527);
    });

    it('clamps the window to the row count near the bottom', () => {
        // 1000 rows × 28px = 28000px. Scroll near the end.
        const w = computeVisibleWindow({ ...base, scrollY: 27500, viewportHeight: 600 });
        expect(w.endIndex).toBe(1000);
        // Window length should still be ~22 + overscan, not 0.
        expect(w.endIndex - w.firstIndex).toBeGreaterThan(20);
    });

    it('returns an empty window for a zero-row dataset', () => {
        const w = computeVisibleWindow({ ...base, rowCount: 0, scrollY: 0, viewportHeight: 600 });
        expect(w).toEqual({ firstIndex: 0, endIndex: 0 });
    });

    it('returns an empty window if rowHeight is invalid', () => {
        const w = computeVisibleWindow({ ...base, rowHeight: 0, scrollY: 0, viewportHeight: 600 });
        expect(w).toEqual({ firstIndex: 0, endIndex: 0 });
    });
});

describe('windowsEqual', () => {
    it('compares both bounds', () => {
        expect(windowsEqual({ firstIndex: 0, endIndex: 27 }, { firstIndex: 0, endIndex: 27 })).toBe(true);
        expect(windowsEqual({ firstIndex: 0, endIndex: 27 }, { firstIndex: 1, endIndex: 27 })).toBe(false);
        expect(windowsEqual({ firstIndex: 0, endIndex: 27 }, { firstIndex: 0, endIndex: 28 })).toBe(false);
    });
});

describe('totalContentHeight', () => {
    it('multiplies', () => {
        expect(totalContentHeight(1000, 28)).toBe(28000);
    });
    it('clamps invalid input to zero', () => {
        expect(totalContentHeight(0, 28)).toBe(0);
        expect(totalContentHeight(1000, 0)).toBe(0);
        expect(totalContentHeight(-5, 28)).toBe(0);
    });
});
