const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const roots = ['src', 'scripts'];
const files = [];

function collectJavaScriptFiles(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      collectJavaScriptFiles(fullPath);
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.js')) {
      files.push(fullPath);
    }
  }
}

for (const root of roots) {
  collectJavaScriptFiles(root);
}

for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

console.log(`Checked ${files.length} JavaScript files.`);
