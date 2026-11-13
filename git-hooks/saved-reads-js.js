#!/usr/bin/env node
// git-hooks/saved-reads-js.js — the JavaScript half of check-saved-reads.py: where does each given source read a saved
// value with a bare JSON.parse, instead of through the one reader (uiHelpers.js readSaved)?
//
// A "bare read" is a JSON.parse whose argument is the stored text — a call to `.getItem(…)` on anything (localStorage,
// sessionStorage, window.localStorage, a variable holding one) — directly (`JSON.parse(localStorage.getItem(K) || '{}')`)
// or through a variable the read was put in (`const s = localStorage.getItem(K); … JSON.parse(s)`), wherever it sits: a
// hand-written try/catch around it is still a bare read (the rule is ONE reader, so a damaged setting is handled the same
// way everywhere). Allowed: a read whose line — or the comment lines directly above it — says `not-readSaved: <why>`
// (the reader itself; code that runs where uiHelpers.js isn't loaded; a read whose damage must mean more than a default).
//
// Reads JSON from stdin: [{ "path": "...", "src": "..." }, …]; prints JSON: { "bare": [{ path, line, code }],
// "allowed": [{ path, line, why }], "unparsed": [{ path, error }] }.
// Exit: 0 ran · 2 setup problem — fails LOUD, never silently passes. Tested by test/test_check_saved_reads.py.
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
let babel, presetReact;
try {
    babel = require(require.resolve('@babel/core', { paths: [ROOT] }));
    presetReact = require.resolve('@babel/preset-react', { paths: [ROOT] });
} catch (e) {
    console.error('saved-reads-js: SETUP — @babel/core + @babel/preset-react are not installed in this repo.\n' +
        '  Fix:  npm i --no-save @babel/core @babel/preset-react   (then commit again)');
    process.exit(2);
}

const MARKER = /not-readSaved:\s*(\S.{3,})/;   // the marker, with at least a few words of why

const isJsonParse = (callee) => callee.type === 'MemberExpression' && !callee.computed
    && callee.object.type === 'Identifier' && callee.object.name === 'JSON'
    && callee.property.type === 'Identifier' && callee.property.name === 'parse';

const isStorageRead = (node) => node && node.type === 'CallExpression' && node.callee.type === 'MemberExpression'
    && !node.callee.computed && node.callee.property.type === 'Identifier' && node.callee.property.name === 'getItem';

// Can this expression (a path) BE the stored text? The read itself; either side of `||` / `??` (`… || '{}'`); either
// branch of `?:`; `await` / parentheses around one; or a variable given one (its declaration or any assignment). Not
// anything merely COMPUTED from a stored value (an address built from a saved id is not a saved value).
function holdsStorageRead(p, seen = new Set()) {
    if (!p || !p.node) return false;
    const n = p.node;
    if (isStorageRead(n)) return true;
    if (p.isLogicalExpression()) return holdsStorageRead(p.get('left'), seen) || holdsStorageRead(p.get('right'), seen);
    if (p.isConditionalExpression()) return holdsStorageRead(p.get('consequent'), seen) || holdsStorageRead(p.get('alternate'), seen);
    if (p.isAwaitExpression() || p.isParenthesizedExpression()) return holdsStorageRead(p.get(n.type === 'AwaitExpression' ? 'argument' : 'expression'), seen);
    if (p.isSequenceExpression()) return holdsStorageRead(p.get(`expressions.${n.expressions.length - 1}`), seen);
    if (p.isIdentifier()) {
        const binding = p.scope.getBinding(n.name);
        if (!binding || seen.has(binding)) return false;
        seen.add(binding);
        const sources = [];
        if (binding.path.isVariableDeclarator()) sources.push(binding.path.get('init'));
        for (const v of binding.constantViolations) {
            if (v.isAssignmentExpression()) sources.push(v.get('right'));
            else if (v.isVariableDeclarator()) sources.push(v.get('init'));
        }
        return sources.some(s => holdsStorageRead(s, seen));
    }
    return false;
}

// The marker on the read's own line, or in the comment lines directly above it.
function markerFor(lines, line) {
    let m = MARKER.exec(lines[line - 1] || '');
    for (let n = line - 2; !m && n >= 0 && /^\s*(\/\/|\/\*|\*)/.test(lines[n]); n--) m = MARKER.exec(lines[n]);
    return m ? m[1].trim() : null;
}

function check(file, src, out) {
    let ast;
    try {
        ast = babel.parseSync(src, { filename: file, presets: [presetReact], sourceType: 'unambiguous', babelrc: false, configFile: false });
    } catch (e) {
        out.unparsed.push({ path: file, error: String(e.message || e).split('\n')[0] });
        return;
    }
    const lines = src.split(/\r?\n/);
    babel.traverse(ast, {
        CallExpression(p) {
            if (!isJsonParse(p.node.callee) || !p.node.arguments.length) return;
            if (!holdsStorageRead(p.get('arguments.0'))) return;
            const line = p.node.loc.start.line;
            const why = markerFor(lines, line);
            if (why) out.allowed.push({ path: file, line, why });
            else out.bare.push({ path: file, line, code: (lines[line - 1] || '').trim().slice(0, 160) });
        },
    });
}

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => { input += d; });
process.stdin.on('end', () => {
    const out = { bare: [], allowed: [], unparsed: [] };
    for (const { path: p, src } of JSON.parse(input)) check(p, src, out);
    process.stdout.write(JSON.stringify(out));
});
