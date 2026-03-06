
export function initTabs(){

  const buttons = document.querySelectorAll(".tabBtn")

  buttons.forEach(btn=>{
    btn.addEventListener("click",()=>{

      document.querySelectorAll(".tabBtn").forEach(b=>b.classList.remove("active"))
      btn.classList.add("active")

    })
  })

}
