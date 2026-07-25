const dashboardStatus=document.querySelector("#dashboard .panel.span-8 .panel-head");
if(dashboardStatus){
  const title=dashboardStatus.querySelector("h3");
  const description=dashboardStatus.querySelector("p");
  if(title)title.textContent="Stato della versione Eve 0.4-preview";
  if(description)description.textContent="Prompt versionati, modalità didattiche e workflow di approvazione.";
}
const publishTitle=document.querySelector("#publish .panel.span-5 .panel-head h3");
if(publishTitle)publishTitle.textContent="Pubblica Eve 0.4-preview";
