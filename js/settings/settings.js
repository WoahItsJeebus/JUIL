export const JUIL_SETTINGS_KEY = "JUIL_SETTINGS_v1";

export function getDefaultAppSettings() {
	return {
		version: 1,

		// Theme vars map directly to CSS vars
		themeVars: {
			bg: "#0b0f17",
			card: "#121a2a",
			text: "#e7edf7",
			muted: "#a9b4c7",
			border: "rgba(255,255,255,.08)",
			good: "#3ddc97",
			warn: "#ffcc66",
			bad: "#ff6b6b",
		},

		// Orbs (merged into startOrbBackground options)
		orbs: {
			enabled: true,
			maxOrbs: 3,
			opacity: {
				min: 0.5,
				max: 0.7
			},
			colors: ["#20493f", "#306459", "#2f5e7e"],
		},

		// Extra hard “off” switch
		reduceMotion: false,
	};
}

function _safeParseJson(raw) {
	try {
		const v = JSON.parse(raw);
		return v && typeof v === "object" ? v : null;
	}
	catch {
		return null;
	}
}

export function loadAppSettings(defaults = getDefaultAppSettings()) {
	try {
		const raw = localStorage.getItem(JUIL_SETTINGS_KEY);
		if (!raw) return structuredClone(defaults);

		const parsed = _safeParseJson(raw);
		if (!parsed) return structuredClone(defaults);

		// Shallow merge is fine since we control shape
		const merged = structuredClone(defaults);
		if (parsed.themeVars && typeof parsed.themeVars === "object") {
			merged.themeVars = {
				...merged.themeVars,
				...parsed.themeVars
			};
		}
		if (parsed.orbs && typeof parsed.orbs === "object") {
			merged.orbs = {
				...merged.orbs,
				...parsed.orbs
			};
		}
		if (typeof parsed.reduceMotion === "boolean") merged.reduceMotion = parsed.reduceMotion;

		return merged;
	}
	catch {
		return structuredClone(defaults);
	}
}

export function saveAppSettings(settingsObj) {
	try {
		localStorage.setItem(JUIL_SETTINGS_KEY, JSON.stringify(settingsObj || {}));
		return true;
	}
	catch {
		return false;
	}
}

export function applyCssVars(vars) {
	if (!vars || typeof vars !== "object") return;
	const root = document.documentElement;
	for (const [k, v] of Object.entries(vars)) {
		if (v == null) continue;
		const key = k.startsWith("--") ? k : `--${k}`;
		root.style.setProperty(key, String(v));
	}
}

export function applyAppSettings(settingsObj) {
	const s = settingsObj || loadAppSettings();

	applyCssVars(s.themeVars);

	// If user explicitly disables motion, enforce it
	document.documentElement.classList.toggle("reduceMotion", !!s.reduceMotion);

	// If reduceMotion is on, we also treat orbs as disabled
	const orbsEnabled = !!(s.orbs?.enabled) && !s.reduceMotion;
	document.documentElement.classList.toggle("orbsOff", !orbsEnabled);

	// If orbs are off, stop any currently running background
	if (!orbsEnabled && typeof __orbBgStop === "function") {
		__orbBgStop({
			removeLayer: true
		});
	}

	return s;
}

export function initAppSettings(defaults = getDefaultAppSettings()) {
	const s = applyAppSettings(loadAppSettings(defaults));

	// Cross-tab/page sync
	window.addEventListener("storage", (ev) => {
		if (ev.key !== JUIL_SETTINGS_KEY) return;
		applyAppSettings(loadAppSettings(defaults));
	});

	return s;
}

export function startOrbBackgroundFromSettings(baseOpts = {}) {
	const s = loadAppSettings();
	s.reduceMotion = !!s.reduceMotion;

	const orbsEnabled = !!(s.orbs?.enabled) && !s.reduceMotion;
	if (!orbsEnabled) return {
		stop() {}
	};

	const opts = {
		...baseOpts,
		...(s.orbs || {})
	};
	return startOrbBackground(opts);
}

export function exportAppSettingsJson() {
	return JSON.stringify(loadAppSettings(), null, 2);
}

export function importAppSettingsJson(jsonText) {
	const parsed = _safeParseJson(String(jsonText || ""));
	if (!parsed) return {
		ok: false,
		error: "Invalid JSON"
	};

	// Merge into defaults so missing keys don’t nuke the app
	const merged = loadAppSettings();
	if (parsed.themeVars && typeof parsed.themeVars === "object") {
		merged.themeVars = {
			...merged.themeVars,
			...parsed.themeVars
		};
	}
	if (parsed.orbs && typeof parsed.orbs === "object") {
		merged.orbs = {
			...merged.orbs,
			...parsed.orbs
		};
	}
	if (typeof parsed.reduceMotion === "boolean") merged.reduceMotion = parsed.reduceMotion;

	saveAppSettings(merged);
	applyAppSettings(merged);
	return {
		ok: true
	};
}

