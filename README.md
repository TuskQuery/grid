# `@tusk/grid`

Virtualized data-grid component for [Tusk](https://github.com/TuskQuery). Postgres-agnostic — exposes a `ColumnDef` / `Row` shape and cell-renderer plugins, takes rows from any source.

## Install

```bash
bun add @tusk/grid
# or, when developing alongside Tusk:
#   "@tusk/grid": "file:../tusk-grid"
```

## Usage

```ts
import { Grid, type ColumnDef, type Row } from '@tusk/grid';

const columns: ColumnDef[] = [
  { name: 'id', typeHint: 'int4', renderer: 'numeric', isPrimaryKey: true, widthPx: 80 },
  { name: 'name', typeHint: 'text', renderer: 'text', isPrimaryKey: false, widthPx: 200 },
];
const rows: Row[] = [[1, 'Alice'], [2, 'Bob']];

const { handle, api } = Grid({
  columns,
  rows,
  onCellCommit(rowIndex, columnIndex, newValue) { /* … */ },
});
```

## Status

Pre-D2: placeholder widget that renders `Grid: N rows × M cols`. Real virtualization, column header, cell renderers, and inline edit land in milestone D2 of the Tusk plan.

## License

[MIT](./LICENSE).
