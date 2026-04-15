// Pure selection model — testable without perry/ui. The grid stores one
// instance per `Grid({...})` call; `grid.ts` mutates it from cell click
// handlers and reads from it during `rebuildVisibleRows`.
//
// v1 supports single row + single active cell. Range selection
// (shift-click) and toggle selection (⌘-click) need keyboard-modifier
// info that Perry's `widgetSetOnClick` callback doesn't carry — they
// land when the click signature widens (or the inline editor in D11
// brings its own event-aware path).
//
// Sentinel `-1` for "nothing selected" instead of `null`: Perry's
// native codegen has occasional issues initializing nullable class
// fields across module boundaries, and reading an uninitialized field
// as `0` would falsely mark the first row selected. Sentinels are
// always safe.

export interface CellAddress {
    rowIndex: number;
    columnIndex: number;
}

const NONE = -1;

export class SelectionModel {
    public selectedRowIndex: number = NONE;
    public activeRowIndex: number = NONE;
    public activeColumnIndex: number = NONE;

    constructor() {
        this.selectedRowIndex = NONE;
        this.activeRowIndex = NONE;
        this.activeColumnIndex = NONE;
    }

    /** Backwards-compatible getter. Returns null when nothing's selected. */
    get selectedRow(): number | null {
        return this.selectedRowIndex === NONE ? null : this.selectedRowIndex;
    }

    /** Backwards-compatible getter. Returns null when nothing's selected. */
    get activeCell(): CellAddress | null {
        if (this.activeRowIndex === NONE) {
            return null;
        }
        return { rowIndex: this.activeRowIndex, columnIndex: this.activeColumnIndex };
    }

    selectRow(rowIndex: number): void {
        this.selectedRowIndex = rowIndex;
        this.activeRowIndex = NONE;
        this.activeColumnIndex = NONE;
    }

    selectCell(rowIndex: number, columnIndex: number): void {
        this.selectedRowIndex = rowIndex;
        this.activeRowIndex = rowIndex;
        this.activeColumnIndex = columnIndex;
    }

    clear(): void {
        this.selectedRowIndex = NONE;
        this.activeRowIndex = NONE;
        this.activeColumnIndex = NONE;
    }

    isRowSelected(rowIndex: number): boolean {
        return this.selectedRowIndex === rowIndex;
    }

    isCellActive(rowIndex: number, columnIndex: number): boolean {
        return this.activeRowIndex === rowIndex && this.activeColumnIndex === columnIndex;
    }
}
