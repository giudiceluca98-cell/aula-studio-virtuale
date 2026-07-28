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
  let frameId=0;
  let resizeFrameId=0;
  let running=false;
  let lastPaintAt=0;
  let mode=localStorage.getItem("eve-graphics-performance")==="complete"?"complete":"optimized";

  function settings(){
    return mode==="complete"
      ? {maxDpr:2,maxParticles:92,minParticles:34,frameInterval:0,connections:true,shadowBlur:10}
      : {maxDpr:1.25,maxParticles:52,minParticles:26,frameInterval:1000/30,connections:false,shadowBlur:5};
  }

  function resize(){
    const config=settings();
    dpr=Math.min(window.devicePixelRatio||1,config.maxDpr);
    width=window.innerWidth;
    height=window.innerHeight;
    canvas.width=Math.floor(width*dpr);
    canvas.height=Math.floor(height*dpr);
    canvas.style.width=`${width}px`;
    canvas.style.height=`${height}px`;
    ctx.setTransform(dpr,0,0,dpr,0,0);

    const count=Math.max(config.minParticles,Math.min(config.maxParticles,Math.round(width*height/22000)));
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

  function paint(updateParticles){
    ctx.clearRect(0,0,width,height);
    const config=settings();
    const connectionDistance=105;
    const connectionDistanceSquared=connectionDistance*connectionDistance;

    for(let index=0;index<particles.length;index+=1){
      const particle=particles[index];
      if(updateParticles){
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
      ctx.shadowBlur=config.shadowBlur;
      ctx.arc(particle.x,particle.y,particle.radius,0,Math.PI*2);
      ctx.fill();
      ctx.shadowBlur=0;

      for(let targetIndex=index+1;config.connections&&targetIndex<particles.length;targetIndex+=1){
        const target=particles[targetIndex];
        const deltaX=particle.x-target.x;
        const deltaY=particle.y-target.y;
        const distanceSquared=deltaX*deltaX+deltaY*deltaY;
        if(distanceSquared<connectionDistanceSquared){
          const distance=Math.sqrt(distanceSquared);
          ctx.beginPath();
          ctx.strokeStyle=`rgba(0,223,242,${(1-distance/connectionDistance)*.045})`;
          ctx.lineWidth=.6;
          ctx.moveTo(particle.x,particle.y);
          ctx.lineTo(target.x,target.y);
          ctx.stroke();
        }
      }
    }
  }

  function draw(timestamp){
    frameId=0;
    if(!running||document.hidden||!document.hasFocus())return;
    const interval=settings().frameInterval;
    if(interval&&timestamp-lastPaintAt<interval){
      frameId=requestAnimationFrame(draw);
      return;
    }
    lastPaintAt=timestamp;
    paint(true);
    frameId=requestAnimationFrame(draw);
  }

  function start(){
    if(reduceMotion||running||document.hidden||!document.hasFocus())return;
    running=true;
    canvas.dataset.graphicsRunning="true";
    if(!frameId)frameId=requestAnimationFrame(draw);
  }

  function stop(){
    running=false;
    canvas.dataset.graphicsRunning="false";
    if(frameId){
      cancelAnimationFrame(frameId);
      frameId=0;
    }
  }

  function scheduleResize(){
    if(resizeFrameId)return;
    resizeFrameId=requestAnimationFrame(()=>{
      resizeFrameId=0;
      resize();
      if(reduceMotion||!running)paint(false);
    });
  }

  function syncVisibility(){
    document.body.classList.toggle("graphics-page-hidden",document.hidden);
    if(document.hidden)stop();
    else start();
  }

  function syncFocus(){
    if(document.hasFocus())start();
    else stop();
  }

  function syncMode(event){
    mode=event.detail?.mode==="complete"?"complete":"optimized";
    resize();
    paint(false);
  }

  resize();
  paint(false);
  canvas.dataset.graphicsRunning="false";
  start();
  window.addEventListener("resize",scheduleResize,{passive:true});
  document.addEventListener("visibilitychange",syncVisibility,{passive:true});
  window.addEventListener("focus",syncFocus,{passive:true});
  window.addEventListener("blur",syncFocus,{passive:true});
  window.addEventListener("eve:graphics-performance-change",syncMode);

  window.EveGraphicsPerformance=Object.assign(window.EveGraphicsPerformance||{},{
    particleField:{
      isRunning:()=>running,
      particleCount:()=>particles.length
    }
  });
}

startParticleField();
