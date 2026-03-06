
export { startOrbBackground } from "./js/background/orbs.js"

export {
  initAppSettings,
  loadAppSettings,
  saveAppSettings,
  applyAppSettings,
  getDefaultAppSettings,
  exportAppSettingsJson,
  importAppSettingsJson,
  startOrbBackgroundFromSettings
} from "./js/settings/settings.js"

export {
  updateFadeState,
  attachFadeScroll,
  attachFadeScrollByIds,
  attachFadeToScroller
} from "./js/ui/fadeScroll.js"

export { renderPlatformLinks } from "./js/ui/platformLinks.js"
export { autoMarkActiveTab } from "./js/ui/tabs.js"

export { hardReload } from "./js/system/hardReload.js"
export { _VERSION } from "./js/system/version.js"
