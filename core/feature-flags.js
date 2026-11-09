/* kids-core: release feature flags (values come from app.config.json "features").
   Production: testMode=false. Local Playwright browser tests may opt in on localhost,
   but a saved testMode=true value can never enable debugging on production. */
const APP_FEATURES = Object.freeze({
  testMode: !!(AppConfig.features && AppConfig.features.testMode),
  localTestAutomation: !(AppConfig.features && AppConfig.features.localTestAutomation === false)
});
// Non-production QA on a real device: open the app once with ?qa=1 (and ?qa=0 to lock it again).
// This only makes the 🧪 Test mode switch appear in the PIN-protected grown-up Settings.
const QA_KEY = AppConfig.storage.qaKey || AppConfig.storage.key + '.qa';
try {
  const qa = new URLSearchParams(location.search).get('qa');
  if (qa === '1') localStorage.setItem(QA_KEY, '1');
  if (qa === '0') localStorage.removeItem(QA_KEY);
} catch {}
const qaUnlocked = () => { try { return localStorage.getItem(QA_KEY) === '1'; } catch { return false; } };
const testFeatureAvailable = () => APP_FEATURES.testMode || qaUnlocked() ||
  (APP_FEATURES.localTestAutomation && /^(localhost|127\.0\.0\.1)$/.test(location.hostname));
const isTestMode = () => testFeatureAvailable() && typeof state !== 'undefined' && !!state.testMode;
