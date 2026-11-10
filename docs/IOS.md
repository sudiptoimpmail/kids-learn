# Learn & Play on your iPhone and iPad

The iPhone/iPad app is the same Learn & Play, wrapped with **Capacitor** (free). Every game, picture and voice clip is
inside the app, so it works with no internet. The project for Xcode is in `ios/`.

You need: a Mac, a cable for the iPhone/iPad, and a free Apple ID. No paid developer account is needed to put it on
your own devices.

---

## One-time setup on the Mac

1. **Install Xcode** from the Mac App Store (free, large download). Open it once, accept the licence, and let it
   install the iOS components it asks for.
2. **Install Node.js 22 or newer** from <https://nodejs.org> (the "LTS" button).
3. **Get the code.** In Terminal:
   ```sh
   git clone https://github.com/sudiptoimpmail/kids-learn.git
   cd kids-learn
   npm install
   ```
   (GitHub Desktop works too: clone `kids-learn`, then run `npm install` in its folder.)
4. **Add your Apple ID to Xcode:** Xcode → Settings → Accounts → **+** → Apple ID.

## Put the app on the iPhone or iPad

1. In Terminal, in the `kids-learn` folder:
   ```sh
   npm run ios
   ```
   This copies the app into the project and opens it in Xcode.
2. In Xcode, click **App** at the top of the left column, then the **Signing & Capabilities** tab.
   Set **Team** to *Your Name (Personal Team)*.
   If Xcode says the bundle identifier is not available, change `com.sudiptodas.learnandplay` to something only
   you would use, such as `com.sudipta.learnandplay`.
3. Plug the iPhone/iPad into the Mac. On the device tap **Trust** and enter its passcode.
4. Turn on **Developer Mode** on the device (asked only once): Settings → Privacy & Security → Developer Mode → on,
   then let it restart. (The switch appears after the device has been plugged into Xcode.)
5. At the top of Xcode, pick your device from the device list, then press **▶ Run**.
6. The first time, the device says the developer is not trusted. Go to Settings → General →
   **VPN & Device Management** → your Apple ID → **Trust**. Open Learn & Play.

After the first time, Xcode can install over Wi-Fi: Window → Devices and Simulators → your device →
**Connect via network**.

## Things to know with a free Apple ID

- **The app stops opening after 7 days.** Plug in and press ▶ Run again. Progress is kept.
- Up to 3 of your own apps per device at a time.
- **Progress is separate from the website.** The app and Safari keep their own copies. To move progress into the app:
  on the website open ⚙️ → **Save a backup**, then in the app ⚙️ → **Load a backup** and pick that file
  (AirDrop or Files to get it onto the device).
- Inside the app, progress is also kept in the app's own storage, so iOS can't clear it when space is low.

## When the app changes

```sh
git pull
npm run ios:sync
```
Then press ▶ Run in Xcode. The app on the device does not update itself from the website.

## What is different inside the app

All of this comes from kids-core (`core/native.js`) and does nothing on the website:

- full screen (no clock or battery bar)
- the screen stays on while your child is playing, and can sleep after 5 quiet minutes
- a small tap feel on buttons (iPhone)
- no download of updates in the background: everything is already in the app

## Later: TestFlight and the App Store

Both need the **Apple Developer Program** ($99 a year). TestFlight itself is free once you have it.

1. Join at <https://developer.apple.com/programs/>.
2. In Xcode, change **Team** to the paid team. The 7-day limit goes away.
3. Product → **Archive** → Distribute App → **TestFlight & App Store**.
4. In App Store Connect, add testers (family can install with the TestFlight app), or submit for review.

Before submitting to the **Kids** category: a privacy policy page, no third-party ads or analytics (there are none),
and anything that leaves the app or buys something behind the grown-up check (the PIN screen already does this).

## Files

| File | What it is |
|---|---|
| `capacitor.config.json` | app id, name, launch screen colour |
| `scripts/build-www.mjs` | copies the website files into `www/` (left out: tests, scripts, docs) |
| `ios/App/App/Info.plist` | orientations (all, on iPhone and iPad), full screen |
| `ios/App/App/Assets.xcassets` | app icon (1024×1024) and launch picture |
| `www/`, `ios/App/App/public/` | made by `npm run ios`; not saved in git |
