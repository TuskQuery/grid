import { describe, it, expect } from 'bun:test';
import { SelectionModel } from '../src/selection';

describe('SelectionModel', () => {
    it('starts empty', () => {
        const m = new SelectionModel();
        expect(m.selectedRow).toBeNull();
        expect(m.activeCell).toBeNull();
        expect(m.isRowSelected(0)).toBe(false);
        expect(m.isCellActive(0, 0)).toBe(false);
    });

    it('selectRow tracks the row but no active cell', () => {
        const m = new SelectionModel();
        m.selectRow(7);
        expect(m.selectedRow).toBe(7);
        expect(m.activeCell).toBeNull();
        expect(m.isRowSelected(7)).toBe(true);
        expect(m.isRowSelected(8)).toBe(false);
    });

    it('selectCell selects the row and the cell', () => {
        const m = new SelectionModel();
        m.selectCell(3, 4);
        expect(m.selectedRow).toBe(3);
        expect(m.isRowSelected(3)).toBe(true);
        expect(m.isCellActive(3, 4)).toBe(true);
        expect(m.isCellActive(3, 5)).toBe(false);
        expect(m.isCellActive(2, 4)).toBe(false);
    });

    it('selectRow after selectCell clears the active cell', () => {
        const m = new SelectionModel();
        m.selectCell(1, 2);
        m.selectRow(5);
        expect(m.selectedRow).toBe(5);
        expect(m.activeCell).toBeNull();
        expect(m.isCellActive(1, 2)).toBe(false);
    });

    it('clear() resets everything', () => {
        const m = new SelectionModel();
        m.selectCell(1, 2);
        m.clear();
        expect(m.selectedRow).toBeNull();
        expect(m.activeCell).toBeNull();
    });
});
