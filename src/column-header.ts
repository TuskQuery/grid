// Two-line column header per spec §4.4: column name on top, type hint
// (e.g. "int4", "text") in muted color underneath. The header sits
// outside the ScrollView so it stays pinned while rows scroll.

import {
    HStack,
    VStack,
    Text,
    Spacer,
    Divider,
    widgetAddChild,
    widgetSetWidth,
    widgetSetHeight,
    setPadding,
    textSetFontSize,
    textSetColor,
    type Widget,
} from 'perry/ui';
import type { ColumnDef } from './types';

export const HEADER_HEIGHT = 36;

export function buildColumnHeader(columns: ColumnDef[]): Widget {
    const root = VStack(0, []);
    widgetSetHeight(root, HEADER_HEIGHT);

    const cells = HStack(0, []);
    widgetSetHeight(cells, HEADER_HEIGHT - 1);
    for (let i = 0; i < columns.length; i++) {
        const col = columns[i];
        if (col === undefined) {
            continue;
        }
        widgetAddChild(cells, buildHeaderCell(col));
    }
    // Trailing spacer so the header background extends past the last
    // column when the data rows are narrower than the viewport.
    widgetAddChild(cells, Spacer());
    widgetAddChild(root, cells);

    // Hairline under the header.
    widgetAddChild(root, Divider());
    return root;
}

function buildHeaderCell(col: ColumnDef): Widget {
    const cell = VStack(2, []);
    widgetSetWidth(cell, col.widthPx);
    setPadding(cell, 4, 8, 4, 8);

    const name = Text(col.name);
    textSetFontSize(name, 13);
    widgetAddChild(cell, name);

    const typeLabel = Text(col.typeHint);
    textSetFontSize(typeLabel, 10);
    // Muted gray.
    textSetColor(typeLabel, 0.55, 0.55, 0.55, 1);
    widgetAddChild(cell, typeLabel);

    return cell;
}
