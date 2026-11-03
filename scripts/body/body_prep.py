"""Prepare the kid-friendly body: clothe the skin, label parts, make lung surfaces.
Input: dumpf.json (world-space meshes from the open-anatomy-3d female model). Output: prep.json"""
import json, sys
import numpy as np
from scipy.spatial import cKDTree
from scipy import ndimage, sparse
from skimage import measure

d = json.load(open(sys.argv[1]))
A = lambda k: np.array(d[k]['P'], float).reshape(-1, 3)
F_ = lambda k: np.array(d[k]['I'], int).reshape(-1, 3)

PARTS = ['body', 'head', 'hair', 'eyes', 'ears', 'nose', 'mouth', 'chin', 'cheeks', 'eyebrows', 'neck', 'shoulders',
         'chest', 'tummy', 'arms', 'elbows', 'wrists', 'hands', 'fingers', 'legs', 'knees', 'ankles', 'feet', 'hips', 'back']
PI = {n: i for i, n in enumerate(PARTS)}

V = A('skin'); F = F_('skin')

def weld(V, F, eps=1e-6):
    key = np.round(V / eps).astype(np.int64)
    _, first, inv = np.unique(key, axis=0, return_index=True, return_inverse=True)
    return first, inv.ravel()

# --- adjacency (welded, since meshes may have split vertices) ---
first, inv = weld(V, F, 1e-5)
FW = inv[F]
nW = len(first)
def adjacency(FW, n):
    e = np.concatenate([FW[:, [0, 1]], FW[:, [1, 2]], FW[:, [2, 0]]])
    e = np.concatenate([e, e[:, ::-1]])
    M = sparse.coo_matrix((np.ones(len(e)), (e[:, 0], e[:, 1])), shape=(n, n)).tocsr()
    M.data[:] = 1
    return M
ADJ = adjacency(FW, nW)

def vnormals(V, F):
    n = np.zeros_like(V)
    fn = np.cross(V[F[:, 1]] - V[F[:, 0]], V[F[:, 2]] - V[F[:, 0]])
    for k in range(3): np.add.at(n, F[:, k], fn)
    return n / (np.linalg.norm(n, axis=1, keepdims=True) + 1e-12)

def taubin(P, adj, it=10, lam=0.5, mu=-0.53, fixed=None):
    deg = np.asarray(adj.sum(1)).ravel(); deg[deg == 0] = 1
    for _ in range(it):
        for f in (lam, mu):
            L = adj @ P / deg[:, None] - P
            if fixed is not None: L[fixed] = 0
            P = P + f * L
    return P

# ---------------- 1. make the body child-friendly: flatten the chest and the crotch ----------------
W = V[first].copy()
x, y, z = W[:, 0], W[:, 1], W[:, 2]
# chest: smooth front plane under a t-shirt
base = np.interp(y, [1.02, 1.10, 1.20, 1.30, 1.36], [0.088, 0.084, 0.072, 0.052, 0.035])
cap = base - 1.6 * x ** 2
m = (y > 1.02) & (y < 1.36) & (np.abs(x) < 0.165) & (z > cap)
z[m] = cap[m] + (z[m] - cap[m]) * 0.02
# crotch: soft rounded front
cap2 = np.interp(y, [0.70, 0.76, 0.82, 0.90], [0.0, 0.035, 0.062, 0.085]) - 1.2 * x ** 2
m2 = (y > 0.70) & (y < 0.90) & (np.abs(x) < 0.09) & (z > cap2)
z[m2] = cap2[m2] + (z[m2] - cap2[m2]) * 0.1
# smooth only the edited areas so there are no creases
edited = np.zeros(nW, bool); edited[m | m2] = True
grow = edited.copy()
for _ in range(3): grow = grow | (ADJ @ grow.astype(float) > 0)
Ws = taubin(W, ADJ, 8, fixed=~grow)
W[grow] = Ws[grow]

# ---------------- 2. label every skin vertex with a body part ----------------
bones = {k: A(k) for k in ['skull', 'mandible', 'spine_cervical', 'spine_thoracic', 'spine_lumbar', 'sternum', 'pelvis', 'ribs_l', 'ribs_r',
                           'clavicle_l', 'clavicle_r', 'scapula_l', 'scapula_r', 'humerus_l', 'humerus_r', 'forearm_l', 'forearm_r', 'hand_l', 'hand_r',
                           'femur_l', 'femur_r', 'lower_leg_l', 'lower_leg_r', 'foot_l', 'foot_r', 'patella_l', 'patella_r']}
group = {'skull': 'head', 'mandible': 'head', 'spine_cervical': 'neck', 'spine_thoracic': 'torso', 'spine_lumbar': 'torso', 'sternum': 'torso',
         'pelvis': 'pelvis', 'ribs_l': 'torso', 'ribs_r': 'torso', 'clavicle_l': 'torso', 'clavicle_r': 'torso', 'scapula_l': 'torso', 'scapula_r': 'torso',
         'humerus_l': 'upper', 'humerus_r': 'upper', 'forearm_l': 'fore', 'forearm_r': 'fore', 'hand_l': 'hand', 'hand_r': 'hand',
         'femur_l': 'thigh', 'femur_r': 'thigh', 'lower_leg_l': 'shin', 'lower_leg_r': 'shin', 'foot_l': 'foot', 'foot_r': 'foot',
         'patella_l': 'shin', 'patella_r': 'shin'}
pts = np.concatenate(list(bones.values())); lab = np.concatenate([[group[k]] * len(v) for k, v in bones.items()])
# nearest bone that is *under* this bit of skin (behind its surface), so hip skin next to a hand stays hip
N0 = vnormals(W, FW)
dd, nn = cKDTree(pts).query(W, k=40)
under = np.einsum('ikj,ij->ik', pts[nn] - W[:, None, :], N0) < 0.002
first_ok = np.where(under.any(1), under.argmax(1), 0)
G = lab[nn[np.arange(nW), first_ok]]
x, y, z = W[:, 0], W[:, 1], W[:, 2]
L = np.full(nW, PI['body'])
# torso by height
L[(G == 'torso') | (G == 'pelvis')] = PI['tummy']
L[((G == 'torso') | (G == 'pelvis')) & (y > 1.12)] = PI['chest']
L[((G == 'torso') | (G == 'pelvis')) & (y < 0.93)] = PI['hips']
L[((G == 'torso') | (G == 'pelvis')) & (z < -0.035) & (y >= 0.93)] = PI['back']
L[G == 'neck'] = PI['neck']; L[(G == 'torso') & (y > 1.33) & (np.abs(x) < 0.07)] = PI['neck']
L[G == 'head'] = PI['head']; L[(G == 'neck') & (y > 1.415) & (z > 0.0)] = PI['head']
L[(G == 'upper') | (G == 'fore')] = PI['arms']
L[G == 'hand'] = PI['hands']
L[(G == 'thigh') | (G == 'shin')] = PI['legs']
L[G == 'foot'] = PI['feet']
# shoulders: top of the arm/torso near the shoulder joint
for s in (1, -1):
    hu = bones['humerus_l' if s > 0 else 'humerus_r']; top = hu[hu[:, 1].argmax()]
    near = np.linalg.norm(W - top, axis=1) < 0.075
    L[near & (y > 1.24) & (np.isin(L, [PI['arms'], PI['chest'], PI['neck'], PI['back']]))] = PI['shoulders']
    # joints
    el = hu[hu[:, 1].argmin()]
    L[(np.linalg.norm(W - el, axis=1) < 0.05) & (L == PI['arms'])] = PI['elbows']
    fa = bones['forearm_l' if s > 0 else 'forearm_r']; wr = fa[fa[:, 1].argmin()]
    L[(np.linalg.norm(W - wr, axis=1) < 0.035) & np.isin(L, [PI['arms'], PI['hands']])] = PI['wrists']
    hd = bones['hand_l' if s > 0 else 'hand_r']; knuckle = hd[:, 1].min() + 0.095
    L[(L == PI['hands']) & (y < knuckle)] = PI['fingers']
    pa = bones['patella_l' if s > 0 else 'patella_r'].mean(0)
    L[(np.linalg.norm((W - pa) * [1, 0.8, 1], axis=1) < 0.065) & (L == PI['legs'])] = PI['knees']
    ll = bones['lower_leg_l' if s > 0 else 'lower_leg_r']; an = ll[ll[:, 1].argmin()] + [0, 0.02, 0]
    L[(np.linalg.norm(W - an, axis=1) < 0.045) & np.isin(L, [PI['legs'], PI['feet']]) & (y > 0.035)] = PI['ankles']

# thigh skin right next to a hanging hand: if it's not close to a hand/arm bone, it's leg/hip
armb = np.concatenate([bones[k] for k in ['hand_l', 'hand_r', 'forearm_l', 'forearm_r']])
da, _ = cKDTree(armb).query(W)
wrong = np.isin(L, [PI['hands'], PI['fingers'], PI['wrists']]) & (da > 0.022) & (y < 0.9) & (np.abs(x) < 0.19)
L[wrong & (y >= 0.88)] = PI['hips']; L[wrong & (y < 0.88)] = PI['legs']
print('relabelled', wrong.sum(), file=sys.stderr)

# face features
noseTip = np.array([0, 1.482, 0.099])
head = L == PI['head']
front = z > 0.035
def ball(c, r, sc=(1, 1, 1)): return np.linalg.norm((W - c) / np.array(sc), axis=1) < r
eyes = []
for s in (1, -1):
    c = np.array([s * 0.0335, 1.5185, 0.058]); r = 0.0125
    eyes.append({'c': c.round(5).tolist(), 'r': float(r)})
    L[head & ball(c, r + 0.006)] = PI['eyes']
    L[head & front & (y > c[1] + r * 0.55) & (y < c[1] + r * 0.55 + 0.012) & (np.abs(x - c[0]) < r * 1.25)] = PI['eyebrows']
    L[head & front & ball(c + [s * 0.012, -0.038, 0.0], 0.019, (1, 1, 2))] = PI['cheeks']
print('eyes', eyes, file=sys.stderr)
L[head & ball(noseTip + [0, 0.008, -0.01], 0.024, (0.8, 1.3, 1.2))] = PI['nose']
L[head & front & ball([0, 1.457, 0.09], 0.022, (1.1, 0.5, 1))] = PI['mouth']
L[head & front & ball([0, 1.426, 0.075], 0.022, (1.1, 0.7, 1.2))] = PI['chin']
L[head & (np.abs(x) > 0.066) & (y > 1.455) & (y < 1.545) & (z > -0.04) & (z < 0.035)] = PI['ears']

# ---------------- 3. clothes and hair (offset copies of the skin, smoothed like fabric) ----------------
N = vnormals(W, FW)
def clip(P, F, f, Lv):
    """keep the part of the mesh where f >= 0, cutting triangles along the smooth line f = 0"""
    P = list(map(tuple, P)); Lv = list(Lv); edge = {}; out = []
    def cut(i, j):
        k = (min(i, j), max(i, j))
        if k not in edge:
            t = f[i] / (f[i] - f[j]); pi, pj = np.array(P[i]), np.array(P[j])
            P.append(tuple(pi + (pj - pi) * t)); Lv.append(Lv[i]); edge[k] = len(P) - 1
            fl.append(0.0)
        return edge[k]
    fl = list(f)
    for tri in F:
        s = [fl[v] >= 0 for v in tri]
        n = sum(s)
        if n == 3: out.append(list(tri)); continue
        if n == 0: continue
        r = s.index(True) if n == 1 else s.index(False)
        a, b, c = tri[r], tri[(r + 1) % 3], tri[(r + 2) % 3]
        ab, ac = cut(a, b), cut(a, c)
        if n == 1: out.append([a, ab, ac])
        else: out += [[ab, b, c], [ab, c, ac]]
    out = np.array(out); P = np.array(P); Lv = np.array(Lv)
    used = np.unique(out); remap = -np.ones(len(P), int); remap[used] = np.arange(len(used))
    return P[used], remap[out], Lv[used]
def garment(mask, field, off, smooth=12, name=''):
    fm = mask[FW].any(1)
    Fg = FW[fm]
    used = np.unique(Fg); remap = -np.ones(nW, int); remap[used] = np.arange(len(used))
    f = np.where(mask[used], field[used], -0.01)
    P, Fg2, Lg = clip(W[used] + N[used] * off, remap[Fg], f, L[used])
    adj = adjacency(Fg2, len(P))
    E = np.sort(np.concatenate([Fg2[:, [0, 1]], Fg2[:, [1, 2]], Fg2[:, [2, 0]]]), axis=1)
    u, c = np.unique(E, axis=0, return_counts=True); bnd = np.zeros(len(P), bool); bnd[u[c == 1].ravel()] = True
    P = taubin(P, adj, smooth, fixed=bnd)
    # a light pass over the hem itself so it is a smooth curve
    P2 = taubin(P, adj, 3); P[bnd] = P2[bnd]
    print(name, len(P), 'verts', len(Fg2), 'tris', file=sys.stderr)
    return P, Fg2, Lg
cl = lambda v: np.clip(v, 0, 1)
torso_l = [PI[k] for k in ['chest', 'tummy', 'back', 'shoulders', 'neck', 'arms', 'elbows', 'hips']]
shirt_m = np.isin(L, torso_l) & (y > 0.86)
dip = 0.045 * np.exp(-(x / 0.05) ** 2) * cl(z / 0.04) + 0.012 * np.exp(-(x / 0.05) ** 2) * cl(-z / 0.04)
armside = np.isin(L, [PI['arms'], PI['elbows']]) | ((np.abs(x) > 0.155) & (y < 1.3))
shirt_f = np.minimum.reduce([y - 0.905, (1.372 - dip) - y, np.where(armside, y - 1.14, 1)])
shorts_m = np.isin(L, [PI['hips'], PI['legs'], PI['tummy'], PI['back'], PI['knees']]) & (y > 0.5)
shorts_f = np.minimum(0.955 - y, y - 0.615 - 0.01 * np.abs(x) / 0.1)
shoe_m = np.isin(L, [PI['feet'], PI['ankles']]) & (y < 0.12)
shoe_f = (0.068 - 0.03 * cl((z - 0.0) / 0.1)) - y
hairline = np.interp(z, [-0.12, -0.07, -0.02, 0.03, 0.08], [1.42, 1.45, 1.535, 1.55, 1.57]) + 0.006 * np.cos(x * 60) * cl(z / 0.04)
hair_m = (G == 'head') | (G == 'neck')
hair_f = np.where(np.isin(L, [PI['eyes'], PI['eyebrows'], PI['ears'], PI['nose']]), -0.01, y - hairline)
out = {'parts': PARTS, 'eyes': eyes}
for nm, m, f, off, sm in [('shirt', shirt_m, shirt_f, 0.008, 22), ('shorts', shorts_m, shorts_f, 0.0105, 10), ('shoes', shoe_m, shoe_f, 0.011, 40), ('hair', hair_m, hair_f, 0.013, 16)]:
    P, Fg, Lg = garment(m, f, off, sm, nm)
    if nm == 'hair': Lg = np.full(len(P), PI['hair'])
    if nm == 'shoes': Lg = np.full(len(P), PI['feet'])
    out[nm] = {'P': P.round(5).ravel().tolist(), 'I': Fg.ravel().tolist(), 'L': Lg.tolist()}

# the skin itself (welded), with part labels
out['skin'] = {'P': W.round(5).ravel().tolist(), 'I': FW.ravel().tolist(), 'L': L.tolist()}
print({PARTS[k]: int((L == k).sum()) for k in range(len(PARTS))}, file=sys.stderr)

# ---------------- 4. lungs: smooth surfaces wrapped around the airway / vessel trees ----------------
heart = A('heart'); hc = cKDTree(heart)
ribs = np.concatenate([A('ribs_l'), A('ribs_r')])
for side in ('lung_l', 'lung_r'):
    T = A(side)
    lo, hi = T.min(0) - 0.03, T.max(0) + 0.03
    h = 0.003
    shape = np.ceil((hi - lo) / h).astype(int) + 1
    grid = np.zeros(shape)
    idx = np.clip(((T - lo) / h).astype(int), 0, shape - 1)
    np.add.at(grid, tuple(idx.T), 1)
    grid = ndimage.gaussian_filter((grid > 0).astype(float), 3.6)   # ~1cm blur
    # fill the inside so it's one solid organ, then close
    solid = grid > 0.02
    solid = ndimage.binary_closing(solid, iterations=4)
    solid = ndimage.binary_fill_holes(solid)
    # carve out the heart
    gx, gy, gz = np.meshgrid(*[lo[i] + np.arange(shape[i]) * h for i in range(3)], indexing='ij')
    Q = np.stack([gx.ravel(), gy.ravel(), gz.ravel()], 1)
    dh, _ = hc.query(Q, distance_upper_bound=0.03)
    solid &= ~(dh.reshape(shape) < 0.012)
    lab_, n = ndimage.label(solid)
    if n > 1:
        sizes = ndimage.sum(solid, lab_, range(1, n + 1)); solid = lab_ == (1 + np.argmax(sizes))
    f = ndimage.gaussian_filter(solid.astype(float), 2.4)
    vs, fs, _, _ = measure.marching_cubes(f, 0.5)
    P = vs * h + lo
    # small vertex count: decimate by Taubin smoothing + later meshopt simplify
    adj = adjacency(fs, len(P)); P = taubin(P, adj, 12)
    fs = fs[:, ::-1]  # outward winding for three.js
    out[side + '_surf'] = {'P': P.round(5).ravel().tolist(), 'I': fs.ravel().tolist()}
    print(side, len(P), 'verts', P.min(0).round(3), P.max(0).round(3), file=sys.stderr)

json.dump(out, open(sys.argv[2], 'w'))
