import { startOrbBackground, stopOrbBackground } from "./orb-background.js";

export const _SETTINGS_KEY = "JAPPS_SETTINGS_v1";

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
		const raw = localStorage.getItem(_SETTINGS_KEY);
		if (!raw) return structuredClone(defaults);

		const parsed = _safeParseJson(raw);
		if (!parsed) return structuredClone(defaults);

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
		localStorage.setItem(_SETTINGS_KEY, JSON.stringify(settingsObj || {}));
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

	document.documentElement.classList.toggle("reduceMotion", !!s.reduceMotion);

	const orbsEnabled = !!(s.orbs?.enabled) && !s.reduceMotion;
	document.documentElement.classList.toggle("orbsOff", !orbsEnabled);

	if (!orbsEnabled) {
		stopOrbBackground({ removeLayer: true });
	}

	return s;
}

export function initAppSettings(defaults = getDefaultAppSettings()) {
	const s = applyAppSettings(loadAppSettings(defaults));

	window.addEventListener("storage", (ev) => {
		if (ev.key !== _SETTINGS_KEY) return;
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
