// Pure visible-window calculator. Given the current scroll offset, the
// viewport height, the fixed row height, and the total row count, decide
// which rows we need to render right now (with a small overscan buffer
// above and below so quick flicks don't flash empty space).
//
// The renderer in `grid.ts` calls `computeVisibleWindow` on every tick
// (driven by setInterval), compares with the previous result, and only
// rebuilds the row list when the window actually changed.

export interface VisibleWindow {
    /** Inclusive index of the first row to render. */
    firstIndex: number;
    /** Exclusive index of one past the last row to render. */
    endIndex: number;
}

export interface VisibleWindowInput {
    /** Scroll offset in pixels from the top of the scroll content. */
    scrollY: number;
    /** Height of the visible viewport in pixels. */
    viewportHeight: number;
    /** Fixed pixel height of each row. */
    rowHeight: number;
    /** Total number of rows in the dataset. */
    rowCount: number;
    /**
     * Number of off-screen rows to render above and below the viewport so
     * quick flicks don't flash blank rows. Spec §7 wants 60fps continuous
     * scroll on M1; with `OVERSCAN=5` and a 28px row height the window
     * recompute touches at most ~viewport/28 + 10 rows per tick.
     */
    overscan: number;
}

/**
 * Pure function — no widget access, no IO. Easy to unit-test.
 */
export function computeVisibleWindow(input: VisibleWindowInput): VisibleWindow {
    if (input.rowCount <= 0 || input.rowHeight <= 0) {
        return { firstIndex: 0, endIndex: 0 };
    }
    const rawFirst = Math.floor(input.scrollY / input.rowHeight) - input.overscan;
    const rawEnd = Math.ceil((input.scrollY + input.viewportHeight) / input.rowHeight) + input.overscan;
    const first = rawFirst < 0 ? 0 : rawFirst;
    const end = rawEnd > input.rowCount ? input.rowCount : rawEnd;
    if (end <= first) {
        return { firstIndex: 0, endIndex: 0 };
    }
    return { firstIndex: first, endIndex: end };
}

/** True iff two windows render exactly the same row set. */
export function windowsEqual(a: VisibleWindow, b: VisibleWindow): boolean {
    return a.firstIndex === b.firstIndex && a.endIndex === b.endIndex;
}

/** Total scroll-content height for a given row count and row height. */
export function totalContentHeight(rowCount: number, rowHeight: number): number {
    if (rowCount <= 0 || rowHeight <= 0) {
        return 0;
    }
    return rowCount * rowHeight;
}
