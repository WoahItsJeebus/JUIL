
export function startOrbBackground(opts = {}){

  const cfg = {
    maxOrbs: 4,
    sizeMin: 240,
    sizeMax: 480,
    ...opts
  }

  const container = document.createElement("div")
  container.className = "bgOrbs"
  Object.assign(container.style,{
    position:"fixed",
    inset:"0",
    overflow:"hidden",
    zIndex:"-1",
    pointerEvents:"none"
  })

  document.body.prepend(container)

  for(let i=0;i<cfg.maxOrbs;i++){

    const orb = document.createElement("div")

    const size = Math.random()*(cfg.sizeMax-cfg.sizeMin)+cfg.sizeMin

    Object.assign(orb.style,{
      position:"absolute",
      width:size+"px",
      height:size+"px",
      borderRadius:"50%",
      filter:"blur(18px)",
      background:"radial-gradient(circle at 30% 30%, rgba(120,170,255,.5), transparent 70%)",
      opacity:.6,
      transform:`translate(${Math.random()*window.innerWidth}px,${Math.random()*window.innerHeight}px)`,
      transition:"transform 20s linear"
    })

    container.appendChild(orb)

    setInterval(()=>{
      orb.style.transform=`translate(${Math.random()*window.innerWidth}px,${Math.random()*window.innerHeight}px)`
    },20000)
  }
}
