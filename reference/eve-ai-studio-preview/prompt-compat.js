for(const id of ["savePrompt","restorePrompt"]){
  if(!document.getElementById(id)){
    const button=document.createElement("button");
    button.id=id;
    button.hidden=true;
    button.type="button";
    document.body.appendChild(button);
  }
}
