/* =========================================================
   Reading: more sentences and stories for "Read & Answer"
   Level 1 – 2: short sentences made from simple word patterns (lots of them)
   Level 3: 1st grade, 2 – 3 sentences
   Level 4: 2nd grade, 3 – 4 sentences
   Level 5: 3rd grade, 5 sentences
   Level 6: 3rd grade challenge, 6 – 8 sentences
   Each story has two or three questions, so the same story can be asked a new way.
   ========================================================= */

// [sentence, question, [right answer, wrong, wrong], level]
const PATTERN_SENTENCES = ContentData.get('reading-patterns','PATTERN_SENTENCES');

// [level, story, [[question, [right, wrong, wrong]], ...]]
const STORIES = ContentData.get('stories','STORIES');
