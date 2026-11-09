#!/usr/bin/env python3
"""Writes the free Grade 1-3 stories and their cartoon pictures:  python3 scripts/library/make-g2-g3-books.py
  library/little-red-hen/ (Grade 2)   library/lion-and-mouse/ (Grade 3)   (Grade 1 stories: make-g1-books.py)
After running this, run: node scripts/library/rasterize-pages.cjs little-red-hen lion-and-mouse max-kite little-seed
(page SVGs become WebP, which the read-aloud pages and the Picture Puzzle both use). The two Grade 2/3 books are original retellings of traditional public-domain tales."""
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from cartoon import *

ROOT = os.path.join(os.path.dirname(__file__), '..', '..', 'library')

def put(folder, name, svg):
    os.makedirs(os.path.join(ROOT, folder), exist_ok=True)
    open(os.path.join(ROOT, folder, name), 'w').write(svg)

FARM = clouds((90, 90, 1), (430, 60, .8)) + sun() + hills()
FARM_FAR = FARM + barn(640, 330, .8)

# ---------- Grade 2: The Little Red Hen ----------
H2 = 'little-red-hen'
pages2 = [
    ('p01.svg', ['A little red hen found some seeds of wheat.', '"Who will help me plant them?" she asked.'], 'sky',
     FARM_FAR + fence(0, 420, 400) + flowers((60, 440), (150, 455), (700, 450)) + wheat(530, 450, 70) + wheat(570, 460, 60) + hen(300, 395, 1.25, False, 'oh'), 'The little red hen holds wheat seeds'),
    ('p02.svg', ['"Not I," said the dog.', '"Not I," said the cat.', 'So the little red hen planted the seeds herself.'], 'sky',
     FARM + flowers((40, 450), (730, 455)) + dog(150, 395, 1, True, 'smile') + cat(330, 410, 1, True, 'smile') + hen(600, 395, 1.15, False, 'smile') + wheat(520, 470, 40) + wheat(720, 470, 40), 'The dog and cat say no while the hen plants the seeds'),
    ('p03.svg', ['The sun shone and the rain fell.', 'Soon the wheat grew tall and golden.'], 'sky',
     clouds((120, 80, 1.1), (470, 100, .9)) + sun(660, 100) + hills() + '<path d="M150 60 l-8 24 M210 70 l-8 24 M280 55 l-8 24" stroke="#4dabf7" stroke-width="6" stroke-linecap="round"/>' + field(115), 'Tall golden wheat in the sun and rain'),
    ('p04.svg', ['"Who will help me cut the wheat?" asked the hen.', '"Not I," said the dog. "Not I," said the cat.', 'So she cut it herself.'], 'sky',
     FARM + field(95, '#f2b632', 440) + dog(120, 360, .75, True) + cat(260, 370, .75, True) + hen(580, 380, 1.2, False, 'smile'), 'The hen cuts the wheat while the dog and cat watch'),
    ('p05.svg', ['The hen took the wheat to the mill to make flour.', 'Then she asked, "Who will help me bake the bread?"', '"Not I," said the dog and the cat.'], 'sky',
     clouds((100, 80, 1)) + sun(180, 90) + hills() + mill(610, 400, 1.15) + wheat(380, 455, 70) + wheat(420, 465, 60) + hen(240, 400, 1.2, False, 'oh'), 'The hen at the windmill'),
    ('p06.svg', ['So the little red hen baked the bread herself.', 'It smelled warm and sweet.'], 'skyE',
     '<rect y="330" width="800" height="170" fill="#c98b52"/><path d="M0 330 H800" stroke="#a96a35" stroke-width="6"/>' + sun(110, 100, 40) + shp('M520 330 V210 a60 60 0 0 1 120 0 V330z', '#7a3b2e') + shp('M540 330 V215 a40 40 0 0 1 80 0 V330z', '#ff9a3c')
     + bread(290, 330, 1.5) + steam(240, 270) + hen(120, 390, 1.1, False, 'smile'), 'Warm bread cooling on a table'),
    ('p07.svg', ['"Who will help me eat it?" asked the hen.', '"I will!" said the dog. "I will!" said the cat.', '"You did not help," said the hen. "My chicks and I will eat it."'], 'sky',
     FARM + bread(250, 430, 1.1) + hen(500, 400, 1.15, False, 'smile') + chick(630, 450, 1.1) + chick(690, 460, 1) + chick(745, 445, .9) + dog(110, 340, .65, True, 'oh') + cat(215, 350, .65, True, 'oh'), 'The hen and her chicks share the bread'),
    ('p08.svg', ['The dog and the cat felt sorry.', 'Next time, they said, they would help right away.'], 'sky',
     FARM + flowers((60, 450), (700, 445), (400, 470)) + dog(200, 395, 1.1, False, 'sad') + cat(420, 410, 1.1, False, 'sad') + wheat(620, 470, 70) + wheat(660, 470, 62), 'The dog and cat feel sorry'),
]
q2 = [
    ('What did the hen find?', 'wheat', [('wheat', wheat(400, 440, 250)), ('apple', apple(400, 270, 2)), ('cake', cake(400, 270, 1.8))]),
    ('What did the hen make?', 'bread', [('bread', bread(400, 290, 2.3)), ('soup', soup(400, 260, 1.9)), ('cake', cake(400, 270, 1.8))]),
    ('Who said "Not I"?', 'dog', [('dog', dog(430, 300, 2, True)), ('hen', hen(400, 300, 2)), ('bird', bird(400, 280, 3))]),
]

# ---------- Grade 3: The Lion and the Mouse ----------
H3 = 'lion-and-mouse'
SAV = clouds((100, 80, 1), (450, 100, .8)) + sun() + hills() + flowers((50, 450), (740, 450))
FOREST = tree(90, 400, .9) + tree(720, 405, 1)
pages3 = [
    ('p01.svg', ['A mighty lion was sleeping under a big tree.', 'A tiny mouse ran across his paw by mistake.'], 'sky',
     SAV + tree(620, 400, 1.35) + lion(310, 400, 1.15, True, 'sleep') + mouse(120, 455, .8, True, 'oh'), 'The mouse runs over the sleeping lion'),
    ('p02.svg', ['The lion woke with a roar and caught the mouse.', '"Please let me go!" squeaked the mouse.', '"Someday I will help you."'], 'sky',
     SAV + tree(640, 400, 1.2) + lion(330, 390, 1.2, True, 'open') + mouse(110, 440, 1, True, 'sad'), 'The lion holds the mouse'),
    ('p03.svg', ['The lion laughed.', '"How could a mouse ever help a lion?" he said.', 'But he lifted his paw and let her go.'], 'sky',
     SAV + tree(650, 400, 1.2) + lion(340, 395, 1.2, True, 'smile') + mouse(120, 455, 1, True, 'smile'), 'The lion lets the mouse go'),
    ('p04.svg', ['A few days later, hunters set a strong rope net in the forest.', 'The lion walked right into it.'], 'skyW',
     hills(True, 340) + FOREST + hunter(690, 330, .9, True) + lion(330, 400, .95, True, 'oh') + net(150, 215, 340, 215), 'The lion is caught in a net'),
    ('p05.svg', ['The lion roared and pulled, but the ropes held tight.', 'All the animals in the forest heard him.'], 'skyW',
     hills(True, 340) + FOREST + lion(330, 400, .95, True, 'open') + net(150, 215, 340, 215) + bird(130, 130, .9, True) + bird(690, 160, .8)
     + '<path d="M560 230 q26 -26 0 -52 M600 240 q36 -36 0 -72" fill="none" stroke="#ff6b6b" stroke-width="8" stroke-linecap="round"/>', 'The lion roars and the forest listens'),
    ('p06.svg', ['The little mouse heard him too.', 'She ran as fast as she could to find the lion.'], 'skyW',
     hills(True, 340) + FOREST + lion(600, 395, .8, True, 'sad') + net(450, 235, 290, 185) + mouse(240, 445, 1.3, False, 'oh')
     + '<path d="M390 450 h50 M410 428 h40 M400 470 h44" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity=".85"/>', 'The mouse runs through the forest'),
    ('p07.svg', ['"Hold still," said the mouse.', 'She chewed the ropes with her sharp little teeth, one by one.'], 'skyW',
     hills(True, 340) + FOREST + lion(430, 400, 1, True, 'smile') + net(200, 215, 380, 220) + mouse(250, 430, 1.35, False, 'smile') + rope(300, 200),
     'The mouse chews through the ropes'),
    ('p08.svg', ['Soon the lion was free.', '"You were kind to me, so I am glad I could help you," said the mouse.', 'From then on, the two were friends.'], 'skyE',
     clouds((110, 80, 1)) + sun(660, 95) + hills() + flowers((60, 450), (720, 455), (400, 475)) + tree(660, 405, 1.2) + lion(320, 400, 1.15, True, 'smile') + mouse(520, 455, 1.2, False, 'smile'), 'The lion and the mouse are friends'),
]
q3 = [
    ('What trapped the lion?', 'net', [('net', net(200, 140, 400, 250)), ('cage', cage(250, 120, 1.5)), ('hole', hole(400, 280, 1.8))]),
    ('What did the mouse chew?', 'rope', [('rope', rope(220, 230) + rope(220, 320)), ('stick', stick(400, 270, 1.6)), ('leaf', leaf(400, 270, 1.6))]),
    ('Who helped the lion?', 'mouse', [('mouse', mouse(480, 370, 2.9, True)), ('bird', bird(400, 270, 3.2)), ('hunter', hunter(400, 270, 2.2))]),
]

# ---------- Grade 1 ----------
G1K = 'max-kite'
YARD = clouds((100, 80, 1), (460, 60, .9)) + sun() + hills()
pages_k = [
    ('p01.svg', ['Max has a red kite.'], 'sky', YARD + flowers((80, 455), (700, 450)) + kid(300, 380, 1.25, True, 'smile', True) + kite(520, 190, 1.2, 15), 'Max has a red kite'),
    ('p02.svg', ['He takes it to the park.'], 'sky', YARD + tree(120, 400, 1) + park_swing(660, 360, 1) + kid(380, 385, 1.2, False, 'smile') + kite(300, 280, .7, -20), 'Max takes the kite to the park'),
    ('p03.svg', ['The kite flies up high.'], 'sky', YARD + kid(220, 390, 1.15, False, 'smile', True) + kite(520, 120, 1.5, 12) + '<path d="M250 300 q150 -60 250 -150" fill="none" stroke="#3b2a3f" stroke-width="3"/>', 'The kite flies up high'),
]
q_k = [('Where does Max take his kite?', 'park', [('park', page(tree(280, 400, 1.2) + park_swing(560, 380, 1.2) + hills(False, 340), 'sky')), ('school', page(hills(False, 360) + school(400, 400, 1.6), 'sky')), ('beach', page(clouds((100, 80, 1)) + sun() + beach(400, 250, 1.5), 'sky'))])]
G1S = 'little-seed'
DIRT = '<path d="M0 360 H800 V500 H0z" fill="#9b6a43"/><path d="M0 360 Q200 320 400 360 T800 360 V380 H0z" fill="#5cbf4a" stroke="#3e9c3a" stroke-width="3"/>'
pages_s = [
    ('p01.svg', ['A little seed was in the dirt.'], 'sky', clouds((100, 80, 1)) + sun() + DIRT + seed(400, 430, 1.5) + ''.join(circ(x, y, 7, '#7a4e26', 2) for x, y in ((150, 440), (620, 460), (250, 470))), 'A little seed in the dirt'),
    ('p02.svg', ['The rain fell and the sun came out.'], 'sky', clouds((100, 70, 1.4), (460, 80, 1.3)) + sun(690, 90, 40) + DIRT + seed(400, 430, 1.3) + ''.join(f'<path d="M{x} {y} l-8 26" stroke="#3ba0ff" stroke-width="7" stroke-linecap="round"/>' for x, y in ((200, 150), (280, 190), (360, 140), (440, 200), (520, 150), (600, 190), (330, 240), (500, 250))), 'Rain falls on the seed'),
    ('p03.svg', ['Soon a flower grew.'], 'sky', clouds((100, 80, 1)) + sun(150, 100, 52) + DIRT + flower_big(500, 260, 1.7), 'A flower grows in the sun'),
]
q_s = [('What grew from the seed?', 'flower', [('flower', card(flower_big(400, 200, 2.4))), ('tree', card(tree(400, 380, 1.5))), ('carrot', card(carrot(400, 260, 2.2)))])]

def build(folder, bid, title, grade, pages, qs):
    book = {'id': bid, 'title': title, 'grades': [grade], 'cover': 'p01.svg', 'pages': [], 'questions': []}
    for name, text, sky, body, alt in pages:
        put(folder, name, page(body, sky)); book['pages'].append({'art': name, 'text': text, 'alt': alt})
    for ask, answer, opts in qs:
        for w, art in opts: put(folder, w + '.svg', art if art.startswith('<svg') else card(art))
        book['questions'].append({'ask': ask, 'answer': answer, 'options': [[w, w + '.svg'] for w, _ in opts]})
    with open(os.path.join(ROOT, folder, 'book.json'), 'w') as f:
        json.dump(book, f, indent=2, ensure_ascii=False); f.write('\n')

if __name__ == '__main__':
    build(H2, H2, 'The Little Red Hen', 'g2', pages2, q2)
    build(H3, H3, 'The Lion and the Mouse', 'g3', pages3, q3)
    print('wrote', H2, H3)
