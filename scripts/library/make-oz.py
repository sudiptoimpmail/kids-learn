#!/usr/bin/env python3
"""The Wonderful Wizard of Oz (L. Frank Baum, 1900, public domain), retold for Grade 3 as four short chapter books:
  library/oz-1 The Cyclone · oz-2 The Scarecrow · oz-3 The Tin Woodman and the Lion · oz-4 The Emerald City
  python3 scripts/library/make-oz.py && node scripts/library/rasterize-pages.cjs oz-1 oz-2 oz-3 oz-4  (then the watercolor pass)"""
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from ozfigs import *
from garden import pond

ROOT = os.path.join(os.path.dirname(__file__), '..', '..', 'library')
SRC = 'Retold from L. Frank Baum, The Wonderful Wizard of Oz (1900), public domain. https://www.gutenberg.org/ebooks/55'
OZ_LAND = clouds((110, 80, 1), (470, 70, .8)) + sun(690, 85) + hills(True, 330) + flowers((60, 450), (740, 455), (300, 470))
ROAD = OZ_LAND + brick_road(330)


def bucket(x, y, s=1):
    return f'<g transform="translate({x} {y}) scale({s})">' + shp('M-40 -60 h80 l-10 70 h-60z', '#adb5bd') + shp('M-40 -60 q40 -60 80 0', 'none', 5) + ell(0, -60, 40, 10, '#74c0fc', 3) + '</g>'


def heart(x, y, s=1):
    return f'<g transform="translate({x} {y}) scale({s})">' + shp('M0 40 C-90 -20 -50 -90 0 -50 C50 -90 90 -20 0 40z', '#ff6b6b') + shine(-24, -40, 20, 14) + '</g>'


def straw(x, y, s=1):
    return f'<g transform="translate({x} {y}) scale({s})">' + ''.join(f'<path d="M{-50 + k * 8} 60 L{-30 + k * 5} -60" stroke="#f2c94c" stroke-width="7" stroke-linecap="round"/>' for k in range(13)) + shp('M-44 0 h88', 'none', 8) + '</g>'


def silver_shoes(x, y, s=1):
    return f'<g transform="translate({x} {y}) scale({s})">' + shoe(-40, 0, 2.6).replace('#5c3b1e', SILVER) + shoe(40, 20, 2.6).replace('#5c3b1e', SILVER) + ''.join(circ(dx, dy, 4, '#fff', 0) for dx, dy in ((-50, -24), (36, -6))) + '</g>'


def chapter(n, title, pages, qs, cards, cover='p01.svg'):
    bid = f'oz-{n}'; d = os.path.join(ROOT, bid); os.makedirs(d, exist_ok=True)
    for f in os.listdir(d):
        if f.endswith(('.svg', '.webp')): os.remove(os.path.join(d, f))
    book = {'id': bid, 'title': f'The Wizard of Oz · {n}. {title}', 'grades': ['g3'], 'cover': cover, 'source': SRC, 'series': 'oz', 'chapter': n, 'pages': [], 'questions': []}
    for i, (sky, body, alt, text) in enumerate(pages):
        name = f'p{i + 1:02d}.svg'; open(os.path.join(d, name), 'w').write(page(body, sky))
        book['pages'].append({'art': name, 'text': text, 'alt': alt})
    for ask, ans, opts in qs:
        for o in opts: open(os.path.join(d, o + '.svg'), 'w').write(card(cards[o]))
        book['questions'].append({'ask': ask, 'answer': ans, 'options': [[o, o + '.svg'] for o in opts]})
    with open(os.path.join(d, 'book.json'), 'w') as f:
        json.dump(book, f, indent=2, ensure_ascii=False); f.write('\n')
    return bid


CARDS = {
    'cyclone': cyclone(400, 420, .9), 'balloon': balloon(400, 380, 1.5), 'kite': kite(400, 230, 1.6, 10),
    'shoes': silver_shoes(400, 280, 1.3), 'apple': apple(400, 270, 2), 'road': brick_road(250, 400, 60).replace('M170 500', 'M240 440').replace('L630 500', 'L560 440'),
    'forest': forest(380), 'scarecrow': scarecrow(400, 340, 1.4), 'tinman': tinman(400, 330, 1.3), 'lion': lion(430, 360, 1.5, True),
    'straw': straw(400, 260, 1.6), 'bread': bread(400, 290, 2.3), 'leaf': leaf(400, 270, 1.6), 'crow': crow(400, 280, 3), 'chick': chick(400, 260, 3), 'hen': hen(400, 320, 2),
    'oil': oil_can(380, 330, 3), 'heart': heart(400, 260, 2), 'house': farmhouse(400, 360, 1.5),
    'water': bucket(400, 320, 2.2), 'stick': stick(400, 270, 1.6), 'wizard': wizard(400, 330, 1.4), 'goodwitch': witch_good(400, 330, 1.2), 'munchkin': munchkin(400, 360, 1.8),
}

CH1 = [
    ('sky', kansas() + clouds((130, 90, .8)) + farmhouse(520, 345, 1.2) + dorothy(250, 400, 1.15, False, 'smile') + toto(360, 440, 1, True),
     'Dorothy and Toto on the gray Kansas prairie',
     ['Dorothy lived in the middle of the great Kansas prairies with Uncle Henry, Aunt Em, and her little black dog, Toto.', 'Everything around the small farmhouse was gray, but Toto made Dorothy laugh every day.']),
    ('skyW', kansas() + cyclone(640, 340, .8) + farmhouse(330, 345, 1.2) + dorothy(160, 400, 1.1, True, 'oh'),
     'A cyclone comes across the prairie',
     ['One day the sky grew dark, and a low wail came from the north.', '"A cyclone is coming!" cried Uncle Henry. "Run for the cellar!"']),
    ('skyW', kansas() + cyclone(700, 340, .7) + farmhouse(400, 345, 1.6) + toto(250, 440, 1.1, False, 'oh') + dorothy(560, 400, 1.1, False, 'oh', True),
     'Dorothy chases Toto as the house begins to shake',
     ['Toto was frightened and hid under the bed.', 'By the time Dorothy caught him, the house was shaking, and it was too late to reach the cellar.']),
    ('skyW', cyclone(400, 520, 1.3) + farmhouse(420, 220, 1.1, 18) + dorothy(410, 230, .45, False, 'oh') + clouds((80, 80, 1), (600, 420, 1.2)),
     'The cyclone carries the house through the sky',
     ['The cyclone lifted the whole house high into the air and carried it far away.', 'Dorothy hugged Toto, and after many hours she fell fast asleep.']),
    ('sky', OZ_LAND + tree(90, 400, .9, True) + farmhouse(560, 360, 1.1, -6) + munchkin(240, 440, 1) + munchkin(330, 450, .9, True, '#3bc9db') + dorothy(430, 410, 1, True, 'oh'),
     'The Munchkins in blue hats greet Dorothy',
     ['Dorothy woke with a bump. The house had landed in a beautiful country full of flowers and fruit trees.', 'Little people in blue hats came to meet her. They were the Munchkins.']),
    ('sky', OZ_LAND + farmhouse(650, 360, 1, -6) + witch_good(260, 420, 1.1) + dorothy(450, 410, 1.05, False, 'smile') + toto(540, 450, .9),
     'The Good Witch of the North talks to Dorothy',
     ['A kind old woman stepped forward. "I am the Good Witch of the North," she said.', '"Your house landed on the Wicked Witch of the East. She is gone, and the Munchkins are free!"']),
    ('sky', OZ_LAND + witch_good(250, 420, 1.05) + dorothy(470, 410, 1.1, False, 'smile', True) + silver_shoes(400, 300, .55),
     'The Good Witch gives Dorothy the silver shoes',
     ['The witch gave Dorothy a pair of silver shoes.', '"They have a magic power," she said, "but no one knows what it is."']),
    ('sky', ROAD + witch_good(130, 420, .9) + dorothy(560, 410, 1.05, True, 'smile') + toto(660, 450, .9, True) + emerald_city(430, 330, .25),
     'The yellow brick road leads toward the Emerald City',
     ['"How can I get back to Kansas?" asked Dorothy.', '"Go to the Emerald City and ask the great Wizard of Oz," said the witch. "Follow the road of yellow brick."']),
]
Q1 = [('What carried the house away?', 'cyclone', ['cyclone', 'balloon', 'kite']),
      ('What did the Good Witch give Dorothy?', 'shoes', ['shoes', 'apple', 'kite']),
      ('What should Dorothy follow to the Emerald City?', 'road', ['road', 'forest', 'balloon'])]

CH2 = [
    ('sky', ROAD + dorothy(330, 430, 1.1, False, 'smile', False, SILVER, True) + toto(450, 460, .9),
     'Dorothy sets off on the yellow brick road with a basket',
     ['Dorothy put on the silver shoes, packed a basket of bread, and set off with Toto along the yellow brick road.', 'The shoes twinkled in the sun with every step.']),
    ('sky', clouds((110, 80, 1)) + sun(690, 85) + hills(True, 300) + cornfield(360) + scarecrow(560, 290, 1.1, False, 'smile', True) + dorothy(250, 430, 1.05, True, 'oh'),
     'A scarecrow on a pole in the cornfield winks at Dorothy',
     ['Beside a cornfield she saw a Scarecrow up on a pole.', 'To her surprise, one of its painted eyes slowly winked at her!']),
    ('sky', clouds((110, 80, 1)) + sun(690, 85) + hills(True, 300) + cornfield(360) + scarecrow(500, 290, 1.1, False, 'open', True) + dorothy(250, 430, 1.05, True, 'smile') + toto(140, 460, .8, True),
     'The Scarecrow asks Dorothy for help',
     ['"Good day," said the Scarecrow in a husky voice.', '"Can you help me down? This pole is very uncomfortable."']),
    ('sky', clouds((110, 80, 1)) + sun(690, 85) + hills(True, 300) + cornfield(360) + dorothy(330, 430, 1.1, False, 'smile', True) + scarecrow(470, 400, .9, True, 'smile'),
     'Dorothy lifts the Scarecrow down',
     ['Dorothy lifted him off the pole. He was very light, because he was stuffed with straw.', '"Thank you," he said. "I feel like a new man."']),
    ('sky', ROAD + scarecrow(300, 420, 1.1, False, 'sad') + dorothy(520, 420, 1.05, True, 'smile') + '<text x="210" y="150" font-size="60" font-weight="900" font-family="sans-serif" fill="#fff" stroke="#3b2a3f" stroke-width="3">?</text>',
     'The Scarecrow wishes he had brains',
     ['"I have no brains in my head, only straw," he sighed.', '"Do you think the Wizard of Oz would give me some brains?"']),
    ('sky', clouds((110, 80, 1)) + sun(690, 85) + hills(True, 300) + cornfield(360) + scarecrow(330, 420, 1.05, False, 'smile') + crow(250, 160, .7, True) + crow(420, 120, .6) + crow(560, 200, .7) + dorothy(560, 430, 1, True, 'smile'),
     'Crows circle the Scarecrow',
     ['The crows had never been afraid of him, because they knew he was only straw.', '"Come with me," said Dorothy. "We will ask the Wizard together."']),
    ('sky', ROAD + emerald_city(430, 330, .25) + scarecrow(300, 440, 1, True, 'open') + dorothy(480, 430, 1.05, True, 'smile') + toto(580, 460, .85, True),
     'Dorothy, Toto and the Scarecrow walk on together',
     ['So the Scarecrow and Dorothy and Toto walked on together.', 'The Scarecrow stumbled over the bricks and laughed, and Dorothy laughed with him.']),
]
Q2 = [('Who did Dorothy find in the cornfield?', 'scarecrow', ['scarecrow', 'tinman', 'lion']),
      ('What was the Scarecrow stuffed with?', 'straw', ['straw', 'bread', 'leaf']),
      ('Which birds were not afraid of the Scarecrow?', 'crow', ['crow', 'chick', 'hen'])]

WOODS = forest(340) + '<path d="M0 340 H800 V500 H0z" fill="#5c9e4a"/>' + brick_road(340)
CH3 = [
    ('skyW', WOODS + dorothy(280, 440, 1, False, 'oh') + scarecrow(470, 440, .95, True, 'oh') + toto(380, 470, .8),
     'The road leads into a dark forest',
     ['The road led into a deep, dark forest.', 'Suddenly they heard a groan from among the trees.']),
    ('skyW', WOODS + tinman(560, 420, 1.2, True, 'sad', True, True) + dorothy(260, 440, 1, True, 'oh'),
     'A rusted Tin Woodman stands frozen with his axe raised',
     ['A man made entirely of tin stood very still with his axe raised high.', '"Please oil my joints," he groaned. "I have rusted, and I cannot move."']),
    ('skyW', WOODS + tinman(520, 420, 1.2, True, 'smile') + dorothy(330, 440, 1, True, 'smile', True) + oil_can(410, 310, 1.1),
     'Dorothy oils the Tin Woodman',
     ['Dorothy found an oil can in his cottage. She oiled his neck, his arms, and his legs.', 'Slowly the Tin Woodman lowered his axe and smiled.']),
    ('skyW', WOODS + tinman(420, 430, 1.1, False, 'sad', False) + heart(420, 140, .8) + dorothy(620, 440, 1, True, 'smile') + scarecrow(220, 440, .95, False, 'smile'),
     'The Tin Woodman wishes for a heart',
     ['"I have no heart," said the Tin Woodman sadly. "May I come and ask the Wizard for one?"', '"Of course!" said Dorothy.']),
    ('skyW', WOODS + lion(540, 420, 1.15, False, 'open') + toto(320, 460, .9, True, 'oh') + scarecrow(200, 470, .8, False, 'oh') + tinman(110, 440, .8, True, 'oh'),
     'The Lion springs out roaring',
     ['Just then a terrible roar rang through the forest, and a great Lion sprang onto the road.', 'He knocked the Scarecrow over and opened his mouth wide at Toto.']),
    ('skyW', WOODS + lion(560, 420, 1.15, False, 'oh') + dorothy(340, 430, 1.1, True, 'open', True) + toto(220, 460, .85, True),
     'Dorothy slaps the Lion on the nose',
     ['Dorothy rushed forward and slapped the Lion on the nose.', '"Don\'t you dare bite Toto! You should be ashamed of yourself, a big beast like you!"']),
    ('skyW', WOODS + lion(500, 420, 1.15, False, 'sad') + dorothy(260, 430, 1.05, True, 'smile') + ''.join(circ(430 + k * 6, 300 + k * 18, 6, '#a5d8ff', 2) for k in range(3)),
     'The Lion admits he is a coward',
     ['"I know," said the Lion, wiping a tear with his paw. "I am a coward."', '"I roar so others will be afraid of me, but inside I am scared of everything."']),
    ('sky', ROAD + emerald_city(430, 330, .3) + lion(640, 450, .8, False, 'smile') + tinman(510, 450, .8, True, 'smile', False) + dorothy(380, 450, .9, True, 'smile') + scarecrow(250, 450, .85, True, 'smile') + toto(150, 470, .7, True),
     'Four friends walk toward the Emerald City',
     ['"Perhaps the Wizard will give me courage," said the Lion.', 'So the four friends and Toto walked on together toward the Emerald City.']),
]
Q3 = [('What did the Tin Woodman need so he could move?', 'oil', ['oil', 'apple', 'bread']),
      ('What did the Tin Woodman wish for?', 'heart', ['heart', 'house', 'kite']),
      ('Who said he was a coward?', 'lion', ['lion', 'scarecrow', 'tinman'])]

CH4 = [
    ('sky', clouds((110, 80, 1)) + hills(True, 360) + brick_road(380, 430, 30) + emerald_city(430, 390, .9),
     'The Emerald City sparkles green',
     ['At last they saw a green glow in the sky. It was the Emerald City, sparkling with jewels.', 'Everyone who went inside had to wear green spectacles.']),
    ('sky', throne_room() + wizard_head(400, 210, .95) + dorothy(150, 470, .8, True, 'oh') + toto(240, 480, .6, True),
     'A huge floating head speaks in the throne room',
     ['In the throne room floated a huge head with no body.', '"I am Oz, the Great and Terrible," it boomed. "Why do you come to me?"']),
    ('sky', throne_room() + wizard_head(560, 190, .7) + scarecrow(120, 470, .75, True) + tinman(230, 470, .75, True, 'smile', False) + lion(370, 470, .65, True, 'oh') + dorothy(470, 470, .75, True, 'smile'),
     'Each friend asks the Wizard for a wish',
     ['Each friend asked for a wish.', '"First you must stop the Wicked Witch of the West," said Oz. "Then I will help you."']),
    ('skyW', '<rect y="360" width="800" height="140" fill="#868e96"/>' + witch_bad(520, 420, 1.1, .45) + dorothy(260, 430, 1.1, True, 'open', True) + bucket(330, 300, .6)
     + ''.join(circ(380 + k * 22, 300 + k * 12, 7, '#74c0fc', 2) for k in range(5)),
     'Dorothy throws water and the Wicked Witch melts away',
     ['The Wicked Witch captured them, but brave Dorothy never gave up.', 'When the angry witch grabbed one silver shoe, Dorothy threw a bucket of water at her, and the witch melted away!']),
    ('sky', throne_room() + shp('M560 420 V200 H700 V420z', '#5c940d') + shp('M560 420 L520 240', 'none', 6) + wizard(620, 400, 1.05, True) + toto(470, 450, .8, True, 'open') + dorothy(230, 430, 1, True, 'oh'),
     'Toto knocks over the screen and finds a little old man',
     ['Back in the throne room, Toto knocked over a screen in the corner.', 'Behind it stood a little old man. The great Wizard was just a man from Omaha!']),
    ('sky', throne_room() + wizard(400, 430, 1, False) + scarecrow(180, 450, .85, True, 'smile') + tinman(600, 450, .85, False, 'smile', False) + heart(600, 300, .35) + lion(720, 470, .6, False, 'smile'),
     'The Wizard gives each friend a gift',
     ['"I am not a real wizard," he said, "but I can still help."', 'He gave the Scarecrow brains made of bran, the Tin Woodman a silk heart, and the Lion a drink of courage.']),
    ('sky', clouds((110, 80, 1), (520, 120, .8)) + hills(True, 360) + emerald_city(150, 380, .5) + balloon(560, 230, .9) + wizard(560, 230, .25) + dorothy(380, 440, 1, False, 'oh', True) + toto(250, 460, .8, False, 'smile'),
     'The balloon floats away without Dorothy',
     ['The Wizard made a big balloon to fly Dorothy home.', 'But Toto ran after a kitten, and the balloon floated away without them!']),
    ('sky', OZ_LAND + witch_good(260, 420, 1.1).replace('#ffffff', '#ffd8e8') + dorothy(480, 410, 1.1, False, 'smile') + silver_shoes(490, 470, .25),
     'Glinda tells Dorothy the secret of the silver shoes',
     ['Then the good witch Glinda told Dorothy a secret.', '"Your silver shoes can take you anywhere. Just click your heels three times and say where you want to go."']),
    ('skyE', kansas() + farmhouse(600, 345, 1.1) + dorothy(330, 410, 1.1, False, 'smile', True) + toto(450, 450, .9, True, 'open') + dorothy(150, 400, 1.2, True, 'smile').replace('#74b9ff', '#e599f7').replace('#8d5428', '#adb5bd'),
     'Dorothy is home in Kansas and Aunt Em runs to hug her',
     ['Dorothy hugged her friends goodbye, clicked her heels, and said, "Take me home to Aunt Em!"', 'In a moment she was rolling on the Kansas grass, and Aunt Em came running. "I\'m so glad to be home again!" said Dorothy. The End.']),
]
Q4 = [('What melted the Wicked Witch?', 'water', ['water', 'stick', 'leaf']),
      ('Who was hiding behind the screen?', 'wizard', ['wizard', 'goodwitch', 'munchkin']),
      ('What took Dorothy home?', 'shoes', ['shoes', 'balloon', 'house'])]

if __name__ == '__main__':
    out = [chapter(1, 'The Cyclone', CH1, Q1, CARDS, 'p04.svg'), chapter(2, 'The Scarecrow', CH2, Q2, CARDS, 'p02.svg'),
           chapter(3, 'The Tin Woodman and the Lion', CH3, Q3, CARDS, 'p08.svg'), chapter(4, 'The Emerald City', CH4, Q4, CARDS, 'p01.svg')]
    print('wrote', *out)
