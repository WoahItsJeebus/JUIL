export function autoMarkActiveTab(key){
	document.querySelectorAll(".tabBtn").forEach(el=>{
		el.classList.toggle("active", el.dataset.tab===key);
	});
}