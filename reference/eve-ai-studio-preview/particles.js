function startParticleField(){
  const canvas=document.getElementById("particleField");
  if(!canvas)return;
  const ctx=canvas.getContext("2d",{alpha:true});
  if(!ctx)return;

  const reduceMotion=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const palette=[[0,223,242],[141,247,255],[122,124,255],[255,138,61]];
  let width=0;
  let height=0;
  let dpr=1;
  let particles=[];

  function resize(){
    dpr=Math.min(window.devicePixelRatio||1,2);
    width=window.innerWidth;
    height=window.innerHeight;
    canvas.width=Math.floor(width*dpr);
    canvas.height=Math.floor(height*dpr);
    canvas.style.width=`${width}px`;
    canvas.style.height=`${height}px`;
    ctx.setTransform(dpr,0,0,dpr,0,0);

    const count=Math.max(34,Math.min(92,Math.round(width*height/18000)));
    particles=Array.from({length:count},(_,index)=>({
      x:Math.random()*width,
      y:Math.random()*height,
      vx:(Math.random()-.5)*.16,
      vy:(Math.random()-.5)*.13,
      radius:Math.random()*1.55+.45,
      alpha:Math.random()*.52+.18,
      color:palette[index%palette.length],
      pulse:Math.random()*Math.PI*2
    }));
  }

  function draw(){
    ctx.clearRect(0,0,width,height);

    for(let index=0;index<particles.length;index+=1){
      const particle=particles[index];
      if(!reduceMotion){
        particle.x+=particle.vx;
        particle.y+=particle.vy;
        particle.pulse+=.008;
        if(particle.x<-10)particle.x=width+10;
        if(particle.x>width+10)particle.x=-10;
        if(particle.y<-10)particle.y=height+10;
        if(particle.y>height+10)particle.y=-10;
      }

      const [red,green,blue]=particle.color;
      const alpha=particle.alpha*(.72+.28*Math.sin(particle.pulse));
      ctx.beginPath();
      ctx.fillStyle=`rgba(${red},${green},${blue},${alpha})`;
      ctx.shadowColor=`rgba(${red},${green},${blue},.75)`;
      ctx.shadowBlur=10;
      ctx.arc(particle.x,particle.y,particle.radius,0,Math.PI*2);
      ctx.fill();
      ctx.shadowBlur=0;

      for(let targetIndex=index+1;targetIndex<particles.length;targetIndex+=1){
        const target=particles[targetIndex];
        const distance=Math.hypot(particle.x-target.x,particle.y-target.y);
        if(distance<105){
          ctx.beginPath();
          ctx.strokeStyle=`rgba(0,223,242,${(1-distance/105)*.045})`;
          ctx.lineWidth=.6;
          ctx.moveTo(particle.x,particle.y);
          ctx.lineTo(target.x,target.y);
          ctx.stroke();
        }
      }
    }

    if(!reduceMotion)requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener("resize",resize,{passive:true});
  draw();
}

startParticleField();
