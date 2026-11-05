/* =========================================================
   🔬 Science (1st–3rd grade)
   Level 1: living things, plants, senses, weather and seasons
   Level 2: animal groups, materials, magnets, life cycles, push and pull
   Level 3: states of matter, food chains, the water cycle, sound and light, the solar system
   Level 4: forces, rocks and fossils, energy, adaptations, simple machines
   Fact questions use the same row format as GK: [level, question, right answer, wrong answers…].
   Sorting questions (living or not, solid/liquid/gas, animal groups …) are built from lists.
   ========================================================= */
const SCIENCE = ContentData.get('science','SCIENCE');
// sort it into a group: [level, question, groups, items[name, emoji, group]]
const SCI_SORT = ContentData.get('science','SCI_SORT');
function genScience(level) {
  // about half sorting questions (lots of variety), half facts
  const sorts = SCI_SORT.filter((s) => s[0] <= level);
  const onLevel = sorts.filter(s => s[0] === level);
  if (sorts.length && Math.random() < 0.45) {
    const [, q, groups, items] = pick(onLevel.length && Math.random() < 0.8 ? onLevel : sorts);
    const [name, e, gi] = pick(items);
    const opts = groups.map((g) => ({ v: g, html: g }));
    return {
      key: `sci-${q}-${name}`, text: q, say: CLIPS[clipKey(q)] ? [q, CLIPS[clipKey(`${name}?`)] ? `${name}?` : 'Find the answer!'] : 'Find the answer!',
      main: `<div class="sci-item"><span>${e}</span><b>${name}</b></div>`, mainClass: 'ph-main',
      options: opts, answer: groups[gi], optClass: 'opt-text',
      hint: { html: '', say: 'Think about it!', remove: true },
    };
  }
  const question = mcQuestion('sci', pickLevelled(SCIENCE, level), level);
  // Older readers can read the full scientific prompt; reuse a genuine
  // recorded instruction when a newly authored sentence lacks studio audio.
  if (!CLIPS[clipKey(question.say)]) question.say = 'Find the answer!';
  return question;
}
