export function startOrbBackground(){
	// simplified placeholder (real logic can be swapped in later)
	if(document.querySelector(".bgOrbs")) return;
	const el=document.createElement("div");
	el.className="bgOrbs";
	document.body.prepend(el);
}