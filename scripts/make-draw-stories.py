#!/usr/bin/env python3
"""Draw the Story: short original stories told aloud with no pictures; the child draws one scene.
Each grade gets its own stories. Younger children get short stories, a concrete thing to draw and picture hints;
older children get longer stories and scenes that need thinking (a feeling, a clue, what happens next), with
hints as questions and a "talk about it" question at the end. Writes data/draw-stories.json."""
import json, os

def S(id, title, text, scenes): return {"id": id, "title": title, "text": text, "scenes": scenes}
def sc(ask, hints, check, talk=None):
    d = {"ask": ask, "hints": hints, "check": [{"label": l, "icon": i} for l, i in check]}
    if talk: d["talk"] = talk
    return d

STORIES = {
 "prek": [
  S("bo-ball", "Bo and the Red Ball", ["Bo is a little brown dog.", "Bo has a big red ball.", "Bo kicks the ball up the hill.", "The ball rolls down, and Bo runs after it!"], [
    sc("Draw Bo the dog with his big red ball.", ["Bo is a little brown dog.", "His ball is big and red."], [("dog", "🐶"), ("red ball", "🔴")]),
    sc("Draw the hill. Show the ball rolling down!", ["Make a hill, like a big bump.", "Put the red ball on the hill."], [("hill", "⛰️"), ("red ball", "🔴"), ("dog", "🐶")])]),
  S("duck-rain", "Little Duck Likes Rain", ["Drip, drop! It is raining.", "Little Duck is happy.", "She jumps in a big puddle.", "Splash!"], [
    sc("Draw Little Duck in the rain.", ["Little Duck is yellow.", "Draw rain drops falling down."], [("duck", "🦆"), ("rain", "🌧️")]),
    sc("Draw the big puddle. Make a splash!", ["A puddle is a little pool of water.", "Little Duck jumps in it."], [("puddle", "💧"), ("duck", "🦆")])]),
  S("sun-moon", "Good Night, Sun", ["The sun is going to bed.", "The sky turns orange and pink.", "The moon comes up.", "Now the stars come out to play."], [
    sc("Draw the moon and the stars in the night sky.", ["The night sky is dark.", "Draw a moon and lots of little stars."], [("moon", "🌙"), ("stars", "⭐")]),
    sc("Draw the sun going to bed.", ["The sun is low in the sky.", "The sky is orange and pink."], [("sun", "☀️"), ("orange sky", "🟠")])]),
  S("cat-box", "Mimi and the Box", ["Mimi the cat finds a box.", "She looks in the box.", "She jumps in the box.", "Mimi takes a nap in her new bed."], [
    sc("Draw Mimi the cat in her box.", ["A box is a square.", "Mimi is inside it."], [("cat", "🐱"), ("box", "📦")])]),
  S("frog-lily", "Hop, Frog, Hop", ["A green frog sits on a lily pad.", "A bug flies by.", "Hop! The frog jumps up high.", "Then he sits on his lily pad again."], [
    sc("Draw the green frog on his lily pad.", ["The frog is green.", "A lily pad is a big round leaf on the water."], [("frog", "🐸"), ("lily pad", "🍃"), ("water", "💧")]),
    sc("Draw the frog jumping up high to see the bug.", ["The frog is up in the air.", "Draw a little bug flying by."], [("frog", "🐸"), ("bug", "🐞")])]),
 ],
 "k": [
  S("tess-garden", "Tess Grows a Sunflower", ["Tess put a seed in the dirt.", "She gave it water every day.", "A little green sprout came up.", "It grew and grew, taller than Tess!", "One morning, a big yellow sunflower opened."], [
    sc("Draw Tess giving water to her seed.", ["What does Tess use to give water?", "Is the seed under the dirt?"], [("Tess", "👧"), ("water", "💧"), ("dirt", "🟫")]),
    sc("Draw the sunflower that is taller than Tess.", ["Make the flower taller than the girl.", "The flower is big and yellow."], [("sunflower", "🌻"), ("Tess", "👧"), ("taller", "📏")])]),
  S("ben-snow", "Ben's Snow Friend", ["It snowed all night.", "Ben put on his hat and his boots.", "He rolled a big snowball, then a small one.", "He gave his snowman two sticks for arms.", "Ben waved, and he wished his snowman could wave back."], [
    sc("Draw Ben and his snowman.", ["A snowman has a big ball and a small ball.", "Do not forget the stick arms!"], [("Ben", "👦"), ("snowman", "⛄"), ("stick arms", "🪵")]),
    sc("Draw Ben getting ready to go out in the snow.", ["What did Ben put on?", "Is it warm or cold outside?"], [("hat", "🧢"), ("boots", "🥾"), ("snow", "❄️")])]),
  S("lost-kite", "The Kite in the Tree", ["Ana and Grandpa flew a kite at the park.", "The wind blew hard.", "Oh no! The kite got stuck in a tall tree.", "Grandpa held Ana up high.", "Ana pulled the string, and the kite came down."], [
    sc("Draw the kite stuck in the tall tree.", ["Where is the kite?", "Make the tree very tall."], [("tree", "🌳"), ("kite", "🪁")]),
    sc("Draw Grandpa holding Ana up high to get the kite.", ["Who is up high?", "Who is helping her?"], [("Ana", "👧"), ("Grandpa", "👴"), ("kite", "🪁")])]),
  S("pet-fish", "Max Gets a Fish", ["Max got a little fish.", "It was orange with a white stripe.", "Max named his fish Bubbles.", "He fed Bubbles every morning.", "Bubbles swam to the top to say hello."], [
    sc("Draw Bubbles in the fish tank.", ["What color is Bubbles?", "Does Bubbles have a stripe?"], [("fish", "🐠"), ("orange", "🟠"), ("stripe", "⚪"), ("tank", "🫙")]),
    sc("Draw Max feeding Bubbles in the morning.", ["How do we know it is morning?", "What does Max give Bubbles?"], [("Max", "👦"), ("fish", "🐠"), ("sun", "☀️")])]),
  S("bus-ride", "The Big Blue Bus", ["Sam rode the bus with Mom.", "The bus was big and blue.", "Sam sat by the window.", "He saw a fire truck, a park, and a dog on a walk.", "Ding! It was time to get off."], [
    sc("Draw what Sam saw from the bus window.", ["Sam saw three things.", "Can you remember them all?"], [("fire truck", "🚒"), ("park", "🌳"), ("dog", "🐕")]),
    sc("Draw the big blue bus with Sam inside.", ["Where did Sam sit?", "What color is the bus?"], [("blue bus", "🚌"), ("window", "🪟"), ("Sam", "👦")])]),
 ],
 "g1": [
  S("lena-lemonade", "Lena's Lemonade Stand", ["Lena wanted to buy a new book.", "She made a lemonade stand with a big sign.", "At first, no one stopped.", "Then Lena had an idea.", "She added cold ice and a smile, and she called out, \"Fresh lemonade!\"", "Soon there was a long line of thirsty neighbors.", "By the end of the day, Lena had enough money for her book."], [
    sc("Draw Lena's stand when there was a long line.", ["What was on her sign?", "Who was waiting in line?", "Is Lena smiling?"], [("stand", "🛖"), ("sign", "🪧"), ("line of people", "👥"), ("lemonade", "🍋")]),
    sc("Draw the part when no one stopped at the stand.", ["How did Lena feel then?", "How can you show that in her face?"], [("Lena", "👧"), ("stand", "🛖"), ("sad face", "😟")]),
    sc("Draw the end of the story.", ["What did Lena buy with her money?", "How does she feel now?"], [("Lena", "👧"), ("book", "📕"), ("happy face", "😊")])]),
  S("owl-noise", "The Noise in the Night", ["Jay heard a noise outside his window.", "Hoo, hoo!", "He was a little scared.", "Dad turned on the flashlight.", "In the tree sat a round, gray owl with big yellow eyes.", "Jay waved. \"Good night, owl!\""], [
    sc("Draw what Jay and Dad saw in the tree.", ["What did the owl look like?", "What color were its eyes?", "Is it day or night?"], [("owl", "🦉"), ("tree", "🌳"), ("yellow eyes", "🟡"), ("night sky", "🌙")]),
    sc("Draw Jay when he first heard the noise.", ["Where was Jay?", "How did he feel?"], [("Jay", "👦"), ("window", "🪟"), ("scared face", "😨")])]),
  S("rain-picnic", "The Picnic Inside", ["Mia and her brother planned a picnic at the park.", "They packed sandwiches, apples, and a blanket.", "Then dark clouds rolled in, and it began to pour.", "Mia frowned, but her brother had a plan.", "They put the blanket on the living room floor.", "They had a picnic inside while the rain tapped on the windows."], [
    sc("Draw the picnic inside the house.", ["Where did they put the blanket?", "What food did they pack?", "What is happening outside the window?"], [("blanket", "🧺"), ("food", "🥪"), ("window with rain", "🌧️"), ("Mia and her brother", "👧")]),
    sc("Draw the moment the rain started.", ["What did the sky look like?", "How did Mia feel?"], [("dark clouds", "☁️"), ("rain", "🌧️"), ("Mia", "👧")])]),
  S("big-race", "Turtle's Plan", ["The animals had a race to the big oak tree.", "Rabbit zoomed ahead.", "Turtle was slow, but he had a plan.", "He walked and walked and never stopped.", "Rabbit took a nap under a bush.", "When Rabbit woke up, Turtle was at the oak tree!"], [
    sc("Draw Rabbit napping while Turtle keeps going.", ["Where did Rabbit nap?", "Where is Turtle going?"], [("Rabbit", "🐇"), ("bush", "🌿"), ("Turtle", "🐢")]),
    sc("Draw the end of the race.", ["Who got to the oak tree first?", "How does Rabbit feel?"], [("Turtle", "🐢"), ("oak tree", "🌳"), ("Rabbit", "🐇")])]),
 ],
 "g2": [
  S("robot-garden", "The Robot Who Loved Flowers", ["In a busy city lived a small robot named Bolt.", "Bolt's job was to sweep the sidewalks every night.", "One night, he found a tiny plant growing in a crack.", "Bolt swept around it very carefully.", "He came back every night to give it a drop of water.", "Weeks later, the plant bloomed into a bright purple flower.", "People stopped to smile at it, and Bolt felt proud."], [
    sc("Draw the moment Bolt felt proud.", ["What made Bolt proud?", "Who is looking at the flower?", "How can a robot show a feeling?"], [("Bolt", "🤖"), ("purple flower", "🌸"), ("people smiling", "😊"), ("city", "🏙️")], "Why do you think Bolt took care of the plant?"),
    sc("Draw the night Bolt found the tiny plant.", ["Where was the plant growing?", "What time of day was it?", "What was Bolt doing when he found it?"], [("Bolt", "🤖"), ("crack in the sidewalk", "〰️"), ("tiny plant", "🌱"), ("night", "🌙")], "What clues tell you it was night?")]),
  S("map-attic", "The Map in the Attic", ["Omar and Grandma were cleaning the dusty attic.", "Inside an old trunk, Omar found a folded map.", "It showed the backyard, a big rock, and a red X.", "They counted ten steps from the rock to the X.", "Omar dug until his shovel hit something hard.", "It was a tin box full of Grandma's old marbles and photos from when she was a girl.", "Grandma laughed. \"I hid that box sixty years ago!\""], [
    sc("Draw what was inside the tin box.", ["What did the story say was inside?", "What might the old photos show?"], [("tin box", "📦"), ("marbles", "🔵"), ("old photos", "🖼️")], "How do you think Grandma felt when she saw the box again?"),
    sc("Draw the map Omar found.", ["What three things were on the map?", "How can you show ten steps?"], [("backyard", "🏡"), ("big rock", "🪨"), ("red X", "❌"), ("steps", "👣")], "Why would someone hide a box and make a map?")]),
  S("lost-mitten", "Whose Mitten?", ["Zoe found one red mitten in the snow by the school gate.", "It had a white star sewn on the thumb.", "She did not know whose it was.", "At recess, she looked at everyone's hands.", "A boy named Leo had one red mitten with a white star, and one cold bare hand.", "Zoe ran over and gave him the mitten."], [
    sc("Draw how Zoe solved the mystery.", ["What clue on the mitten helped her?", "How was Leo's other hand?"], [("Zoe", "👧"), ("Leo", "👦"), ("red mitten", "🧤"), ("white star", "⭐")], "What clues did Zoe use? What would you have done?"),
    sc("Draw what happens the next day.", ["The story does not say. You decide!", "Would Leo and Zoe play together?"], [("Zoe", "👧"), ("Leo", "👦"), ("something new", "✨")], "What makes you think that would happen?")]),
  S("storm-boat", "The Fishing Boat", ["Captain Rosa took her boat out early in the morning.", "The sea was calm and blue.", "By lunch, gray clouds covered the sky, and the waves grew tall.", "Rosa saw the lighthouse blinking on the cliff.", "She steered toward the light and reached the harbor safely.", "That night she thanked the lighthouse keeper with a basket of fish."], [
    sc("Draw the sea after lunch.", ["How did the sky change?", "What happened to the waves?", "What helped Rosa?"], [("tall waves", "🌊"), ("gray clouds", "☁️"), ("boat", "⛵"), ("lighthouse", "🗼")], "How do you think Rosa felt during the storm?"),
    sc("Draw the morning at the start of the story.", ["How was the sea in the morning?", "Compare it with later in the story."], [("calm sea", "🌊"), ("boat", "⛵"), ("sun", "☀️")], "What changed between the morning and lunch?")]),
 ],
 "g3": [
  S("bridge-builders", "The Bridge Builders", ["The creek behind Priya's house was too wide to jump.", "On the other side was the best climbing tree in the neighborhood.", "Priya and her friend Marcus decided to build a bridge.", "Their first bridge was a single plank, and it bent and cracked in the middle.", "Marcus suggested putting a big flat rock in the middle of the creek as a support.", "They laid two planks side by side, resting on the rock.", "This time the bridge held, and they crossed carefully, one at a time.", "That afternoon they sat high in the climbing tree and planned their next project."], [
    sc("Draw the bridge that worked.", ["What did they put in the middle of the creek?", "How many planks did they use?", "Show how the planks rest on the rock."], [("creek", "🏞️"), ("rock support", "🪨"), ("two planks", "🪵"), ("Priya and Marcus", "👫")], "Why did the second bridge work when the first one cracked?"),
    sc("Draw the problem in the story.", ["What went wrong the first time?", "How can you show something bending and cracking?"], [("single plank", "🪵"), ("crack", "⚡"), ("creek", "🏞️")], "What would you have tried next?"),
    sc("Draw their next project.", ["The story does not say what it is. Use your imagination!", "Use what they learned about building."], [("Priya and Marcus", "👫"), ("a new building plan", "📐")], "What did they learn that would help them next time?")]),
  S("night-market", "The Night Market", ["Every summer, the town square turned into a night market.", "Strings of paper lanterns glowed red and gold above the stalls.", "Ravi could smell roasted corn and hear a drummer near the fountain.", "His job was to help his aunt sell handmade kites.", "When a little girl could not afford a kite, Ravi gave her a small one he had made himself.", "Later, the girl came back with her father, who bought three kites.", "Ravi's aunt winked at him. \"Kindness is good business,\" she said."], [
    sc("Draw the night market using the story's details.", ["What lights hung above the stalls?", "What could Ravi smell and hear?", "Where was the drummer?"], [("lanterns", "🏮"), ("stalls", "🛖"), ("roasted corn", "🌽"), ("drummer", "🥁"), ("fountain", "⛲")], "Which details helped you picture the market?"),
    sc("Draw the moment that changed the story.", ["Which choice did Ravi make?", "How did the little girl feel?"], [("Ravi", "👦"), ("little girl", "👧"), ("small kite", "🪁")], "What did the aunt mean by 'Kindness is good business'?")]),
  S("glacier-letter", "A Letter from the Glacier", ["Dear Nora, I am writing from a research camp next to a glacier.", "The ice is so blue it almost glows.", "Every day we measure how far the edge of the glacier has moved.", "This year it moved back much farther than last year.", "At night the sky fills with green ribbons of light called the northern lights.", "I miss you, and I will bring you a smooth gray stone from the glacier's edge.", "Love, Aunt June."], [
    sc("Draw Aunt June's camp next to the glacier.", ["What color is the ice?", "What would a research camp need?", "What does Aunt June measure?"], [("glacier", "🧊"), ("tents", "⛺"), ("blue ice", "🔵"), ("measuring tool", "📏")], "Why would scientists measure the glacier every day?"),
    sc("Draw the night sky at the camp.", ["What did the letter say fills the sky?", "What color are the ribbons of light?"], [("northern lights", "🌌"), ("green ribbons", "🟢"), ("camp", "⛺")], "How is this sky different from the sky where you live?")]),
  S("museum-mystery", "The Missing Dinosaur Tooth", ["On a class trip, Mr. Diaz showed the class a fossil tooth in a glass case.", "After lunch, the case was empty.", "Ella noticed sand on the floor near the case and tiny footprints leading to the sandbox exhibit.", "In the sandbox, a museum worker was showing kids how to dig for fossils.", "She was using the real tooth by mistake instead of the plastic one!", "Ella pointed out the mix-up, and the worker laughed and put the real tooth back."], [
    sc("Draw the clues Ella found.", ["What was on the floor?", "Where did the footprints lead?"], [("empty case", "🫙"), ("sand", "🟨"), ("footprints", "👣"), ("sandbox", "🏖️")], "Which clue was the most important? Why?"),
    sc("Draw how the mystery was solved.", ["Who had the tooth?", "Why did she have it?"], [("museum worker", "🧑"), ("tooth", "🦷"), ("kids digging", "⛏️"), ("Ella", "👧")], "Was anyone really a thief? How do you know?")]),
 ],
}

out = {"schema": 1, "namespace": "draw-stories", "datasets": {"STORIES": STORIES,
  "UI": {"intro": "Listen to the story. Then you will draw a part of it!", "go": "Now draw a part of the story!", "hint": "Here is a hint.",
         "check": "What did you draw? Tap the story details in your picture.", "done": "Wonderful picture!", "talk": "Tell a grown-up about your picture."}}}
p = os.path.join(os.path.dirname(__file__), '..', 'data', 'draw-stories.json')
json.dump(out, open(p, 'w'), indent=2, ensure_ascii=False); open(p, 'a').write('\n')
lines = set()
for g, ss in STORIES.items():
    for s in ss:
        lines.add(s["title"]); lines.update(s["text"])
        for c in s["scenes"]:
            lines.add(c["ask"]); lines.update(c["hints"]); lines.update(x["label"] for x in c["check"])
            if c.get("talk"): lines.add(c["talk"])
lines.update(out["datasets"]["UI"].values())
print(len(lines), 'lines;', sum(len(v) for v in STORIES.values()), 'stories')
EOF_PLACEHOLDER = None
