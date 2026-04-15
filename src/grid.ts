// Grid widget. Today this is a placeholder VStack — the real virtualization
// + column-header + cell rendering lands in D2. Shaped so the public API
// (`Grid(props): handle`, returns a GridApi) is stable from the scaffold.

import { VStack, Text, widgetAddChild, type Widget } from 'perry/ui';
import type { GridProps, GridApi, Row } from './types';

export function Grid(props: GridProps): { handle: Widget; api: GridApi } {
    const container = VStack(0, []);

    // Placeholder: print "Grid: N rows × M cols" until D2 lands the
    // virtualized implementation.
    const label = Text(
        'Grid: ' + props.rows.length + ' rows × ' + props.columns.length + ' cols'
    );
    widgetAddChild(container, label);

    let currentRows: Row[] = props.rows;

    const api: GridApi = {
        setRows(rows: Row[]): void {
            currentRows = rows;
            // Re-render is a no-op in the placeholder — keep the reference
            // so a future swap to real virtualization has state to read.
            void currentRows;
        },
        scrollToRow(_index: number): void {
            // No-op in the placeholder.
        },
    };

    return { handle: container, api: api };
}
