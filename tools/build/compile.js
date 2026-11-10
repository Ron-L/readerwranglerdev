// tools/build/compile.js — compile ONE app script the way the page used to compile it in the browser (TODO "Faster
// loading", 2026-11-10). Reads the source on stdin, writes the compiled script on stdout; a syntax error goes to stderr
// with exit 1. Called by tools/build.py (the one entry point: the build, serve.py's rebuild on demand, the commit check).
//
// The same compile the page ran with @babel/standalone 7.29.7, pinned here (package.json):
//   - JSX → React.createElement (the classic runtime: React is a global, no imports);
//   - const / let → var, as the browser's compile did. The modern form exposed a real bug (TODO "With a filter on, the
//     right pane still shows subfolders with no matching books") — drop this plugin once that task's check is clean,
//     so the next such bug is a visible crash, not a silent "undefined".
//   - retainLines: every statement stays on its source line, so an error's line number IS the source's — no map files.
'use strict';
const babel = require('@babel/core');

let src = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => { src += d; });
process.stdin.on('end', () => {
    try {
        const out = babel.transformSync(src, {
            babelrc: false,
            configFile: false,
            sourceType: 'script',
            retainLines: true,
            compact: false,          // keep the spacing (the default squeezes files over 500 KB, with a note)
            presets: [[require.resolve('@babel/preset-react'), { runtime: 'classic' }]],
            plugins: [require.resolve('@babel/plugin-transform-block-scoping')],
        });
        process.stdout.write(out.code);
    } catch (e) {
        process.stderr.write(String(e.message || e) + '\n');
        process.exit(1);
    }
});
