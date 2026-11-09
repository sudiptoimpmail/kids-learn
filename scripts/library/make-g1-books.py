#!/usr/bin/env python3
"""Writes the two free Grade 1 stories and their cartoon pictures:  python3 scripts/library/make-g1-books.py
  library/max-kite/    "Max and the Red Kite"   (original story)
  library/little-seed/ "Pip the Little Seed"    (original story)
Then: node scripts/library/rasterize-pages.cjs max-kite little-seed
and the watercolor pass on each page WebP. Each book has a beginning, a problem and an ending,
short Grade 1 sentences, and three picture questions."""
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from cartoon import *

ROOT = os.path.join(os.path.dirname(__file__), '..', '..', 'library')


def put(folder, name, svg):
    os.makedirs(os.path.join(ROOT, folder), exist_ok=True)
    open(os.path.join(ROOT, folder, name), 'w').write(svg)


def rain(x0=160, x1=640, y0=140, n=9):
    return ''.join(f'<path d="M{x0 + i * (x1 - x0) // (n - 1)} {y0 + (i % 3) * 40} l-8 26" stroke="#3ba0ff" stroke-width="7" stroke-linecap="round"/>' for i in range(n))


def gust(x, y, c='#fff'):
    return f'<path d="M{x} {y} q60 -24 120 0 t120 0 M{x + 30} {y + 40} q50 -20 100 0" fill="none" stroke="{c}" stroke-width="8" stroke-linecap="round" opacity=".9"/>'


def string(x1, y1, x2, y2):
    return f'<path d="M{x1} {y1} Q{(x1 + x2) / 2} {(y1 + y2) / 2 + 40} {x2} {y2}" fill="none" stroke="#3b2a3f" stroke-width="3"/>'


def jump_lines(x, y):
    return f'<path d="M{x - 24} {y} v24 M{x} {y + 6} v24 M{x + 24} {y} v24" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".85"/>'


# ---------- Max and the Red Kite ----------
MK = 'max-kite'
PARK = clouds((100, 80, 1), (460, 60, .9)) + sun() + hills()
BIG_TREE = tree(600, 410, 1.6)
pages_k = [
    ('p01.svg', ['Max has a red kite.', 'It is his best toy.'], 'sky',
     PARK + flowers((80, 455), (700, 450)) + kid(300, 380, 1.25, True, 'smile', True) + kite(520, 190, 1.2, 15), 'Max holds up his red kite'),
    ('p02.svg', ['"Let\'s go to the park!" said Max.', 'His dog Spot ran with him.'], 'sky',
     PARK + tree(110, 400, 1) + park_swing(660, 360, 1) + kid(360, 385, 1.2, False, 'smile') + kite(270, 280, .7, -20) + dog(520, 420, .9, False, 'smile'), 'Max and Spot run to the park'),
    ('p03.svg', ['The wind blew.', 'Up, up, up went the kite!'], 'sky',
     PARK + gust(380, 250) + kid(200, 390, 1.15, False, 'smile', True) + kite(560, 110, 1.4, 12) + string(225, 300, 560, 180) + dog(360, 430, .8, False, 'open'), 'The kite flies up high'),
    ('p04.svg', ['Then a big gust came.', 'The string slipped out of Max\'s hand!'], 'sky',
     PARK + gust(160, 220) + gust(420, 300) + kid(220, 390, 1.15, False, 'oh', True) + kite(650, 90, 1.1, 40) + '<path d="M650 160 q-60 80 -150 90" fill="none" stroke="#3b2a3f" stroke-width="3"/>', 'The kite blows away'),
    ('p05.svg', ['The kite flew into a tall tree and got stuck.', '"Oh no!" said Max.'], 'sky',
     PARK + BIG_TREE + kite(600, 180, .9, -25) + kid(260, 390, 1.2, False, 'sad') + dog(400, 430, .8, False, 'oh'), 'The kite is stuck in a tall tree'),
    ('p06.svg', ['Max jumped and jumped.', 'Spot jumped too.', 'The kite was too high.'], 'sky',
     PARK + BIG_TREE + kite(600, 180, .9, -25) + kid(430, 350, 1.15, True, 'oh', True) + jump_lines(430, 395) + dog(270, 400, .85, False, 'open') + jump_lines(270, 410), 'Max and Spot jump but cannot reach the kite'),
    ('p07.svg', ['A little bird flew to the kite.', 'She tugged the string with her beak.', 'Tug, tug, tug!'], 'sky',
     PARK + BIG_TREE + kite(600, 200, .9, -10) + bird(660, 150, .8, True) + kid(300, 390, 1.15, False, 'oh') + dog(160, 430, .8, False, 'smile'), 'A bird tugs the kite loose'),
    ('p08.svg', ['Down came the kite, right into Max\'s arms.', '"Thank you, bird!" said Max.', 'Now he holds the string tight. The End.'], 'skyE',
     PARK + tree(680, 410, 1.2) + flowers((60, 455), (420, 470)) + kid(300, 380, 1.25, False, 'smile', True) + kite(470, 150, 1.2, 10) + string(325, 300, 470, 220) + bird(560, 120, .6) + dog(150, 430, .85, True, 'smile'), 'Max flies his kite again with Spot and the bird'),
]
q_k = [
    ('Who went to the park with Max?', 'dog', [('dog', dog(420, 320, 2.1, True)), ('cat', cat(420, 320, 2, True)), ('hen', hen(400, 320, 2))]),
    ('Where did the kite get stuck?', 'tree', [('tree', tree(400, 400, 1.6)), ('barn', barn(400, 380, 1.3)), ('school', school(400, 380, 1.3))]),
    ('Who helped Max get his kite?', 'bird', [('bird', bird(400, 280, 3)), ('mouse', mouse(460, 360, 2.6, True)), ('lion', lion(420, 360, 1.5, True))]),
]

# ---------- Pip the Little Seed ----------
PS = 'little-seed'
DIRT = '<path d="M0 360 H800 V500 H0z" fill="#9b6a43"/><path d="M0 360 Q200 320 400 360 T800 360 V380 H0z" fill="#5cbf4a" stroke="#3e9c3a" stroke-width="3"/>'
PEBBLES = ''.join(circ(x, y, 7, '#7a4e26', 2) for x, y in ((150, 440), (620, 460), (250, 470)))
pages_s = [
    ('p01.svg', ['A little seed named Pip lay in the dirt.', 'It was dark and still.'], 'skyW',
     DIRT + seed(400, 430, 1.6) + PEBBLES, 'Pip the seed lies in the dark dirt'),
    ('p02.svg', ['"I am so small," said Pip.', '"Will I ever grow?"'], 'skyW',
     clouds((140, 90, 1)) + DIRT + seed(400, 430, 1.6) + PEBBLES + '<text x="455" y="400" font-size="90" font-weight="900" font-family="sans-serif" fill="#fff" stroke="#3b2a3f" stroke-width="4">?</text>', 'Pip wonders if it will grow'),
    ('p03.svg', ['Then the rain came.', 'Drip, drop, drip!', 'Pip got a big drink.'], 'sky',
     clouds((120, 80, 1.4), (460, 90, 1.3)) + rain() + DIRT + seed(400, 430, 1.5) + PEBBLES, 'Rain falls on the dirt'),
    ('p04.svg', ['Then the sun came out.', 'The dirt felt warm.'], 'sky',
     clouds((120, 80, 1)) + sun(560, 110, 56) + DIRT + seed(400, 430, 1.5) + PEBBLES, 'The sun warms the dirt'),
    ('p05.svg', ['Pip pushed roots down.', 'Pip pushed up, up, up!'], 'sky',
     clouds((120, 80, 1)) + sun(660, 95) + DIRT + seed(400, 440, 1.4) + '<path d="M400 460 q-20 20 -10 40 M400 460 q24 18 18 40" fill="none" stroke="#f5e6c8" stroke-width="5" stroke-linecap="round"/>' + sprout(400, 425, 1.5, .7), 'Pip grows roots and starts to sprout'),
    ('p06.svg', ['A green sprout popped out of the dirt.', 'Pip could see the sky!'], 'sky',
     clouds((110, 80, 1), (480, 70, .8)) + sun(660, 95) + DIRT + sprout(400, 365, 1.4, 1) + flowers((90, 460), (720, 460)), 'A green sprout pops out'),
    ('p07.svg', ['A little bird sat next to Pip.', '"You are growing!" she sang.', '"Keep going!"'], 'sky',
     clouds((110, 80, 1)) + sun(660, 95) + DIRT + sprout(400, 365, 1.7, 1.3) + bird(560, 330, .9), 'A bird cheers Pip on'),
    ('p08.svg', ['Day by day, Pip grew tall.', 'One morning, a big pink flower opened.', '"I did it!" said Pip. The End.'], 'skyE',
     clouds((110, 80, 1)) + sun(150, 100, 52) + DIRT + flower_big(420, 220, 1.7) + bird(640, 300, .8) + flowers((80, 460), (720, 460)), 'Pip is now a big pink flower'),
]
q_s = [
    ('What was Pip?', 'seed', [('seed', seed(400, 250, 5)), ('apple', apple(400, 270, 2)), ('carrot', carrot(400, 260, 2.2))]),
    ('What gave Pip a drink?', 'rain', [('rain', circ(400, 250, 168, '#d6ecff', 0) + cloud(320, 150, 1.7) + rain(300, 500, 290, 5)), ('sun', sun(400, 250, 90)), ('wind', gust(260, 210, '#4dabf7') + gust(280, 290, '#4dabf7'))]),
    ('What did Pip grow into?', 'flower', [('flower', flower_big(400, 200, 2.4)), ('tree', tree(400, 380, 1.5)), ('carrot', carrot(400, 260, 2.2))]),
]


def build(folder, title, grade, pages, qs, cover='p01.svg'):
    d = os.path.join(ROOT, folder)
    for f in os.listdir(d):                      # old pictures and answer cards go; the new set replaces them
        if f.endswith(('.svg', '.webp')): os.remove(os.path.join(d, f))
    book = {'id': folder, 'title': title, 'grades': [grade], 'cover': cover, 'pages': [], 'questions': []}
    for name, text, sky, body, alt in pages:
        put(folder, name, page(body, sky)); book['pages'].append({'art': name, 'text': text, 'alt': alt})
    for ask, answer, opts in qs:
        for w, art in opts: put(folder, w + '.svg', art if art.startswith('<svg') else card(art))
        book['questions'].append({'ask': ask, 'answer': answer, 'options': [[w, w + '.svg'] for w, _ in opts]})
    with open(os.path.join(d, 'book.json'), 'w') as f:
        json.dump(book, f, indent=2, ensure_ascii=False); f.write('\n')


if __name__ == '__main__':
    build(MK, 'Max and the Red Kite', 'g1', pages_k, q_k)
    build(PS, 'Pip the Little Seed', 'g1', pages_s, q_s, 'p06.svg')
    print('wrote', MK, PS)
