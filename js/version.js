export let _VERSION = "1.0.0.1";

async function loadVersion() {
	try {
		let url;

		// If running locally (VSCode preview / file://)
		if (location.protocol === "file:") {
			url = "./assets/versions.json";
		}
		else {
			// Resolve relative to the module itself
			url = new URL("../assets/versions.json", import.meta.url);
		}

		const res = await fetch(url);
		if (!res.ok) return;

		const data = await res.json();
		if (typeof data.current === "string") {
			_VERSION = data.current;
		}
	}
	catch {}
}

await loadVersion();
console.log(`Version: ${_VERSION}`);