// Pure selection model — testable without perry/ui. The grid stores one
// instance per `Grid({...})` call; `grid.ts` mutates it from cell click
// handlers and reads from it during `rebuildVisibleRows`.
//
// v1 supports single row + single active cell. Range selection
// (shift-click) and toggle selection (⌘-click) need keyboard-modifier
// info that Perry's `widgetSetOnClick` callback doesn't carry — they
// land when the click signature widens (or the inline editor in D11
// brings its own event-aware path).

export interface CellAddress {
    rowIndex: number;
    columnIndex: number;
}

export class SelectionModel {
    private _selectedRow: number | null = null;
    private _activeCell: CellAddress | null = null;

    get selectedRow(): number | null {
        return this._selectedRow;
    }

    get activeCell(): CellAddress | null {
        return this._activeCell;
    }

    /** Select a row, clear active cell. */
    selectRow(rowIndex: number): void {
        this._selectedRow = rowIndex;
        this._activeCell = null;
    }

    /** Select a cell — implies selecting its parent row too. */
    selectCell(rowIndex: number, columnIndex: number): void {
        this._selectedRow = rowIndex;
        this._activeCell = { rowIndex: rowIndex, columnIndex: columnIndex };
    }

    clear(): void {
        this._selectedRow = null;
        this._activeCell = null;
    }

    isRowSelected(rowIndex: number): boolean {
        return this._selectedRow === rowIndex;
    }

    isCellActive(rowIndex: number, columnIndex: number): boolean {
        const a = this._activeCell;
        if (a === null) {
            return false;
        }
        return a.rowIndex === rowIndex && a.columnIndex === columnIndex;
    }
}
