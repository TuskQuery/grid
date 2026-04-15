// Single-row builder. Returns an HStack with one Text per column.
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
    setPadding,
    textSetFontSize,
    textSetColor,
    type Widget,
} from 'perry/ui';
import type { ColumnDef, Row } from './types';
import { formatCell, NULL_DISPLAY } from './cell-renderers/format';

export const ROW_HEIGHT = 28;

export function buildRow(columns: ColumnDef[], row: Row): Widget {
    const r = HStack(0, []);
    widgetSetHeight(r, ROW_HEIGHT);
    for (let i = 0; i < columns.length; i++) {
        const col = columns[i];
        if (col === undefined) {
            continue;
        }
        widgetAddChild(r, buildCell(col, row[i]));
    }
    return r;
}

function buildCell(col: ColumnDef, value: unknown): Widget {
    const display = formatCell(value, col.renderer);
    const t = Text(display);
    widgetSetWidth(t, col.widthPx);
    widgetSetHeight(t, ROW_HEIGHT);
    setPadding(t, 4, 8, 4, 8);
    textSetFontSize(t, 12);
    if (display === NULL_DISPLAY) {
        // Muted italic look for SQL NULL — matches Postico's convention.
        textSetColor(t, 0.55, 0.55, 0.55, 1);
    }
    return t;
}
