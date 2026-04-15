// Public shapes consumed by tusk-app. MUST NOT import from `@perry/postgres`
// so the grid stays reusable in any read-rows-show-table context.

export interface ColumnDef {
    /** Column name shown in the header. */
    name: string;
    /** Short type hint rendered under the name (e.g. "int4", "text"). */
    typeHint: string;
    /** Cell renderer key (`text`, `null`, `numeric`, `json`, …). */
    renderer: CellRendererKey;
    /**
     * True if this column is part of the primary key. Used by the inline
     * editor to build `UPDATE ... WHERE pk = $1` statements.
     */
    isPrimaryKey: boolean;
    /** Initial column width in pixels. User can drag to resize. */
    widthPx: number;
}

export type CellRendererKey =
    | 'text'
    | 'null'
    | 'numeric'
    | 'bool'
    | 'json'
    | 'array'
    | 'bytea'
    | 'timestamp'
    | 'uuid';

/**
 * A single row. Cells are already decoded to their JS types by the caller
 * (tusk-app's connection-manager uses `@perry/postgres`'s type registry).
 * The grid only formats them for display.
 */
export type Row = unknown[];

export interface GridProps {
    columns: ColumnDef[];
    rows: Row[];
    /** Fires when the user commits an inline edit. */
    onCellCommit?: (rowIndex: number, columnIndex: number, newValue: unknown) => void;
    /** Fires when the user selects row(s). */
    onSelect?: (rowIndices: number[]) => void;
}

/**
 * Imperative handle returned by `Grid(…)`. tusk-app holds onto it to push
 * new rows (pagination) or scroll programmatically.
 */
export interface GridApi {
    setRows(rows: Row[]): void;
    scrollToRow(index: number): void;
}
