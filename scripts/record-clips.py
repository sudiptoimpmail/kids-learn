#!/usr/bin/env python3
"""Record new voice clips in the app's voice (Kokoro, voice af_heart) and add them to audio/clips.json.

    pip install kokoro-onnx soundfile        (ffmpeg must be installed)
    # model files: https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0
    KOKORO_DIR=~/kokoro python3 scripts/record-clips.py --lessons          # every phrase in data/lessons.json
    KOKORO_DIR=~/kokoro python3 scripts/record-clips.py "Watch me first."   # any phrases

File names match the existing clips: the phrase key with dashes, then the first 6 characters of its MD5.
Existing recordings are kept (use --force to record a phrase again). Loudness is matched to the existing clips."""
import argparse, hashlib, json, os, re, subprocess, sys, tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CLIPS = os.path.join(ROOT, 'audio', 'clips.json')


def clip_key(text):  # same as kids-core voice.js clipKey (ascii keys)
    return re.sub(r'\s+', ' ', re.sub(r"[^a-z0-9' ]+", ' ', str(text).lower())).strip()


def file_name(key):
    slug = re.sub(r'-+', '-', re.sub(r'[^a-z0-9]+', '-', key)).strip('-')
    return f"{slug}-{hashlib.md5(key.encode()).hexdigest()[:6]}.mp3"


def lesson_phrases():
    with open(os.path.join(ROOT, 'data', 'lessons.json')) as f:
        return list(json.load(f)['datasets']['phrases'].values())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('phrases', nargs='*')
    ap.add_argument('--lessons', action='store_true')
    ap.add_argument('--force', action='store_true')
    ap.add_argument('--voice', default='af_heart')
    ap.add_argument('--speed', type=float, default=1.0)
    a = ap.parse_args()
    phrases = a.phrases + (lesson_phrases() if a.lessons else [])
    if not phrases:
        sys.exit('nothing to record')
    with open(CLIPS) as f:
        clips = json.load(f)
    todo = [(p, clip_key(p)) for p in phrases if a.force or clip_key(p) not in clips]
    if not todo:
        print('all phrases already recorded'); return
    from kokoro_onnx import Kokoro
    import soundfile as sf
    d = os.environ.get('KOKORO_DIR', '.')
    k = Kokoro(os.path.join(d, 'kokoro-v1.0.onnx'), os.path.join(d, 'voices-v1.0.bin'))
    for text, key in todo:
        samples, rate = k.create(text, voice=a.voice, speed=a.speed, lang='en-us')
        name = file_name(key)
        with tempfile.NamedTemporaryFile(suffix='.wav') as tmp:
            sf.write(tmp.name, samples, rate)
            # trim lead-in silence, cap peaks like the existing clips (-6 dBFS), mono 24 kHz 40 kbps mp3
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', tmp.name, '-af',
                            'silenceremove=start_periods=1:start_threshold=-50dB,alimiter=limit=0.5:level=false',
                            '-ar', '24000', '-ac', '1', '-b:a', '40k', os.path.join(ROOT, 'audio', name)], check=True)
        clips[key] = name
        print('recorded', key, '->', name)
    with open(CLIPS, 'w') as f:
        json.dump(clips, f, ensure_ascii=False, indent=None, separators=(',', ':'))   # one line, as before


if __name__ == '__main__':
    main()
