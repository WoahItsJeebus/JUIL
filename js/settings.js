const KEY = "JUIL_SETTINGS_v1";

export function loadSettings(defaults = {}) {
	let global = {}
	let project = {}

	try {
		global = JSON.parse(localStorage.getItem(GLOBAL_SETTINGS_KEY)) || {}
	} catch {}

	try {
		project = JSON.parse(localStorage.getItem(getProjectSettingsKey())) || {}
	} catch {}

	return {
		...defaults,
		...global,
		...project
	}
}

export function saveSettings(settings) {
	localStorage.setItem(
		getProjectSettingsKey(),
		JSON.stringify(settings || {})
	)
}

export function applyTheme(vars){
	if(!vars) return;
	for(const k in vars){
		document.documentElement.style.setProperty(`--${k}`, vars[k]);
	}
}

export function detectProjectId() {
	try {
		const path = location.pathname
			.replace(/^\/+/, "")      // remove leading slash
			.split("/")[0]            // first directory

		if (!path) return "root"

		// sanitize
		return path.replace(/[^a-z0-9_-]/gi, "").toLowerCase()
	} catch {
		return "unknown"
	}
}

export function getProjectSettingsKey() {
	return `JUIL_SETTINGS_${detectProjectId()}`
}

export const GLOBAL_SETTINGS_KEY = "JUIL_SETTINGS_GLOBAL"