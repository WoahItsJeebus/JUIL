const JUIL_SETTINGS_URL = "https://woahitsjeebus.github.io/JUIL/pages/settings/";

/**
 * Mark the active bottom tab.
 * Pass a key from the page: "home", "about", "settings"
 *
 * If omitted, it tries to infer from the current path as a fallback.
 *
 * Also forces any settings tab to point to JUIL's own settings page
 * so external projects that pull in JUIL don't redirect locally.
 */
export function autoMarkActiveTab(pageKey) {
	function inferKeyFromPath() {
		const p = location.pathname.toLowerCase();
		// tolerate both "/pages/about/" and "/about/" structures
		if (p.includes("/settings/")) return "settings";
		if (p.includes("/about/")) return "about";
		if (p.includes("/home/")) return "home";
		return null;
	}

	const key = String(pageKey || inferKeyFromPath() || "").toLowerCase();
	document.querySelectorAll(".tabs .tabBtn").forEach((a) => {
		const k = (a.getAttribute("data-tab") || "").toLowerCase();
		a.classList.toggle("active", k === key);

		// Always point settings tab to JUIL's hosted settings page
		if (k === "settings") a.href = JUIL_SETTINGS_URL;
	});
}

(function () {
	function updateTabsDockPad() {
		const pill = document.querySelector(".tabsBar .tabs");
		if (!pill) return;

		const h = Math.ceil(pill.getBoundingClientRect().height);

		// pill height + bottom offset (12px) + a little breathing room (12px)
		document.documentElement.style.setProperty("--tabsDockPad", `${h + 24}px`);
	}

	window.addEventListener("resize", updateTabsDockPad, { passive: true });
	updateTabsDockPad();
})();
