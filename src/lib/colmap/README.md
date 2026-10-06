# COLMAP parsers

Cherry-picked from the `colmap-treasure-chest` sibling repo (a standalone React COLMAP
debugger), not vendored wholesale. What came across is the part with no framework in it:

    types.ts  geometry.ts  parse-bin.ts  parse-db.ts

Its React UI did not, because we already have the 3D half: `CameraPoses3D.vue` draws frustums
and the sparse cloud with three.js, batched into one LineSegments and one Points buffer. What
we did NOT have is the ability to read a reconstruction and its MATCH GRAPH in the browser,
which is the diagnostic that matters: a fold is invisible in a point cloud and obvious in
covisibility. Its `store.ts` (zustand) is replaced by a Vue composable, `useColmap.js`.

`parse-db.ts` needs `sql.js` — a COLMAP database is SQLite, and reading it client-side needs
a WASM build. The other four have no dependencies at all.

Upstream is on Lovable; if these files are changed there, diff rather than re-copy, since the
Vue side depends on the shapes in types.ts.
