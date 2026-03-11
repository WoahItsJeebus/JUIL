export { _VERSION } from "../js/version.js";

export { startOrbBackground, stopOrbBackground } from "../js/orb-background.js";

export { hardReload } from "../js/utils.js";

export {
	_SETTINGS_KEY,
	getDefaultAppSettings,
	loadAppSettings,
	saveAppSettings,
	applyCssVars,
	applyAppSettings,
	initAppSettings,
	startOrbBackgroundFromSettings,
	exportAppSettingsJson,
	importAppSettingsJson,
} from "../js/settings.js";

export {
	updateFadeState,
	attachFadeScroll,
	attachFadeScrollByIds,
	attachFadeToScroller,
} from "../js/fade-scroll.js";

export { renderPlatformLinks } from "../js/platform-links.js";

export { autoMarkActiveTab } from "../js/tabs.js";
