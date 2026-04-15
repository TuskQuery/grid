// Smoke test: the public shapes exist and compose. Real behavioral tests
// (virtualization window, cell renderers, inline edit) land in D2.

import { describe, it, expect } from 'bun:test';
import type { ColumnDef, GridProps } from '../src';

describe('@tusk/grid shapes', () => {
    it('accepts a minimal GridProps', () => {
        const columns: ColumnDef[] = [
            { name: 'id', typeHint: 'int4', renderer: 'numeric', isPrimaryKey: true, widthPx: 80 },
            { name: 'name', typeHint: 'text', renderer: 'text', isPrimaryKey: false, widthPx: 200 },
        ];
        const props: GridProps = {
            columns: columns,
            rows: [[1, 'Alice'], [2, 'Bob']],
        };
        expect(props.columns).toHaveLength(2);
        expect(props.rows).toHaveLength(2);
    });
});
