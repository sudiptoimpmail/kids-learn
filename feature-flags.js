/* File-based release feature flags.
   Production: testMode=false. Local Playwright browser tests may opt in on localhost,
   but a saved testMode=true value can never enable debugging on production. */
const APP_FEATURES = Object.freeze({
  testMode: false,
  localTestAutomation: true
});
const testFeatureAvailable = () => APP_FEATURES.testMode ||
  (APP_FEATURES.localTestAutomation && /^(localhost|127\.0\.0\.1)$/.test(location.hostname));
const isTestMode = () => testFeatureAvailable() && typeof state !== 'undefined' && !!state.testMode;
