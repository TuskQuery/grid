// Pure formatters per CellRendererKey. Each takes the decoded cell value
// (whatever `@perry/postgres`'s codec produced) and returns a display
// string that the grid puts inside a Text widget.
//
// The actual widget construction lives in `../row.ts`. Keeping the
// pure-string layer separate lets us unit-test formatting without the
// `perry/ui` runtime dependency.

import type { CellRendererKey } from '../types';

/** Sentinel string for SQL NULL — rendered in italics by the row builder. */
export const NULL_DISPLAY = 'NULL';

export function formatCell(value: unknown, renderer: CellRendererKey): string {
    if (value === null || value === undefined) {
        return NULL_DISPLAY;
    }
    if (renderer === 'text') {
        return formatText(value);
    }
    if (renderer === 'numeric') {
        return formatNumeric(value);
    }
    if (renderer === 'bool') {
        return formatBool(value);
    }
    if (renderer === 'json') {
        return formatJson(value);
    }
    if (renderer === 'array') {
        return formatArray(value);
    }
    if (renderer === 'bytea') {
        return formatBytea(value);
    }
    if (renderer === 'timestamp') {
        return formatTimestamp(value);
    }
    if (renderer === 'uuid') {
        return formatUuid(value);
    }
    // 'null' renderer is selected when the column is statically known to
    // be all-null. The non-null fallthrough also lands here.
    return String(value);
}

function formatText(value: unknown): string {
    return typeof value === 'string' ? value : String(value);
}

function formatNumeric(value: unknown): string {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value.toString() : String(value);
    }
    if (typeof value === 'bigint') {
        return value.toString();
    }
    // The driver wraps `numeric` results in a Decimal class with toString.
    // Don't import the class type here — that would couple the grid to the
    // driver. Duck-type via the .toString() contract.
    return String(value);
}

function formatBool(value: unknown): string {
    if (typeof value === 'boolean') {
        return value ? 't' : 'f';
    }
    return String(value);
}

function formatJson(value: unknown): string {
    // Single-line collapse — the cell is one line tall. Editing opens
    // a popover with the pretty-printed form (post-D2).
    if (typeof value === 'string') {
        return value;
    }
    // Avoid try/catch in the hot path: Perry's native codegen leaks a
    // try-frame on early-return inside a try block, and the row builder
    // calls this 20+ times per visible row × every scroll-tick rebuild,
    // tripping `MAX_TRY_DEPTH=128` after a few hundred cells. The
    // consumer (tusk-app) is responsible for sanitizing values so
    // `JSON.stringify` doesn't throw (no circular refs, no BigInts —
    // BigInts get formatNumeric anyway).
    return JSON.stringify(value);
}

function formatArray(value: unknown): string {
    if (Array.isArray(value)) {
        const parts: string[] = new Array(value.length);
        for (let i = 0; i < value.length; i++) {
            const v = value[i];
            parts[i] = v === null ? NULL_DISPLAY : String(v);
        }
        return '{' + parts.join(',') + '}';
    }
    return String(value);
}

function formatBytea(value: unknown): string {
    // Driver decodes bytea to a Buffer; format as `\x` + hex prefix.
    // Truncate after 16 bytes for the cell view; the editor shows full.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const v: any = value;
    if (v !== null && typeof v === 'object' && typeof v.length === 'number' && typeof v.readUInt8 === 'function') {
        const len: number = v.length;
        const cap = len < 16 ? len : 16;
        let hex = '\\x';
        for (let i = 0; i < cap; i++) {
            const b = v.readUInt8(i);
            const hi = (b >> 4) & 0xf;
            const lo = b & 0xf;
            hex = hex + nibble(hi) + nibble(lo);
        }
        if (len > cap) {
            hex = hex + '… (' + len + 'B)';
        }
        return hex;
    }
    return String(value);
}

function nibble(n: number): string {
    return n < 10 ? String.fromCharCode(48 + n) : String.fromCharCode(97 + n - 10);
}

function formatTimestamp(value: unknown): string {
    if (value instanceof Date) {
        return value.toISOString();
    }
    return String(value);
}

function formatUuid(value: unknown): string {
    return typeof value === 'string' ? value : String(value);
}
