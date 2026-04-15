// Grid widget — orchestrator. Wires:
//
//   ┌────────────────────────────────────────────────┐
//   │ column header (sticky, lives outside scroll)   │
//   ├────────────────────────────────────────────────┤
//   │ ScrollView                                     │
//   │  └─ scrollBody (VStack)                        │
//   │      ├─ topSpacer (height = firstIndex*RH)     │
//   │      ├─ visibleRows[firstIndex .. endIndex)    │
//   │      └─ bottomSpacer (height = (N-end)*RH)     │
//   └────────────────────────────────────────────────┘
//
// On every tick (`setInterval`) we read `scrollViewGetOffset`, recompute
// the visible window, and only rebuild the row list when the window
// actually shifted. Spec §7 wants 60fps continuous scroll on 1000×20 —
// the recompute touches at most ~viewport/ROW_HEIGHT + overscan*2 rows
// per tick (~32 rows for an 800px viewport at 28px/row, +10 overscan).

import {
    VStack,
    ScrollView,
    Spacer,
    widgetAddChild,
    widgetClearChildren,
    widgetSetHeight,
    widgetMatchParentWidth,
    scrollviewSetChild,
    scrollViewGetOffset,
    type Widget,
} from 'perry/ui';
import type { GridProps, GridApi, Row } from './types';
import { buildColumnHeader, HEADER_HEIGHT } from './column-header';
import { buildRow, ROW_HEIGHT } from './row';
import {
    computeVisibleWindow,
    windowsEqual,
    totalContentHeight,
    type VisibleWindow,
} from './virtualization';
import { SelectionModel } from './selection';

const OVERSCAN = 5;
const TICK_MS = 16; // ~60fps recompute cadence
/**
 * Default viewport height used when the host hasn't told us how tall the
 * scroll area is. 600px is a reasonable default for the workbench's
 * content pane; tusk-app overrides via `setViewportHeight` once the
 * window is sized.
 */
const DEFAULT_VIEWPORT_HEIGHT = 600;

interface GridState {
    columns: GridProps['columns'];
    rows: Row[];
    scrollView: Widget;
    scrollBody: Widget;
    topSpacer: Widget;
    bottomSpacer: Widget;
    /** Mid container that holds the visible row widgets. */
    rowContainer: Widget;
    lastWindow: VisibleWindow;
    viewportHeight: number;
    selection: SelectionModel;
    onSelect: ((rowIndices: number[]) => void) | null;
    onCellSelect: ((cell: { rowIndex: number; columnIndex: number } | null) => void) | null;
}

// Per-grid state lives in a module-level Map keyed by an integer id so
// the periodic tick closure can capture by value (Perry constraint —
// closures don't see later mutations to outer locals).
const STATES: Map<number, GridState> = new Map<number, GridState>();
let _nextId: number = 1;

export function Grid(props: GridProps): { handle: Widget; api: GridApi } {
    const id = _nextId++;

    const root = VStack(0, []);

    const header = buildColumnHeader(props.columns);
    widgetAddChild(root, header);

    const scrollView = ScrollView();

    const scrollBody = VStack(0, []);
    const topSpacer = Spacer();
    widgetSetHeight(topSpacer, 0);
    const rowContainer = VStack(0, []);
    const bottomSpacer = Spacer();
    widgetSetHeight(
        bottomSpacer,
        totalContentHeight(props.rows.length, ROW_HEIGHT)
    );
    widgetAddChild(scrollBody, topSpacer);
    widgetAddChild(scrollBody, rowContainer);
    widgetAddChild(scrollBody, bottomSpacer);
    scrollviewSetChild(scrollView, scrollBody);

    widgetAddChild(root, scrollView);
    // matchParent only works once the widget is in the tree.
    widgetMatchParentWidth(scrollView);

    const state: GridState = {
        columns: props.columns,
        rows: props.rows,
        scrollView: scrollView,
        scrollBody: scrollBody,
        topSpacer: topSpacer,
        bottomSpacer: bottomSpacer,
        rowContainer: rowContainer,
        lastWindow: { firstIndex: 0, endIndex: 0 },
        viewportHeight: DEFAULT_VIEWPORT_HEIGHT,
        selection: new SelectionModel(),
        onSelect: props.onSelect !== undefined ? props.onSelect : null,
        onCellSelect: props.onCellSelect !== undefined ? props.onCellSelect : null,
    };
    STATES.set(id, state);

    // Kick off the per-grid scroll-watcher tick. Bound by the grid id —
    // captures by value, looks state up via the Map on each fire.
    const myId = id;
    setInterval(() => {
        tick(myId);
    }, TICK_MS);

    // Render the initial window so the grid isn't empty before the first
    // scroll event arrives.
    rebuildVisibleRows(state);

    const api: GridApi = {
        setRows(rows: Row[]): void {
            const st = STATES.get(myId);
            if (st === undefined) {
                return;
            }
            st.rows = rows;
            st.selection.clear();
            st.lastWindow = { firstIndex: 0, endIndex: 0 };
            rebuildVisibleRows(st);
            if (st.onSelect !== null) {
                st.onSelect([]);
            }
            if (st.onCellSelect !== null) {
                st.onCellSelect(null);
            }
        },
        scrollToRow(_index: number): void {
            // scrollViewSetOffset wiring lands in the next pass — we need
            // to verify the macOS NSScrollView accepts programmatic offset
            // sets while the user is also dragging.
        },
    };

    return { handle: root, api: api };
}

/**
 * Public-but-internal: lets tusk-app inform a grid of its viewport
 * height (the workbench knows the window size; the grid by itself
 * doesn't). Without this we'd over-render every tick because the
 * default 600px viewport is wrong.
 */
export function setViewportHeight(api: GridApi, heightPx: number): void {
    // The api object doesn't carry the id, so we walk the state map.
    // This is O(n) over the (small) number of grids in the app — fine.
    for (const [, st] of STATES) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((api as any).__grid_state === st) {
            st.viewportHeight = heightPx;
            rebuildVisibleRows(st);
            return;
        }
    }
}

/**
 * Reverse-lookup a grid id from its state object. Used by the row
 * builder closure so the click handler can find the right state slot.
 * O(n) over the (small) number of grids in the app.
 */
function stateIdFor(st: GridState): number {
    for (const [id, candidate] of STATES) {
        if (candidate === st) {
            return id;
        }
    }
    return 0;
}

function handleCellClick(id: number, rowIndex: number, columnIndex: number): void {
    const st = STATES.get(id);
    if (st === undefined) {
        return;
    }
    st.selection.selectCell(rowIndex, columnIndex);
    rebuildVisibleRows(st);
    if (st.onSelect !== null) {
        st.onSelect([rowIndex]);
    }
    if (st.onCellSelect !== null) {
        st.onCellSelect({ rowIndex: rowIndex, columnIndex: columnIndex });
    }
}

function tick(id: number): void {
    const st = STATES.get(id);
    if (st === undefined) {
        return;
    }
    const scrollY = scrollViewGetOffset(st.scrollView);
    const next = computeVisibleWindow({
        scrollY: scrollY,
        viewportHeight: st.viewportHeight,
        rowHeight: ROW_HEIGHT,
        rowCount: st.rows.length,
        overscan: OVERSCAN,
    });
    if (windowsEqual(next, st.lastWindow)) {
        return;
    }
    st.lastWindow = next;
    rebuildVisibleRows(st);
}

function rebuildVisibleRows(st: GridState): void {
    const w = st.lastWindow;
    // Ensure window is fresh on the very first call.
    if (w.endIndex === 0 && st.rows.length > 0) {
        const initial = computeVisibleWindow({
            scrollY: 0,
            viewportHeight: st.viewportHeight,
            rowHeight: ROW_HEIGHT,
            rowCount: st.rows.length,
            overscan: OVERSCAN,
        });
        st.lastWindow = initial;
    }
    const win = st.lastWindow;
    widgetClearChildren(st.rowContainer);
    const myId = stateIdFor(st);
    for (let i = win.firstIndex; i < win.endIndex; i++) {
        const row = st.rows[i];
        if (row === undefined) {
            continue;
        }
        const isSelected = st.selection.isRowSelected(i);
        const activeCell = st.selection.activeCell;
        const activeColumnIndex = activeCell !== null && activeCell.rowIndex === i
            ? activeCell.columnIndex
            : null;
        widgetAddChild(
            st.rowContainer,
            buildRow(st.columns, row, {
                rowIndex: i,
                isSelected: isSelected,
                activeColumnIndex: activeColumnIndex,
                onCellClick: (rowIndex: number, columnIndex: number) => {
                    handleCellClick(myId, rowIndex, columnIndex);
                },
            })
        );
    }
    widgetSetHeight(st.topSpacer, win.firstIndex * ROW_HEIGHT);
    widgetSetHeight(
        st.bottomSpacer,
        (st.rows.length - win.endIndex) * ROW_HEIGHT
    );
}

export { HEADER_HEIGHT, ROW_HEIGHT };
