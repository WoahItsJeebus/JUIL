function domainFromUrl(u) {
	try {
		return new URL(u).hostname.replace(/^www\./, "");
	}
	catch {
		return "";
	}
}

function faviconFor(url) {
	const dom = domainFromUrl(url);
	if (!dom) return "";
	return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(dom)}&sz=64`;
}

/**
 * @param {Array<{label?:string,url:string,icon?:string}>} links
 * @param {string} hostId
 */
export function renderPlatformLinks(links, hostId = "platformLinks") {
	const host = document.getElementById(hostId);
	if (!host) return;

	host.textContent = "";

	for (const item of (links || [])) {
		if (!item || !item.url) continue;

		const a = document.createElement("a");
		a.className = "platformLink";
		a.href = item.url;
		a.target = "_blank";
		a.rel = "noopener noreferrer";

		const img = document.createElement("img");
		img.className = "platformIcon";
		img.alt = "";
		img.src = item.icon || faviconFor(item.url);

		const span = document.createElement("span");
		span.textContent = item.label || domainFromUrl(item.url) || item.url;

		a.appendChild(img);
		a.appendChild(span);
		host.appendChild(a);
	}
}

