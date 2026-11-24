// Puts the geometry engine's WASM where the browser loads it (/manifold.wasm).
// Runs after install and before builds. public/ isn't in git (the file is
// generated), so it's created here when missing.
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const from = path.join(root, "node_modules", "manifold-3d", "manifold.wasm");
const to = path.join(root, "public", "manifold.wasm");
fs.mkdirSync(path.dirname(to), { recursive: true });
fs.copyFileSync(from, to);
console.log("copied manifold.wasm to public/");
