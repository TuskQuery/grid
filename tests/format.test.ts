import { describe, it, expect } from 'bun:test';
import { formatCell, NULL_DISPLAY } from '../src/cell-renderers/format';

describe('formatCell', () => {
    it('renders SQL NULL with the sentinel', () => {
        expect(formatCell(null, 'text')).toBe(NULL_DISPLAY);
        expect(formatCell(undefined, 'numeric')).toBe(NULL_DISPLAY);
    });

    it('formats text', () => {
        expect(formatCell('hello', 'text')).toBe('hello');
    });

    it('formats numbers and bigints', () => {
        expect(formatCell(42, 'numeric')).toBe('42');
        expect(formatCell(3.14, 'numeric')).toBe('3.14');
        expect(formatCell(9223372036854775807n, 'numeric')).toBe('9223372036854775807');
    });

    it('formats infinity / nan numerics passthrough', () => {
        expect(formatCell(Infinity, 'numeric')).toBe('Infinity');
        expect(formatCell(NaN, 'numeric')).toBe('NaN');
    });

    it('formats bool as Postgres-style t / f', () => {
        expect(formatCell(true, 'bool')).toBe('t');
        expect(formatCell(false, 'bool')).toBe('f');
    });

    it('renders json by stringifying', () => {
        expect(formatCell({ k: 1 }, 'json')).toBe('{"k":1}');
        // Already-encoded jsonb returns a string from the driver
        expect(formatCell('{"x":42}', 'json')).toBe('{"x":42}');
    });

    it('renders text arrays in Postgres curly form', () => {
        expect(formatCell([1, 2, 3], 'array')).toBe('{1,2,3}');
        expect(formatCell(['a', 'b'], 'array')).toBe('{a,b}');
        expect(formatCell([1, null, 3], 'array')).toBe('{1,NULL,3}');
    });

    it('renders bytea as \\x hex with byte-count tail when truncated', () => {
        const buf = Buffer.from([0xde, 0xad, 0xbe, 0xef]);
        expect(formatCell(buf, 'bytea')).toBe('\\xdeadbeef');

        const long = Buffer.alloc(20);
        for (let i = 0; i < 20; i++) {
            long.writeUInt8(i, i);
        }
        const out = formatCell(long, 'bytea') as string;
        expect(out.startsWith('\\x000102030405060708090a0b0c0d0e0f')).toBe(true);
        expect(out.endsWith('20B)')).toBe(true);
    });

    it('renders timestamps as ISO strings', () => {
        const d = new Date('2026-04-15T10:00:00.000Z');
        expect(formatCell(d, 'timestamp')).toBe('2026-04-15T10:00:00.000Z');
    });

    it('renders uuid as the string', () => {
        expect(formatCell('123e4567-e89b-12d3-a456-426614174000', 'uuid')).toBe(
            '123e4567-e89b-12d3-a456-426614174000'
        );
    });
});
