// tools/build/tailwind.config.js — the styles built ahead of time (TODO "Faster loading", step 2; 2026-11-11). The pages
// used to load Tailwind's in-browser style builder (cdn.tailwindcss.com, which serves 3.4.17) and write these styles on
// every load; now tools/build.py builds them once into dist/tailwind.css with the same Tailwind, pinned in package.json.
// Default settings, as the in-browser builder used. The files to read for class names come from tools/build.py
// (RW_TW_FILES: every tracked page and script at the project root, from git — so the commit check, which builds from
// the staged copies, reads exactly the same set).
'use strict';
module.exports = {
    content: (process.env.RW_TW_FILES || '').split('\n').filter(Boolean),
};
