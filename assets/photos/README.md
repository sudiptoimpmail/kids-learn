# Offline learning photographs

These sixteen square photographs (cat, dog, rabbit, duck, elephant, tiger, butterfly, horse, sunflower, rose, tulip, daisy, car, airplane, helicopter, truck) are real photos from Wikimedia Commons, centre-cropped to 512 × 512 JPEGs. Each one is CC0, public domain, CC BY or CC BY-SA; the licence and author come from the official Commons API and are listed in `data/photo-credits.json` and on the in-app Credits page (`credits.html`).

To replace one, add it to `media/commons-fetch.json` on a `media/*` branch: the "Fetch Commons photos" workflow downloads it, reads its licence from Commons and commits it. Keep filenames stable and bump the service-worker VERSION.
