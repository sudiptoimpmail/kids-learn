// Every question bank the app ships (banks/*.json) passes the kids-core checker, is listed for start-up and offline use,
// and has a recording for every sentence it says.
const assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm'), path = require('node:path');
const root = path.join(__dirname, '..'), read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const QuestionBank = vm.runInNewContext(read('core/question-bank.js') + ';QuestionBank', {});
const cfg = JSON.parse(read('app.config.json')), sw = read('sw.js');
const clips = JSON.parse(read(cfg.voice.clips[cfg.voice.lang])), map = clips.clips || clips;
const key = (t) => String(t).toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();
const files = fs.readdirSync(path.join(root, 'banks')).filter((f) => f.endsWith('.json')).sort();
assert.ok(files.length >= 1, 'no question banks');
assert.deepEqual(files.map((f) => f.replace(/\.json$/, '')), [...cfg.banks].sort(), 'app.config.json "banks" must list every file in banks/');
let questions = 0, lessons = 0, sentences = 0; const ids = new Set();
for (const f of files) {
  const bank = JSON.parse(read('banks/' + f));
  assert.equal(bank.id + '.json', f, f + ' must be named after its id');
  assert.deepEqual([...QuestionBank.check(bank, { grades: cfg.packs.grades })], [], f);
  assert.ok(sw.includes(`"banks/${f}"`), f + ' is not in sw.js, so it would be missing offline');
  for (const q of bank.questions) { assert.ok(!ids.has(q.id), 'two banks share the question id ' + q.id); ids.add(q.id); }
  const unrecorded = [...QuestionBank.spoken(bank)].filter((s) => !map[key(s)]);
  assert.deepEqual(unrecorded.slice(0, 10), [], f + ': sentences with no recording');
  const tables = QuestionBank.rows(bank);
  assert.equal(tables.questions.length, bank.questions.length);
  questions += bank.questions.length; lessons += (bank.lessons || []).length; sentences += QuestionBank.spoken(bank).length;
}
assert.ok(sw.includes('"core/question-bank.js"'));
console.log(`PASS question banks: ${files.length} bank(s), ${questions} questions, ${lessons} lessons, ${sentences} recorded sentences, all in the common format`);
