const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', 'client', 'src');
const exts = ['.js', '.jsx', '.ts', '.tsx'];

function walk(dir) {
  const res = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      res.push(...walk(full));
    } else if (/\.(js|jsx|ts|tsx)$/.test(entry.name)) {
      res.push(full);
    }
  }
  return res;
}

function fileExistsCandidate(base) {
  // If path already has extension, check directly and also try index
  if (exts.includes(path.extname(base))) {
    return fs.existsSync(base);
  }
  for (const e of exts) {
    if (fs.existsSync(base + e)) return true;
  }
  // index.*
  for (const e of exts) {
    if (fs.existsSync(path.join(base, 'index' + e))) return true;
  }
  return false;
}

const files = walk(ROOT);
const problems = [];

const importRegex = /import\s+[^'\"]+from\s+['\"]([^'\"]+)['\"];?/g;
const dynamicRegex = /require\(\s*['\"]([^'\"]+)['\"]\s*\)/g;

for (const f of files) {
  const content = fs.readFileSync(f, 'utf8');
  const dir = path.dirname(f);
  let m;
  while ((m = importRegex.exec(content)) !== null) {
    const spec = m[1];
    if (spec.startsWith('.')) {
      const target = path.resolve(dir, spec);
      if (!fileExistsCandidate(target)) {
        problems.push({file: f, import: spec, resolved: target});
      }
    }
  }
  while ((m = dynamicRegex.exec(content)) !== null) {
    const spec = m[1];
    if (spec.startsWith('.')) {
      const target = path.resolve(dir, spec);
      if (!fileExistsCandidate(target)) {
        problems.push({file: f, import: spec, resolved: target});
      }
    }
  }
}

if (problems.length === 0) {
  console.log('No missing relative import targets found.');
  process.exit(0);
}

console.log('Missing import targets:');
for (const p of problems) {
  console.log(`- ${path.relative(ROOT, p.file)} -> '${p.import}' (resolved: ${p.resolved})`);
}
process.exit(1);
