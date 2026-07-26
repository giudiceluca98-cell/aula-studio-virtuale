(()=>{
  const RUNTIME_VERSION="1.2.2";
  const SOURCE_BUNDLE="eve-animation-library-v1.2.2.zip";
  const IDLE_ASSET="assets/eve/eve-idle-soft-runtime.webp";
  const reduceMotion=window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches===true;
  const stage=document.querySelector(".eve-orb-stage");
  const pill=document.querySelector(".eve-meta .pill");
  const description=document.querySelector(".eve-meta p");

  window.EveAvatarRuntime={
    version:RUNTIME_VERSION,
    sourceBundle:SOURCE_BUNDLE,
    integratedState:"eve-idle-soft",
    fullLibraryStates:64,
    acceptedLocalizationException:true,
    reducedMotion:reduceMotion
  };

  if(!stage){
    console.warn("Eve avatar runtime: contenitore .eve-orb-stage non trovato.");
    return;
  }

  if(reduceMotion){
    if(pill) pill.lastChild.textContent=" Riduzione movimento";
    console.info("Eve avatar runtime: mantenuto il ritratto statico per prefers-reduced-motion.");
    return;
  }

  const image=new Image();
  image.className="eve-portrait eve-portrait-runtime";
  image.alt="Eve, avatar animato approvato della libreria 1.2.2";
  image.decoding="async";
  image.src=IDLE_ASSET;

  const style=document.createElement("style");
  style.textContent=`
    .eve-portrait-runtime{object-fit:contain;object-position:center;filter:drop-shadow(0 0 22px rgba(0,223,242,.22));transform:translateZ(0)}
    .eve-orb-stage[data-eve-runtime="1.2.2"]::after{content:"v1.2.2";position:absolute;right:10px;bottom:8px;padding:3px 7px;border:1px solid rgba(125,235,255,.18);border-radius:999px;background:rgba(2,11,18,.62);color:#8df7ff;font:700 9px/1.2 Inter,system-ui,sans-serif;letter-spacing:.08em;pointer-events:none}
  `;
  document.head.appendChild(style);

  image.addEventListener("load",()=>{
    stage.replaceChildren(image);
    stage.dataset.eveRuntime=RUNTIME_VERSION;
    if(pill) pill.lastChild.textContent=" Avatar approvato";
    if(description) description.textContent="Avatar reale della libreria Eve 1.2.2. Stato runtime integrato: idle soft.";
    console.info("Eve avatar runtime 1.2.2 attivo: eve-idle-soft.");
  },{once:true});

  image.addEventListener("error",()=>{
    console.error(`Eve avatar runtime: asset non disponibile (${IDLE_ASSET}).`);
  },{once:true});
})();
