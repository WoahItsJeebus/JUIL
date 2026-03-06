let __orbBgStop = null
let __orbBgRunning = false

export function startOrbBackground(opts = {}) {
	const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
	
	if (reduce) return {
		stop() {}
	};

	// stop any existing background
	if (__orbBgStop) {
		__orbBgStop()
	}

	__orbBgRunning = true

	const cfg = {
		maxOrbs: 5,
		spawnEveryMs: 700,

		sizeMin: 260,
		sizeMax: 560,

		// base size is constant; animate scale instead
		baseSizePx: 560,

		durMinMs: 5000,
		durMaxMs: 13000,

		blurMin: 14,
		blurMax: 24,

		// If false, blur is set once per cycle (snap), not animated
		animateBlur: false,

		margin: 0.12,
		opacity: {
			min: 0.35,
			max: 0.6
		},
		colors: ["#20493f", "#306459", "#2f5e7e"],
		...opts,
	};

	// crude but effective: mobile = fewer orbs + slower cycles unless overridden
	const isSmall = matchMedia?.("(max-width: 520px)")?.matches;
	if (isSmall && opts.maxOrbs == null) cfg.maxOrbs = Math.min(cfg.maxOrbs, 3);
	if (isSmall && opts.durMinMs == null) cfg.durMinMs = Math.max(cfg.durMinMs, 8000);
	if (isSmall && opts.durMaxMs == null) cfg.durMaxMs = Math.max(cfg.durMaxMs, 16000);
	if (isSmall && opts.baseSizePx == null) cfg.baseSizePx = Math.min(cfg.baseSizePx, cfg.sizeMax);


	const clamp01 = (v) => Math.max(0, Math.min(1, v));
	const rand = (a, b) => a + Math.random() * (b - a);
	const randi = (a, b) => Math.floor(rand(a, b + 1));
	const pick = (arr) => arr[randi(0, arr.length - 1)];

	function ToRGBA(hex) {
		if (typeof hex !== "string") throw new TypeError("hex must be a string");

		let s = hex.trim();
		if (s.startsWith("#")) s = s.slice(1);

		// Expand #RGB/#RGBA -> #RRGGBB/#RRGGBBAA
		if (s.length === 3 || s.length === 4) {
			s = s.split("").map((ch) => ch + ch).join("");
		}

		if (!/^[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/.test(s)) {
			throw new Error("Invalid hex color");
		}

		const rgb = s.slice(0, 6);
		const aHex = s.length === 8 ? s.slice(6, 8) : null;

		const n = parseInt(rgb, 16);
		const r = (n >> 16) & 255;
		const g = (n >> 8) & 255;
		const b = n & 255;

		const a = aHex ? parseInt(aHex, 16) / 255 : 1;
		return [r, g, b, a];
	}

	function resolveOpacity(op) {
		if (typeof op === "number") return clamp01(op);

		if (Array.isArray(op) && op.length >= 2) {
			return clamp01(rand(op[0], op[1]));
		}

		if (op && typeof op === "object") {
			const min = typeof op.min === "number" ? op.min : 0.2;
			const max = typeof op.max === "number" ? op.max : min;
			return clamp01(rand(min, max));
		}

		return 0.2; // fallback
	}

	let layer = document.querySelector(".bgOrbs");
	if (!layer) {
		layer = document.createElement("div");
		layer.className = "bgOrbs";
		layer.setAttribute("aria-hidden", "true");
		document.body.prepend(layer);
	}

	let stopped = false;
	const timeouts = new Set();

	function later(ms, fn) {
		const id = window.setTimeout(() => {
			timeouts.delete(id);
			fn();
		}, ms);
		timeouts.add(id);
		return id;
	}

	function randPct() {
		return rand(-cfg.margin, 1 + cfg.margin) * 100;
	}

	function makeSpec() {
		const size = randi(cfg.sizeMin, cfg.sizeMax);
		const dur = randi(cfg.durMinMs, cfg.durMaxMs);
		const blur = randi(cfg.blurMin, cfg.blurMax);

		// Use viewport units so we can do transform translate without layout
		const x = randPct(); // in vw
		const y = randPct(); // in vh

		// Keep drift small; large drift makes big blurred pixels move every frame
		const dx = randi(-28, 28);
		const dy = randi(-24, 24);

		const [r, g, b, aHex] = ToRGBA(pick(cfg.colors));
		const baseOpacity = resolveOpacity(cfg.opacity);
		const finalOpacity = clamp01(baseOpacity * aHex);

		// Scale relative to a constant base size (no width/height animation)
		const s = size / cfg.baseSizePx;

		return {
			size,
			s,
			dur,
			blur,
			x,
			y,
			dx,
			dy,
			rgb: `${r},${g},${b}`,
			a: `${finalOpacity}`,
		};
	}


	function setLayerColor(layerEl, spec) {
		layerEl.style.setProperty("--rgb", spec.rgb);
		layerEl.style.setProperty("--a", spec.a);
	}

	function applyFinalGeometry(orbEl, spec) {
		// Constant footprint => no layout churn
		orbEl.style.width = `${cfg.baseSizePx}px`;
		orbEl.style.height = `${cfg.baseSizePx}px`;

		// Blur is expensive if animated; snap it (or keep constant)
		orbEl.style.filter = `blur(${spec.blur}px)`;

		// Put the orb where it belongs via transform (translate uses vw/vh)
		// translate(-50%,-50%) centers the element on the coordinate
		orbEl.style.transform = `translate3d(${spec.x}vw, ${spec.y}vh, 0) translate(-50%, -50%) scale(${spec.s})`;
	}

	function lerp(a, b, t) {
		return a + (b - a) * t;
	}

	function driftTransform(spec, t, extraScale = 1) {
		const ox = spec.dx * t;
		const oy = spec.dy * t;
		const s = spec.s * extraScale;

		return `translate3d(${spec.x}vw, ${spec.y}vh, 0) translate(-50%, -50%) translate3d(${ox}px, ${oy}px, 0) scale(${s})`;
	}

	function animateOrb(handle, isFirst = false) {
		if (stopped) return;

		const el = handle.el;
		const a0 = handle.layers[handle.activeIndex];
		const a1 = handle.layers[1 - handle.activeIndex];

		const from = handle.spec || makeSpec();
		const to = makeSpec();

		// Prep next gradient
		setLayerColor(a1, to);
		a1.style.opacity = "0";

		// Geometry baseline (ensures keyframes resolve cleanly)
		applyFinalGeometry(el, from);

		// If WAAPI is missing, fall back to "jump + crossfade" (still no stacking)
		const canAnimate = typeof el.animate === "function" && typeof a0.animate === "function";
		if (!canAnimate) {
			// Crossfade
			a0.style.transition = `opacity ${Math.max(350, Math.floor(to.dur * 0.45))}ms ease-in-out`;
			a1.style.transition = `opacity ${Math.max(350, Math.floor(to.dur * 0.45))}ms ease-in-out`;
			a0.style.opacity = "0";
			a1.style.opacity = "1";

			// Morph geometry
			el.style.transition = [
				`left ${to.dur}ms ease-in-out`,
				`top ${to.dur}ms ease-in-out`,
				`width ${to.dur}ms ease-in-out`,
				`height ${to.dur}ms ease-in-out`,
				`filter ${to.dur}ms ease-in-out`,
				`transform ${to.dur}ms ease-in-out`,
				`opacity ${Math.max(450, Math.floor(to.dur * 0.35))}ms ease-in-out`,
			].join(", ");

			if (isFirst) el.style.opacity = "0";
			// kick to visible
			requestAnimationFrame(() => {
				el.style.opacity = "0.7";
				el.style.transform = driftTransform(to.dx, to.dy, 1, 1.08);
				applyFinalGeometry(el, to);
			});

			// finalize + loop
			later(to.dur, () => {
				handle.activeIndex = 1 - handle.activeIndex;
				handle.spec = to;
				a0.style.opacity = "0";
				a1.style.opacity = "1";
				animateOrb(handle, false);
			});

			return;
		}

		// Cancel any previous animations on this handle
		handle.anims.forEach((x) => {
			try {
				x.cancel();
			}
			catch {}
		});
		handle.anims.length = 0;

		const dur = to.dur;
		const fadeDur = Math.max(650, Math.floor(dur * 0.55));

		if (!cfg.animateBlur) {
			el.style.filter = `blur(${from.blur}px)`;
		}

		const parentAnim = el.animate(
			[{
					opacity: isFirst ? 0 : 0.7,
					transform: driftTransform(from, 0.0, 1.02),
				},
				{
					offset: 0.25,
					opacity: 0.88,
					transform: driftTransform({
							...from,
							x: lerp(from.x, to.x, 0.25),
							y: lerp(from.y, to.y, 0.25),
							s: lerp(from.s, to.s, 0.25),
							dx: lerp(from.dx, to.dx, 0.25),
							dy: lerp(from.dy, to.dy, 0.25),
						},
						0.55,
						1.10
					),
				},
				{
					offset: 0.85,
					opacity: 0.74,
					transform: driftTransform({
							...from,
							x: lerp(from.x, to.x, 0.85),
							y: lerp(from.y, to.y, 0.85),
							s: lerp(from.s, to.s, 0.85),
							dx: lerp(from.dx, to.dx, 0.85),
							dy: lerp(from.dy, to.dy, 0.85),
						},
						0.9,
						1.07
					),
				},
				{
					opacity: 0.7,
					transform: driftTransform(to, 1.0, 1.03),
				},
			], {
				duration: dur,
				easing: "ease-in-out",
				fill: "forwards"
			}
		);


		// Crossfade gradients (this is the "morph into each other" part)
		const fadeOut = a0.animate([{
			opacity: 1
		}, {
			opacity: 0
		}], {
			duration: fadeDur,
			easing: "ease-in-out",
			fill: "forwards",
		});
		const fadeIn = a1.animate([{
			opacity: 0
		}, {
			opacity: 1
		}], {
			duration: fadeDur,
			easing: "ease-in-out",
			fill: "forwards",
		});

		handle.anims.push(parentAnim, fadeOut, fadeIn);

		parentAnim.finished
			.catch(() => {}) // canceled on stop/restart
			.then(() => {
				if (stopped) return;

				// Snap final styles so next cycle starts cleanly
				if (!cfg.animateBlur) el.style.filter = `blur(${to.blur}px)`;
				el.style.opacity = "0.7";
				el.style.transform = driftTransform(to, 1.0, 1.03);

				// Make the "to" layer the new active
				handle.activeIndex = 1 - handle.activeIndex;
				handle.spec = to;

				const nowActive = handle.layers[handle.activeIndex];
				const nowInactive = handle.layers[1 - handle.activeIndex];
				nowActive.style.opacity = "1";
				nowInactive.style.opacity = "0";

				// Small random pause keeps it organic without stacking
				later(randi(120, 420), () => animateOrb(handle, false));
			});
	}

	// Build a fixed pool (no more spawn/remove/layering)
	const handles = [];
	layer.textContent = "";

	const orbCount = Math.max(1, cfg.maxOrbs | 0);

	for (let i = 0; i < orbCount; i++) {
		const orb = document.createElement("div");
		orb.className = "bgOrb";
		orb.style.willChange = "transform, opacity";

		const layerA = document.createElement("div");
		layerA.className = "bgOrbLayer";
		layerA.style.willChange = "opacity";

		const layerB = document.createElement("div");
		layerB.className = "bgOrbLayer";
		layerB.style.willChange = "opacity";

		orb.appendChild(layerA);
		orb.appendChild(layerB);
		layer.appendChild(orb);

		const h = {
			el: orb,
			layers: [layerA, layerB],
			activeIndex: 0,
			spec: null,
			anims: [],
		};
		handles.push(h);

		// Seed initial look (instant)
		const init = makeSpec();
		h.spec = init;
		applyFinalGeometry(orb, init);
		setLayerColor(layerA, init);
		layerA.style.opacity = "1";
		layerB.style.opacity = "0";
		orb.style.opacity = "0"; // will fade in on first cycle
		orb.style.transform = driftTransform(init.dx, init.dy, 0.25, 0.95);
	}

	// Start with stagger (re-using cfg.spawnEveryMs)
	handles.forEach((h, i) => {
		later(i * cfg.spawnEveryMs, () => animateOrb(h, true));
	});

	function stop({
		removeLayer = false
	} = {}) {
		if (stopped) return;
		stopped = true;

		// Clear scheduled loops
		for (const id of timeouts) clearTimeout(id);
		timeouts.clear();

		// Cancel animations + clear DOM
		for (const h of handles) {
			h.anims.forEach((x) => {
				try {
					x.cancel();
				}
				catch {}
			});
			h.anims.length = 0;
		}

		if (layer) {
			layer.textContent = "";
			if (removeLayer) {
				layer.remove();
				layer = null;
			}
		}
	}

	__orbBgStop = null
	__orbBgRunning = false

	return {
		stop
	};
}

