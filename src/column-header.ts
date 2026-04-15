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

    const cells = HStack(0, []);
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
    // Size the row of cells AFTER its children are in the tree —
    // Perry's auto-layout backend ignores width/height set on a widget
    // before it has a superview (and logs `match_parent_width: view
    // has no superview` during initial render).
    widgetSetHeight(cells, HEADER_HEIGHT - 1);

    // Hairline under the header.
    widgetAddChild(root, Divider());

    widgetSetHeight(root, HEADER_HEIGHT);
    return root;
}

function buildHeaderCell(col: ColumnDef): Widget {
    const cell = VStack(2, []);

    const name = Text(col.name);
    widgetAddChild(cell, name);
    textSetFontSize(name, 13);

    const typeLabel = Text(col.typeHint);
    widgetAddChild(cell, typeLabel);
    textSetFontSize(typeLabel, 10);
    textSetColor(typeLabel, 0.55, 0.55, 0.55, 1);

    // Size the cell only after both children are in the tree.
    widgetSetWidth(cell, col.widthPx);
    setPadding(cell, 4, 8, 4, 8);
    return cell;
}
