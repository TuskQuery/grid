// Single-row builder. Returns an HStack with one Text per column. Click
// handlers route through the per-grid SelectionModel via the
// `onCellClick` callback (set by `grid.ts`).
//
// Performance note: every visible row goes through this on each
// virtualization tick that rebuilds the window. The hot path here is
// the per-cell Text widget creation; we keep formatting (string work)
// in a pure function (`./cell-renderers/format`) so it's testable and
// easy to swap for binary-format codecs later.

import {
    HStack,
    Text,
    widgetAddChild,
    widgetSetHeight,
    widgetSetWidth,
    widgetSetBackgroundColor,
    widgetSetOnClick,
    setPadding,
    textSetFontSize,
    textSetColor,
    type Widget,
} from 'perry/ui';
import type { ColumnDef, Row } from './types';
import { formatCell, NULL_DISPLAY } from './cell-renderers/format';

export const ROW_HEIGHT = 28;

export interface BuildRowOptions {
    rowIndex: number;
    isSelected: boolean;
    activeColumnIndex: number | null;
    onCellClick: (rowIndex: number, columnIndex: number) => void;
}

export function buildRow(
    columns: ColumnDef[],
    row: Row,
    opts: BuildRowOptions
): Widget {
    const r = HStack(0, []);
    for (let i = 0; i < columns.length; i++) {
        const col = columns[i];
        if (col === undefined) {
            continue;
        }
        widgetAddChild(r, buildCell(col, row[i], opts, i));
    }
    // Size + tint AFTER children attach — Perry's layout backend
    // ignores width/height set on a widget before it has a superview.
    widgetSetHeight(r, ROW_HEIGHT);
    if (opts.isSelected) {
        // Light-blue selection wash, ~30% alpha — matches macOS
        // NSTableView's accent-on-white look.
        widgetSetBackgroundColor(r, 0.20, 0.45, 0.85, 0.30);
    }
    return r;
}

function buildCell(
    col: ColumnDef,
    value: unknown,
    opts: BuildRowOptions,
    columnIndex: number
): Widget {
    const display = formatCell(value, col.renderer);
    const t = Text(display);
    // Capture row + col by value into fresh locals so each cell calls
    // its own coordinates (Perry closures capture by value — referencing
    // the loop counter would freeze it at its final value).
    const myRow = opts.rowIndex;
    const myCol = columnIndex;
    const cb = opts.onCellClick;
    widgetSetOnClick(t, () => {
        cb(myRow, myCol);
    });
    // Size + colors AFTER `widgetSetOnClick` so the widget is fully
    // configured when sizing constraints attach.
    widgetSetWidth(t, col.widthPx);
    widgetSetHeight(t, ROW_HEIGHT);
    setPadding(t, 4, 8, 4, 8);
    textSetFontSize(t, 12);
    if (display === NULL_DISPLAY) {
        textSetColor(t, 0.55, 0.55, 0.55, 1);
    }
    if (opts.activeColumnIndex === columnIndex) {
        widgetSetBackgroundColor(t, 0.20, 0.45, 0.85, 0.45);
    }
    return t;
}
