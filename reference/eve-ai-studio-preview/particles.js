function startParticleField(){
  const canvas=document.getElementById("particleField");
  if(!canvas)return;
  const ctx=canvas.getContext("2d",{alpha:true,desynchronized:true});
  if(!ctx)return;

  const reduceMotion=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const lowPower=(navigator.hardwareConcurrency||4)<=4||(navigator.deviceMemory||4)<=4;
  const palette=[[0,223,242],[141,247,255],[122,124,255],[255,138,61]];
  let width=0,height=0,dpr=1,particles=[],frameId=0,resizeFrameId=0,running=false,lastPaintAt=0;
  let mode=localStorage.getItem("eve-graphics-performance")==="complete"?"complete":"optimized";

  function settings(){
    if(mode==="complete")return {maxDpr:1.5,maxParticles:58,minParticles:24,frameInterval:1000/30,connections:true,shadowBlur:5};
    return lowPower
      ? {maxDpr:1,maxParticles:14,minParticles:8,frameInterval:1000/15,connections:false,shadowBlur:0}
      : {maxDpr:1,maxParticles:24,minParticles:12,frameInterval:1000/20,connections:false,shadowBlur:0};
  }

  function resize(){
    const config=settings();
    dpr=Math.min(window.devicePixelRatio||1,config.maxDpr);
    width=window.innerWidth;height=window.innerHeight;
    canvas.width=Math.max(1,Math.floor(width*dpr));canvas.height=Math.max(1,Math.floor(height*dpr));
    canvas.style.width=`${width}px`;canvas.style.height=`${height}px`;
    ctx.setTransform(dpr,0,0,dpr,0,0);
    const divisor=lowPower?90000:60000;
    const count=Math.max(config.minParticles,Math.min(config.maxParticles,Math.round(width*height/divisor)));
    particles=Array.from({length:count},(_,index)=>({x:Math.random()*width,y:Math.random()*height,vx:(Math.random()-.5)*.12,vy:(Math.random()-.5)*.1,radius:Math.random()*1.25+.35,alpha:Math.random()*.42+.14,color:palette[index%palette.length],pulse:Math.random()*Math.PI*2}));
  }

  function paint(updateParticles){
    ctx.clearRect(0,0,width,height);const config=settings();const maxDistance2=100*100;
    for(let index=0;index<particles.length;index+=1){
      const p=particles[index];
      if(updateParticles){p.x+=p.vx;p.y+=p.vy;p.pulse+=.006;if(p.x<-8)p.x=width+8;if(p.x>width+8)p.x=-8;if(p.y<-8)p.y=height+8;if(p.y>height+8)p.y=-8;}
      const [r,g,b]=p.color;const alpha=p.alpha*(.78+.22*Math.sin(p.pulse));
      ctx.beginPath();ctx.fillStyle=`rgba(${r},${g},${b},${alpha})`;ctx.arc(p.x,p.y,p.radius,0,Math.PI*2);ctx.fill();
      if(config.connections){for(let j=index+1;j<particles.length;j+=1){const q=particles[j],dx=p.x-q.x,dy=p.y-q.y,d2=dx*dx+dy*dy;if(d2<maxDistance2){ctx.beginPath();ctx.strokeStyle=`rgba(0,223,242,${(1-Math.sqrt(d2)/100)*.03})`;ctx.lineWidth=.5;ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();}}}
    }
  }

  function draw(timestamp){frameId=0;if(!running||document.hidden||!document.hasFocus())return;const interval=settings().frameInterval;if(timestamp-lastPaintAt<interval){frameId=requestAnimationFrame(draw);return;}lastPaintAt=timestamp;paint(true);frameId=requestAnimationFrame(draw);}
  function start(){if(reduceMotion||running||document.hidden||!document.hasFocus())return;running=true;canvas.dataset.graphicsRunning="true";if(!frameId)frameId=requestAnimationFrame(draw);}
  function stop(){running=false;canvas.dataset.graphicsRunning="false";if(frameId){cancelAnimationFrame(frameId);frameId=0;}}
  function scheduleResize(){if(resizeFrameId)return;resizeFrameId=requestAnimationFrame(()=>{resizeFrameId=0;resize();if(reduceMotion||!running)paint(false);});}
  function syncVisibility(){document.body.classList.toggle("graphics-page-hidden",document.hidden);if(document.hidden)stop();else start();}
  function syncFocus(){if(document.hasFocus())start();else stop();}
  function syncMode(event){mode=event.detail?.mode==="complete"?"complete":"optimized";resize();paint(false);}

  resize();paint(false);canvas.dataset.graphicsRunning="false";start();
  window.addEventListener("resize",scheduleResize,{passive:true});document.addEventListener("visibilitychange",syncVisibility,{passive:true});window.addEventListener("focus",syncFocus,{passive:true});window.addEventListener("blur",syncFocus,{passive:true});window.addEventListener("eve:graphics-performance-change",syncMode);
  window.EveGraphicsPerformance=Object.assign(window.EveGraphicsPerformance||{},{particleField:{isRunning:()=>running,particleCount:()=>particles.length,lowPower}});
}
startParticleField();
