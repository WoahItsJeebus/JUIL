export function hardReload() {
	// Force a re-request by changing the URL query.
	// Works better than location.reload(true) (deprecated) and helps iOS PWA caching.
	const url = new URL(location.href);
	url.searchParams.set("_r", String(Date.now()));
	location.replace(url.toString());
}
