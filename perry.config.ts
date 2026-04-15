/**
 * Perry compiler configuration for @tusk/grid.
 *
 * This is a library package, not an application. It compiles as part of
 * tusk-app via the file: dependency. The perry config exists so tsgo /
 * Perry picks up the package metadata when a consumer imports from
 * `@tusk/grid`.
 */

export default {
  name: '@tusk/grid',
  version: '0.1.0',
  entry: 'src/index.ts',
};
