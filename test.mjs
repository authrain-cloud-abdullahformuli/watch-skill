import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const ROOT = new URL('.', import.meta.url).pathname.replace(/\/$/, '');
const UPSTREAM = ['oxbshw', 'ozmaki', 'harikp2002'];
const TEXT_EXTS = new Set(['.md', '.json', '.html', '.sh', '.yml', '.yaml', '.txt', '.css', '.js', '.mjs', '.py', '.toml', '.ts', '.tsx', '.cff']);

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✅ ${name}`);
  } catch (e) {
    failed++;
    console.log(`  ❌ ${name}`);
    console.log(`     ${e.message}`);
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function walk(dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    if (entry === '.git' || entry === 'node_modules' || entry === 'test.mjs' || entry === '.venv' || entry === 'uv.lock') continue;
    const full = join(dir, entry);
    const s = statSync(full);
    if (s.isDirectory()) results.push(...walk(full));
    else if (TEXT_EXTS.has(extname(full))) results.push(full);
  }
  return results;
}

console.log('\n🔍 Watch Skill — Verification Suite\n');

// 1. No upstream references
console.log('📝 Upstream cleanliness');
const files = walk(ROOT);
for (const f of files) {
  const content = readFileSync(f, 'utf8');
  const rel = f.replace(ROOT + '/', '');
  for (const term of UPSTREAM) {
    test(`${rel} has no "${term}"`, () => {
      assert(!content.toLowerCase().includes(term.toLowerCase()),
        `Found "${term}" in ${rel}`);
    });
  }
}

// 2. Required files exist
console.log('\n📦 Required files');
const required = ['LICENSE', 'README.md', 'CITATION.cff', 'MAINTAINERS.md', 'pyproject.toml', 'server.json'];
for (const f of required) {
  test(`${f} exists`, () => {
    assert(statSync(join(ROOT, f)).isFile(), `Missing ${f}`);
  });
}

// 3. LICENSE contains Abdullah Formuli
console.log('\n🔐 License check');
const license = readFileSync(join(ROOT, 'LICENSE'), 'utf8');
test('LICENSE mentions Abdullah Formuli', () => {
  assert(license.includes('Abdullah Formuli'), 'Missing Abdullah Formuli in LICENSE');
});

// 4. Pyproject config points to correct repo
console.log('\n📦 pyproject.toml check');
const pyproject = readFileSync(join(ROOT, 'pyproject.toml'), 'utf8');
test('pyproject.toml author is Abdullah Formuli', () => {
  assert(pyproject.includes('Abdullah Formuli'), 'Missing Abdullah Formuli author in pyproject.toml');
});
test('pyproject.toml repository points to authrain-cloud-abdullahformuli', () => {
  assert(pyproject.includes('authrain-cloud-abdullahformuli'), 'Missing authrain-cloud-abdullahformuli in pyproject.toml');
});

// 5. Plugin config points to correct repo
console.log('\n🔌 Plugin config');
const plugin = JSON.parse(readFileSync(join(ROOT, '.claude-plugin', 'plugin.json'), 'utf8'));
test('plugin.json author is Abdullah Formuli', () => {
  assert(plugin.author.name === 'Abdullah Formuli', `Author is ${plugin.author.name}`);
});
test('plugin.json repository points to authrain-cloud-abdullahformuli', () => {
  assert(plugin.repository.includes('authrain-cloud-abdullahformuli'), `Repo is ${plugin.repository}`);
});

// 6. Skills exist (10 skills)
console.log('\n🎬 Skills check');
const expectedSkills = [
  'asking-with-evidence',
  'configuring-vision',
  'extracting-structure',
  'learning-from-mistakes',
  'recovering-from-errors',
  'sharing-results',
  'the-loop',
  'video-memory',
  'watch',
  'watching-videos'
];
for (const skill of expectedSkills) {
  test(`skills/${skill}/SKILL.md exists`, () => {
    assert(statSync(join(ROOT, 'skills', skill, 'SKILL.md')).isFile(), `Missing skills/${skill}/SKILL.md`);
  });
}

console.log(`\n${'═'.repeat(50)}`);
console.log(`  ${passed} passed, ${failed} failed`);
console.log(`${'═'.repeat(50)}\n`);

process.exit(failed > 0 ? 1 : 0);
