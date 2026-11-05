/* =========================================================
   🔬 Science (1st–3rd grade)
   Level 1: living things, plants, senses, weather and seasons
   Level 2: animal groups, materials, magnets, life cycles, push and pull
   Level 3: states of matter, food chains, the water cycle, sound and light, the solar system
   Level 4: forces, rocks and fossils, energy, adaptations, simple machines
   Fact questions use the same row format as GK: [level, question, right answer, wrong answers…].
   Sorting questions (living or not, solid/liquid/gas, animal groups …) are built from lists.
   ========================================================= */
const SCIENCE = [
  // level 1
  [1, 'What do plants need to grow?', '☀️ sunlight and 💧 water', '🍬 candy', '📺 TV', '🧦 socks'],
  [1, 'Which part of a plant takes in water from the soil?', 'the roots', 'the flower', 'the leaves', 'the seeds'],
  [1, 'Which part of a plant makes seeds?', 'the flower', 'the roots', 'the stem', 'the soil'],
  [1, 'Which sense do you use to smell a flower?', '👃 smell', '👂 hearing', '👅 taste', '✋ touch'],
  [1, 'Which sense do you use to hear music?', '👂 hearing', '👀 sight', '👃 smell', '👅 taste'],
  [1, 'Which part of your body do you see with?', '👀 eyes', '👂 ears', '👃 nose', '✋ hands'],
  [1, 'Which season is the coldest?', '❄️ winter', '☀️ summer', '🌷 spring', '🍂 autumn (fall)'],
  [1, 'In which season do many trees lose their leaves?', '🍂 autumn (fall)', '🌷 spring', '☀️ summer', '🎂 birthday'],
  [1, 'What do we call water that falls from clouds?', '🌧️ rain', '🌈 a rainbow', '⚡ thunder', '🌬️ wind'],
  [1, 'What do you see after rain when the sun comes out?', '🌈 a rainbow', '⛄ a snowman', '🌙 the moon', '⭐ stars'],
  [1, 'When can we usually see the stars?', '🌙 at night', '☀️ at noon', '🌅 at breakfast', '🏫 at school'],
  [1, 'What gives us light and heat in the day?', '☀️ the sun', '🌙 the moon', '☁️ the clouds', '🌳 the trees'],
  [1, 'Which one is a baby frog?', 'a tadpole', 'a puppy', 'a chick', 'a calf'],
  [1, 'What does a caterpillar turn into?', '🦋 a butterfly', '🐝 a bee', '🐦 a bird', '🐞 a ladybug'],
  [1, 'What do bees make?', '🍯 honey', '🥛 milk', '🍞 bread', '🧀 cheese'],
  [1, 'Which animal lays eggs?', '🐔 hen', '🐶 dog', '🐮 cow', '🐱 cat'],
  [1, 'Which one helps you stay safe in the sun?', '🧴 sunscreen', '🧤 mittens', '🧣 a scarf', '☂️ an umbrella'],
  // level 2
  [2, 'What does a seed grow into?', '🌱 a plant', '🪨 a rock', '🐛 a worm', '☁️ a cloud'],
  [2, 'What is the life cycle of a frog?', 'egg → tadpole → froglet → frog', 'frog → egg → chick → frog', 'tadpole → butterfly → frog', 'seed → frog → tree'],
  [2, 'What is the life cycle of a butterfly?', 'egg → caterpillar → chrysalis → butterfly', 'caterpillar → egg → bee', 'egg → tadpole → butterfly', 'seed → flower → butterfly'],
  [2, 'What is a baby cow called?', 'a calf', 'a cub', 'a kitten', 'a joey'],
  [2, 'What is a baby bear called?', 'a cub', 'a calf', 'a foal', 'a lamb'],
  [2, 'What is a baby horse called?', 'a foal', 'a kid', 'a cub', 'a chick'],
  [2, 'Which material is see-through?', '🪟 glass', '🪵 wood', '🧱 brick', '🪨 stone'],
  [2, 'Which material is soft and stretchy?', '🧶 wool', '🪨 stone', '🪟 glass', '🔩 metal'],
  [2, 'Which material is best for a raincoat?', 'plastic (waterproof)', 'paper', 'cotton wool', 'bread'],
  [2, 'Opening a door away from you is a…', 'push', 'pull', 'jump', 'sleep'],
  [2, 'Opening a drawer toward you is a…', 'pull', 'push', 'spin', 'melt'],
  [2, 'A magnet can pull things made of…', '🔩 iron', '🪵 wood', '🧻 paper', '🥤 plastic'],
  [2, 'Where do fish breathe from?', 'gills', 'lungs', 'feathers', 'fins'],
  [2, 'Which animals have feathers?', '🐦 birds', '🐟 fish', '🐍 snakes', '🐸 frogs'],
  [2, 'Which animals drink milk from their mothers when they are babies?', 'mammals', 'insects', 'fish', 'birds'],
  [2, 'How many legs does an insect have?', '6', '8', '4', '10'],
  [2, 'How many legs does a spider have?', '8', '6', '4', '2'],
  [2, 'Which tool do we use to see tiny things up close?', '🔍 a magnifying glass', '📏 a ruler', '⏰ a clock', '🥄 a spoon'],
  [2, 'What makes a shadow?', 'something blocking light', 'a loud sound', 'cold water', 'a magnet'],
  // level 3
  [3, 'When water freezes, it turns into…', '🧊 ice', '♨️ steam', '🌫️ fog', '🧂 salt'],
  [3, 'When ice melts, it turns into…', '💧 water', '♨️ steam', '🪨 rock', '❄️ snow'],
  [3, 'When water boils, it turns into…', '♨️ steam (a gas)', '🧊 ice', '🪨 rock', '🧈 butter'],
  [3, 'Water vapor in the air turns into tiny drops in clouds. This is called…', 'condensation', 'evaporation', 'melting', 'freezing'],
  [3, 'The sun heats water and it rises into the air. This is called…', 'evaporation', 'condensation', 'freezing', 'raining'],
  [3, 'Rain, snow and hail falling from clouds are called…', 'precipitation', 'evaporation', 'gravity', 'erosion'],
  [3, 'In a food chain, where does the energy start?', '☀️ the sun', '🦁 the lion', '🐛 the worm', '🪨 the rocks'],
  [3, 'Plants make their own food. They are called…', 'producers', 'consumers', 'predators', 'decomposers'],
  [3, 'An animal that hunts other animals is a…', 'predator', 'producer', 'herbivore', 'plant'],
  [3, 'Worms and mushrooms break down dead plants. They are…', 'decomposers', 'predators', 'producers', 'planets'],
  [3, 'What is the sun?', '⭐ a star', '🪐 a planet', '🌙 a moon', '☄️ a comet'],
  [3, 'Which planet do we live on?', '🌍 Earth', '🔴 Mars', '🪐 Saturn', '☿ Mercury'],
  [3, 'Which planet is closest to the sun?', 'Mercury', 'Earth', 'Neptune', 'Jupiter'],
  [3, 'Which planet has big, bright rings?', '🪐 Saturn', '🔴 Mars', '🌍 Earth', '☿ Mercury'],
  [3, 'Why do we have day and night?', 'the Earth spins', 'the sun turns off', 'the moon hides the sun', 'clouds cover the sky'],
  [3, 'How long does the Earth take to go around the sun?', 'one year', 'one day', 'one hour', 'one week'],
  [3, 'Does the moon make its own light?', 'no, it reflects sunlight', 'yes, it is on fire', 'yes, it has lamps', 'no, it is a cloud'],
  [3, 'Sound is made when things…', 'vibrate', 'freeze', 'melt', 'sleep'],
  [3, 'Light travels in…', 'straight lines', 'circles', 'zigzags', 'squares'],
  [3, 'Which one lets electricity flow through it?', '🔩 metal', '🪵 wood', '🥤 plastic', '🧶 wool'],
  [3, 'Which animal becomes much less active and stays in a den for much of winter?', '🐻 bear', '🐶 dog', '🐔 hen', '🐟 fish'],
  [3, 'Birds flying to warmer places for winter is called…', 'migration', 'hibernation', 'evaporation', 'camouflage'],
  // level 4
  [4, 'The force that pulls things toward the Earth is…', 'gravity', 'friction', 'magnetism', 'electricity'],
  [4, 'The force that slows a sliding box on the floor is…', 'friction', 'gravity', 'light', 'sound'],
  [4, 'A ramp that helps us lift heavy things is a…', 'simple machine', 'planet', 'magnet', 'battery'],
  [4, 'A seesaw is an example of a…', 'lever', 'pulley', 'screw', 'magnet'],
  [4, 'A rope and wheel used to lift a flag is a…', 'pulley', 'lever', 'ramp', 'wedge'],
  [4, 'The remains of plants and animals from long ago found in rock are…', 'fossils', 'crystals', 'magnets', 'seeds'],
  [4, 'Hot melted rock that comes out of a volcano is…', 'lava', 'sand', 'ice', 'clay'],
  [4, 'Rock slowly worn away by wind and water is called…', 'erosion', 'evaporation', 'gravity', 'migration'],
  [4, 'Which energy source is renewable on a human timescale?', '☀️ sunlight', '⛽ gasoline', '🪨 coal', '🛢️ oil'],
  [4, 'Which one turns wind into electricity?', 'a wind turbine', 'a battery', 'a candle', 'a magnet'],
  [4, 'How does a polar bear stay warm?', 'thick fur and fat', 'big ears', 'long tail', 'sharp teeth'],
  [4, 'How does a cactus live in the hot desert?', 'it stores water', 'it has big leaves', 'it drinks soda', 'it hides underground'],
  [4, 'An animal hiding by matching its colors to its home uses…', 'camouflage', 'migration', 'hibernation', 'gravity'],
  [4, 'Why does a duck have webbed feet?', 'to swim', 'to climb trees', 'to dig holes', 'to fly faster'],
  [4, 'Living things get some features from their parents. These are…', 'inherited traits', 'fossils', 'habits', 'magnets'],
  [4, 'What does a thermometer measure?', '🌡️ temperature', '⏰ time', '📏 length', '⚖️ weight'],
  [4, 'Which tool measures how much rain fell?', 'a rain gauge', 'a ruler only', 'a compass', 'a magnet'],
  [4, 'Which planet is the largest?', 'Jupiter', 'Earth', 'Mars', 'Mercury'],
  [4, 'What is at the center of our solar system?', '☀️ the sun', '🌍 the Earth', '🌙 the moon', '🪐 Saturn'],
  [4, 'Which gas do plants take in from the air?', 'carbon dioxide', 'helium', 'smoke', 'steam'],
  [4, 'Which gas do people need to breathe?', 'oxygen', 'carbon dioxide', 'helium', 'smoke'],

  // Additional observation, explanation and evidence questions.
  [1, 'Which part of a plant holds it upright?', 'the stem', 'the roots', 'the flower', 'the seed'],
  [1, 'What can you use to observe a tiny ant closely?', 'a magnifying glass', 'a hammer', 'a spoon', 'a pillow'],
  [1, 'What happens to a puddle when sunshine warms it for a long time?', 'it may get smaller', 'it becomes a rock', 'it turns into sand', 'it grows leaves'],
  [1, 'How can you tell which toy feels rough?', 'touch it carefully', 'look at the clock', 'listen to a song', 'smell a flower'],
  [1, 'What do you hear during a thunderstorm?', 'thunder', 'sunlight', 'a rainbow', 'snow'],
  [1, 'Which part of a flowering plant often attracts bees?', 'the flowers', 'the roots', 'the soil', 'the pot'],
  [1, 'Which tool helps you observe the shape of a leaf?', 'a magnifying glass', 'a measuring cup', 'a fork', 'a wheel'],
  [1, 'What happens when a shadow moves as the sun changes position?', 'the shadow changes position', 'the shadow becomes a stone', 'the tree melts', 'the sun turns off'],
  [2, 'Which material can soak up spilled water?', 'a sponge', 'a glass marble', 'a metal spoon', 'a plastic block'],
  [2, 'Which part of a new seedling usually grows downward first?', 'the root', 'the flower', 'the fruit', 'the leaf'],
  [2, 'What can we do to test whether a magnet attracts an object?', 'move the magnet near it', 'put it in a freezer', 'paint it red', 'drop it in the sink'],
  [2, 'What is one fair way to compare two toy cars rolling down a ramp?', 'start them from the same point', 'push one much harder', 'use two different slopes', 'stop one halfway'],
  [2, 'Which animal has six legs when fully grown?', 'an ant', 'a spider', 'a crab', 'a dog'],
  [2, 'Which tool tells us the temperature outside?', 'a thermometer', 'a compass', 'a ruler', 'a magnifying glass'],
  [2, 'Why do many birds build nests?', 'to protect eggs and young', 'to make rain', 'to grow leaves', 'to find magnets'],
  [2, 'Which natural material comes from trees?', 'wood', 'glass', 'steel', 'plastic'],
  [3, 'What is a prediction in a science investigation?', 'a reasoned guess about what may happen', 'a measurement after a test', 'a kind of animal', 'the color of a notebook'],
  [3, 'What should we change in a fair experiment with two seedlings?', 'only the factor being tested', 'every factor at once', 'the plant names only', 'nothing at all'],
  [3, 'Why do we write down our observations?', 'to compare and remember evidence', 'to make plants grow faster', 'to stop rain', 'to change magnets'],
  [3, 'Where does most water vapor come from during evaporation?', 'liquid water', 'solid rock', 'metal spoons', 'dry sand'],
  [3, 'Which statement best describes a shadow?', 'a dark area where light is blocked', 'a type of gas', 'a sound wave', 'a source of heat'],
  [3, 'What happens when light passes through clear glass?', 'most of it passes through', 'it turns into soil', 'it always stops completely', 'it becomes louder'],
  [3, 'What happens when a plant is pollinated?', 'pollen reaches a flower part that can lead to seeds', 'its roots turn into metal', 'its leaves become rocks', 'its stem becomes water'],
  [3, 'Why is a food chain shown with arrows?', 'to show the flow of food energy', 'to show which animal is tallest', 'to mark the weather', 'to count all the trees'],
  [4, 'What is evidence in a science investigation?', 'observations and measurements that support a claim', 'a guess without testing', 'a story with no observations', 'a drawing of a star only'],
  [4, 'How can we reduce friction between two moving parts?', 'use a suitable lubricant', 'add rough sand', 'press them together harder', 'remove every wheel'],
  [4, 'What makes the pitch of a musical sound higher?', 'faster vibrations', 'slower vibrations', 'a darker color', 'more water'],
  [4, 'Which is an example of erosion?', 'a river carrying soil away', 'a seed sprouting', 'a bird laying an egg', 'a candle giving light'],
  [4, 'Which is an example of deposition?', 'a river leaving sand on a bank', 'ice melting into water', 'a magnet attracting iron', 'wind moving a kite'],
  [4, 'What do we call a path through which electricity can flow?', 'a circuit', 'a fossil', 'a shadow', 'a lever'],
  [4, 'Why can a closed electrical circuit light a bulb?', 'it makes a complete path for current', 'it makes the bulb heavier', 'it blocks all electricity', 'it changes wire into water'],
  [4, 'What evidence can show that the ground changed over time?', 'layers of rocks and fossils', 'a painted fence', 'a paper airplane', 'a toy whistle'],
];
// sort it into a group: [level, question, groups, items[name, emoji, group]]
const SCI_SORT = [
  [1, 'Is it living or non-living?', ['living', 'non-living'], [
    ['dog', '🐶', 0], ['tree', '🌳', 0], ['flower', '🌷', 0], ['fish', '🐟', 0], ['bird', '🐦', 0], ['mushroom', '🍄', 0], ['cactus', '🌵', 0],
    ['butterfly', '🦋', 0], ['frog', '🐸', 0], ['bee', '🐝', 0], ['grass', '🌱', 0], ['horse', '🐴', 0],
    ['rock', '🪨', 1], ['car', '🚗', 1], ['chair', '🪑', 1], ['ball', '⚽', 1], ['cup', '🥤', 1], ['book', '📖', 1], ['shoe', '👟', 1],
    ['robot', '🤖', 1], ['kite', '🪁', 1], ['phone', '📱', 1], ['spoon', '🥄', 1], ['teddy bear', '🧸', 1]]],
  [2, 'Will a magnet pick it up?', ['yes', 'no'], [
    ['paper clip', '📎', 0], ['iron nail', '🔩', 0], ['safety pin', '🧷', 0], ['steel scissors', '✂️', 0],
    ['pencil', '✏️', 1], ['wooden block', '🪵', 1], ['teddy bear', '🧸', 1], ['apple', '🍎', 1], ['paper', '📄', 1], ['sock', '🧦', 1], ['feather', '🪶', 1], ['plastic cup', '🥤', 1]]],
  [2, 'Which animal group is it in?', ['mammal', 'bird', 'fish', 'insect'], [
    ['cow', '🐮', 0], ['dog', '🐶', 0], ['whale', '🐋', 0], ['bat', '🦇', 0], ['lion', '🦁', 0], ['monkey', '🐵', 0], ['elephant', '🐘', 0],
    ['eagle', '🦅', 1], ['penguin', '🐧', 1], ['owl', '🦉', 1], ['parrot', '🦜', 1], ['duck', '🦆', 1], ['ostrich', '🐦', 1],
    ['shark', '🦈', 2], ['goldfish', '🐠', 2], ['tuna', '🐟', 2], ['pufferfish', '🐡', 2],
    ['ant', '🐜', 3], ['bee', '🐝', 3], ['ladybug', '🐞', 3], ['butterfly', '🦋', 3], ['beetle', '🪲', 3]]],
  [3, 'Is it a solid, a liquid or a gas?', ['solid', 'liquid', 'gas'], [
    ['ice cube', '🧊', 0], ['rock', '🪨', 0], ['apple', '🍎', 0], ['brick', '🧱', 0], ['spoon', '🥄', 0], ['book', '📖', 0],
    ['water', '💧', 1], ['milk', '🥛', 1], ['juice', '🧃', 1], ['honey', '🍯', 1], ['rain', '🌧️', 1], ['oil', '🫗', 1],
    ['water vapor', '💨', 2], ['air in a balloon', '🎈', 2], ['helium in a balloon', '🎈', 2], ['the air we breathe', '🌬️', 2]]],
  [3, 'What does it eat?', ['plants (herbivore)', 'meat (carnivore)', 'both (omnivore)'], [
    ['cow', '🐮', 0], ['rabbit', '🐰', 0], ['horse', '🐴', 0], ['deer', '🦌', 0], ['giraffe', '🦒', 0], ['elephant', '🐘', 0], ['koala', '🐨', 0],
    ['lion', '🦁', 1], ['tiger', '🐯', 1], ['shark', '🦈', 1], ['wolf', '🐺', 1], ['eagle', '🦅', 1], ['crocodile', '🐊', 1],
    ['bear', '🐻', 2], ['pig', '🐷', 2], ['chicken', '🐔', 2], ['raccoon', '🦝', 2]]],
  [4, 'Which animal group is it in?', ['mammal', 'reptile', 'amphibian', 'bird'], [
    ['dolphin', '🐬', 0], ['bat', '🦇', 0], ['kangaroo', '🦘', 0], ['whale', '🐋', 0],
    ['snake', '🐍', 1], ['lizard', '🦎', 1], ['turtle', '🐢', 1], ['crocodile', '🐊', 1],
    ['frog', '🐸', 2], ['salamander', '🦎', -1], ['toad', '🐸', -1],
    ['penguin', '🐧', 3], ['flamingo', '🦩', 3], ['owl', '🦉', 3]]],
].map(([lv, q, groups, items]) => [lv, q, groups, items.filter((x) => x[2] >= 0)]);
function genScience(level) {
  // about half sorting questions (lots of variety), half facts
  const sorts = SCI_SORT.filter((s) => s[0] <= level);
  if (sorts.length && Math.random() < 0.45) {
    const [, q, groups, items] = pick(sorts);
    const [name, e, gi] = pick(items);
    const opts = groups.map((g) => ({ v: g, html: g }));
    return {
      key: `sci-${q}-${name}`, text: q, say: [q, `${name}?`],
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
