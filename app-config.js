/* Release feature flags. Set qaTools to true only for QA builds.
   Production launch MUST use false; this is deliberately fail-closed. */
const APP_FEATURES = Object.freeze({ qaTools: false });
