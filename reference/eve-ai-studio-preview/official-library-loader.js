(async()=>{
  if(typeof DecompressionStream!=="function"){
    throw new Error("Browser non compatibile con DecompressionStream. Usa Chrome o Microsoft Edge aggiornato.");
  }
  const encoded=window.__EVE_OFFICIAL_WORKFLOW_GZIP_B64||"";
  if(!encoded) throw new Error("Workflow ufficiale Eve assente.");
  const bytes=Uint8Array.from(atob(encoded),character=>character.charCodeAt(0));
  const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
  const source=await new Response(stream).text();
  (0,eval)(source);
})().catch(error=>{
  console.error(error);
  const loader=document.getElementById("loader");
  if(loader) loader.innerHTML=`<h1>Anteprima Eve non caricata</h1><p>${error.message}</p>`;
});
