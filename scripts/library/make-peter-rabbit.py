#!/usr/bin/env python3
"""The Tale of Peter Rabbit (Beatrix Potter, 1902, public domain), retold at two reading levels over one set of pictures.
  python3 scripts/library/make-peter-rabbit.py && node scripts/library/rasterize-pages.cjs peter-rabbit
then the watercolor pass on each page. Grade 2 is the base text (Potter's plot and much of her detail);
Grade 1 is a short, simple retelling stored as versions.g1."""
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from garden import *

ROOT = os.path.join(os.path.dirname(__file__), '..', '..', 'library')
ID = 'peter-rabbit'
BLUE, RED, APRON = '#3d7bd9', '#e8590c', '#ffc9de'


def sisters(x, y, s=0.62):
    return ''.join(rabbit(x + k * 62, y, s, True, 'smile', RED) for k in range(3))


def blackberries(x, y, s=1):
    dots = ''.join(circ(dx, dy, 13, '#4c2a6b', 3) for dx, dy in ((0, 0), (-22, -10), (22, -10), (-12, -32), (12, -32), (0, -54), (-30, 14), (30, 14), (0, 22)))
    return f'<g transform="translate({x} {y}) scale({s})">' + shp('M0 -64 q-6 -30 18 -40', 'none', 5) + ell(30, -100, 26, 12, '#58b947', 3) + dots + '</g>'


GARDEN = garden_ground(330) + clouds((100, 70, .9), (480, 60, .8)) + sun(690, 80, 40)
pages = [
    ('p01.svg', 'sky', clouds((100, 80, 1)) + sun() + hills(True, 360) + fir_tree_home(430, 440, 1.25) + rabbit(200, 450, 1.05, False, 'smile', None, APRON)
     + sisters(520, 470, .55) + rabbit(730, 455, .9, True, 'smile', BLUE),
     'Peter, his mother and his three sisters at their home under the fir tree',
     ['Once upon a time there were four little rabbits: Flopsy, Mopsy, Cotton-tail, and Peter.', 'They lived with their mother in a sandbank, under the root of a very big fir tree.'],
     ['Peter Rabbit lived under a big fir tree.', 'He lived with his mother and his three sisters.']),
    ('p02.svg', 'sky', clouds((120, 80, 1)) + sun(680, 90) + hills(True, 360) + fir_tree_home(120, 440, .9) + rabbit(330, 450, 1.35, True, 'smile', None, APRON)
     + rabbit(560, 450, 1.15, False, 'smile', BLUE),
     'Mrs. Rabbit warns Peter about the garden',
     ['"You may go into the fields or down the lane," said Mrs. Rabbit, "but do not go into Mr. McGregor\'s garden."', '"Now run along, and don\'t get into trouble."'],
     ['"Do not go into Mr. McGregor\'s garden," said Mother.', '"Be good!"']),
    ('p03.svg', 'sky', GARDEN + brick_wall(330) + gate(430, 330, 1.1) + rabbit(450, 380, .9, False, 'smile', BLUE, run=True)
     + sisters(70, 430, .5) + blackberries(250, 420, .7),
     'Peter squeezes under the garden gate while his sisters pick blackberries',
     ['Flopsy, Mopsy, and Cotton-tail, who were good little bunnies, went to gather blackberries.', 'But Peter, who was very naughty, ran straight to the garden and squeezed under the gate.'],
     ['But Peter was naughty.', 'He ran to the garden and squeezed under the gate.']),
    ('p04.svg', 'sky', GARDEN + bean_pole(90, 360, 1.1) + bean_pole(150, 360, 1) + veg_rows(395) + rabbit(420, 360, 1.25, False, 'smile', BLUE) + radish(360, 300, 1.2),
     'Peter eats lettuces, beans and radishes',
     ['First he ate some lettuces and some French beans, and then he ate some radishes.', 'Then, feeling rather sick, he went to look for some parsley.'],
     ['He ate lettuces and beans and radishes.', 'Yum, yum!']),
    ('p05.svg', 'sky', GARDEN + veg_rows(410, ('cabbage', 'lettuce')) + rabbit(230, 380, 1.15, True, 'oh', BLUE) + farmer(570, 320, 1.25, False, 'open'),
     'Mr. McGregor jumps up with a rake',
     ['But round the end of a cucumber frame, whom should he meet but Mr. McGregor!', 'Mr. McGregor jumped up with a rake, calling out, "Stop, thief!"'],
     ['Then he saw Mr. McGregor!', '"Stop, thief!" shouted Mr. McGregor.']),
    ('p06.svg', 'sky', GARDEN + veg_rows(395, ('cabbage', 'cabbage', 'lettuce')) + rabbit(250, 360, 1.15, False, 'oh', BLUE, run=True)
     + shoe(430, 360, 1.3, 20) + shoe(560, 405, 1.3, -30) + farmer(690, 300, .9, False, 'open'),
     'Peter runs and loses his shoes among the cabbages',
     ['Peter was dreadfully frightened. He rushed all over the garden, for he had forgotten the way back to the gate.', 'He lost one of his shoes among the cabbages, and the other shoe amongst the potatoes.'],
     ['Peter ran and ran.', 'He lost his shoes in the cabbages.']),
    ('p07.svg', 'sky', GARDEN + gooseberry_bush(560, 340, 1.4) + rabbit(400, 400, 1.15, False, 'sad', BLUE) + net(300, 250, 230, 160)
     + bird(200, 200, .55, True) + bird(620, 150, .5) + bird(280, 130, .45, True),
     'Peter is caught in the gooseberry net and the sparrows cheer him on',
     ['Then Peter ran into a gooseberry net and got caught by the large buttons on his jacket.', 'Some friendly sparrows flew to him and begged him to try hard. "Don\'t give up, Peter!"'],
     ['His jacket got stuck in a net.', 'Some kind birds called, "Try hard, Peter!"']),
    ('p08.svg', 'sky', GARDEN + veg_rows(430, ('lettuce',)) + watering_can(320, 400, 1.5, True) + jacket(570, 300, 1, -20) + net(500, 250, 150, 110)
     + farmer(730, 340, .8, True, 'oh', False) + '<text x="260" y="230" font-size="44" font-weight="900" font-family="sans-serif" fill="#fff" stroke="#3b2a3f" stroke-width="3">Achoo!</text>',
     'Peter hides in a watering can and sneezes',
     ['Peter wriggled out just in time, leaving his jacket behind.', 'He jumped into a watering can to hide, but it was full of water. Kertyschoo! Mr. McGregor was after him in no time.'],
     ['Peter wriggled out of his jacket.', 'He jumped into a watering can to hide. Achoo!']),
    ('p09.svg', 'sky', GARDEN + brick_wall(330, 480, 800) + gate(650, 330, 1) + pond(220, 440, 1.1) + white_cat(260, 400, .8, True) + wheelbarrow(470, 420, 1.1)
     + rabbit(560, 410, .95, False, 'smile', None, run=True),
     'Peter creeps past the white cat and runs for the gate',
     ['Peter crept past a pond where a white cat sat very still, staring at the goldfish.', 'At last he climbed onto a wheelbarrow, saw the gate, and ran as fast as he could. He slipped underneath and was safe at last!'],
     ['At last Peter saw the gate.', 'He slipped under it and ran all the way home.']),
    ('p10.svg', 'skyE', burrow_inside() + bed_scene(240, 440, 1.2) + rabbit(190, 393, .75, False, 'sleep', None) + rabbit(710, 450, 1.05, True, 'smile', None, APRON)
     + sisters(530, 470, .45) + blackberries(640, 480, .45),
     'Peter in bed with camomile tea while his sisters have blackberries',
     ['Peter was so tired that he flopped down on the soft sand floor of the rabbit hole.', 'His mother put him to bed and gave him a dose of camomile tea. But Flopsy, Mopsy, and Cotton-tail had bread and milk and blackberries for supper. The End.'],
     ['Peter was very tired.', 'Mother put him to bed with a cup of tea. The End.']),
]

CARDS = {
    'garden': garden_ground(300) + veg_rows(340, ('lettuce', 'cabbage'), 220, 600, 70),
    'school': school(400, 360, 1.3), 'beach': beach(400, 250, 1.5),
    'farmer': farmer(400, 330, 1.3), 'lion': lion(420, 360, 1.5, True), 'hen': hen(400, 320, 2),
    'can': watering_can(380, 340, 1.8), 'barn': barn(400, 380, 1.3), 'tree': tree(400, 400, 1.6),
    'jacket': jacket(400, 250, 2.6), 'kite': kite(400, 230, 1.6, 10), 'apple': apple(400, 270, 2),
    'blackberries': blackberries(400, 320, 1.8), 'carrot': carrot(400, 260, 2.2),
}
Q2 = [('What did Peter lose in the garden?', 'jacket', ['jacket', 'kite', 'apple']),
      ('Where did Peter hide from Mr. McGregor?', 'can', ['can', 'barn', 'tree']),
      ('What did Peter\'s sisters pick?', 'blackberries', ['blackberries', 'carrot', 'apple'])]
Q1 = [('Where did Mother say not to go?', 'garden', ['garden', 'school', 'beach']),
      ('Who chased Peter?', 'farmer', ['farmer', 'lion', 'hen']),
      ('Where did Peter hide?', 'can', ['can', 'barn', 'tree'])]


def main():
    d = os.path.join(ROOT, ID); os.makedirs(d, exist_ok=True)
    for f in os.listdir(d):
        if f.endswith(('.svg', '.webp')): os.remove(os.path.join(d, f))
    for name, sky, body, *_ in pages: open(os.path.join(d, name), 'w').write(page(body, sky))
    for k, art in CARDS.items(): open(os.path.join(d, k + '.svg'), 'w').write(card(art))
    q = lambda qs: [{'ask': a, 'answer': ans, 'options': [[o, o + '.svg'] for o in opts]} for a, ans, opts in qs]
    book = {'id': ID, 'title': 'The Tale of Peter Rabbit', 'grades': ['g1', 'g2'], 'cover': 'p05.svg',
            'source': 'Retold from Beatrix Potter, The Tale of Peter Rabbit (1902), public domain. https://www.gutenberg.org/ebooks/14838',
            'pages': [{'art': n, 'text': t2, 'alt': alt} for n, _, _, alt, t2, t1 in pages], 'questions': q(Q2),
            'versions': {'g1': {'title': 'Peter Rabbit', 'pages': [{'art': n, 'text': t1, 'alt': alt} for n, _, _, alt, t2, t1 in pages], 'questions': q(Q1)}}}
    with open(os.path.join(d, 'book.json'), 'w') as f:
        json.dump(book, f, indent=2, ensure_ascii=False); f.write('\n')
    print('wrote', ID, len(pages), 'pages')


if __name__ == '__main__':
    main()
