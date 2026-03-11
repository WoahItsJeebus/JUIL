/**
 * Fade scroll logic
 */

export function updateFadeState(el) {
	if (!el) return;

	const max = el.scrollWidth - el.clientWidth;

	if (max <= 1) {
		el.classList.remove("isScrollable", "atStart", "atEnd");
		return;
	}

	el.classList.add("isScrollable");

	if (el.scrollLeft <= 1) el.classList.add("atStart");
	else el.classList.remove("atStart");

	if (el.scrollLeft >= max - 1) el.classList.add("atEnd");
	else el.classList.remove("atEnd");
}

export function attachFadeScroll(el) {
	if (!el) return;

	updateFadeState(el);

	el.addEventListener("scroll", () => updateFadeState(el), {
		passive: true
	});

	if ("ResizeObserver" in window) {
		const ro = new ResizeObserver(() => updateFadeState(el));
		ro.observe(el);
	}
	else {
		window.addEventListener("resize", () => updateFadeState(el));
	}
}

/**
 * Attach fades for a list of element IDs
 */
export function attachFadeScrollByIds(ids) {
	for (const id of ids) {
		attachFadeScroll(document.getElementById(id));
	}
}

export function attachFadeToScroller(scrollerEl, fadeEl) {
	if (!scrollerEl || !fadeEl) return;

	function sync() {
		const max = scrollerEl.scrollWidth - scrollerEl.clientWidth;

		if (max <= 1) {
			fadeEl.classList.remove("isScrollable", "atStart", "atEnd");
			return;
		}

		fadeEl.classList.add("isScrollable");

		if (scrollerEl.scrollLeft <= 1) fadeEl.classList.add("atStart");
		else fadeEl.classList.remove("atStart");

		if (scrollerEl.scrollLeft >= max - 1) fadeEl.classList.add("atEnd");
		else fadeEl.classList.remove("atEnd");
	}

	sync();
	scrollerEl.addEventListener("scroll", sync, {
		passive: true
	});

	if ("ResizeObserver" in window) {
		const ro = new ResizeObserver(sync);
		ro.observe(scrollerEl);
		ro.observe(fadeEl);
	}
	else {
		window.addEventListener("resize", sync);
	}
}
