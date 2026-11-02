'use strict';
const cv=document.getElementById('c'),g=cv.getContext('2d'),W=320,H=180,HOR=62,CAM=3,D=110,RW=60;
g.imageSmoothingEnabled=false;
function fit(){const s=Math.max(1,Math.min(innerWidth/W,innerHeight/H));cv.style.width=W*s+'px';cv.style.height=H*s+'px'}
addEventListener('resize',fit);fit();
// ---------- audio ----------
let AC=null;function au(){if(!AC){try{AC=new(window.AudioContext||window.webkitAudioContext)()}catch(e){}}if(AC&&AC.state==='suspended')AC.resume()}
function tone(f,d,type='square',v=.08,slide=0){if(!AC)return;const o=AC.createOscillator(),gn=AC.createGain(),t=AC.currentTime;o.type=type;o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,f+slide),t+d);gn.gain.setValueAtTime(v,t);gn.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(gn).connect(AC.destination);o.start(t);o.stop(t+d)}
function noise(d,v=.15){if(!AC)return;const b=AC.createBuffer(1,AC.sampleRate*d,AC.sampleRate),a=b.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=(Math.random()*2-1)*(1-i/a.length);const s=AC.createBufferSource(),gn=AC.createGain();gn.gain.value=v;s.buffer=b;s.connect(gn).connect(AC.destination);s.start()}
const SFX={laser:()=>tone(880,.08,'square',.05,-500),boom:()=>{noise(.35,.2);tone(120,.3,'sawtooth',.08,-80)},flip:()=>tone(330,.15,'triangle',.08,500),combo:()=>{[523,659,784,1047].forEach((f,i)=>setTimeout(()=>tone(f,.1),i*60))},hurt:()=>{tone(200,.25,'sawtooth',.1,-150);noise(.2,.1)},rescue:()=>{[784,988,1175].forEach((f,i)=>setTimeout(()=>tone(f,.12,'triangle'),i*80))},mode:()=>tone(440,.12,'square',.05,300),start:()=>{[262,330,392,523,392,523].forEach((f,i)=>setTimeout(()=>tone(f,.12),i*90))}};
let musT=0,musI=0;const BASS=[110,110,131,98,110,110,147,131],LEAD=[440,0,523,0,494,440,392,0,440,0,659,587,523,0,494,0];
function music(dt){if(!AC||state!=='play')return;musT-=dt;if(musT<=0){musT=.16;tone(BASS[(musI>>1)%8],.14,'triangle',.06);const l=LEAD[musI%16];if(l)tone(l,.1,'square',.025);musI++}}
// ---------- input ----------
const K={};const map={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',ArrowUp:'up',KeyW:'up',ArrowDown:'down',KeyS:'down',Space:'fire',KeyB:'boost',ShiftLeft:'boost',ShiftRight:'boost',KeyZ:'flip',KeyX:'roll',KeyQ:'bflip',KeyE:'spin',Digit2:'flip',Digit3:'roll',Digit4:'bflip',Digit5:'spin',KeyC:'mode',KeyV:'crt',Enter:'start',KeyP:'pause'};
const pressed={};
addEventListener('keydown',e=>{const k=map[e.code];if(k){e.preventDefault();if(!K[k])pressed[k]=1;K[k]=1}au()});
addEventListener('keyup',e=>{const k=map[e.code];if(k)K[k]=0});
if('ontouchstart'in window||navigator.maxTouchPoints>0){const t=document.getElementById('touch');t.style.display='block';t.querySelectorAll('button').forEach(b=>{const k=b.dataset.k;b.addEventListener('touchstart',e=>{e.preventDefault();au();pressed[k]=1;K[k]=1;pressed.start=1},{passive:false});b.addEventListener('touchend',e=>{e.preventDefault();K[k]=0},{passive:false})})}
cv.addEventListener('pointerdown',()=>{au();pressed.start=1});
// ---------- state ----------
let state='title',P,objs,shots,parts,popups,t=0,dist,spawnT,score,hi=+(localStorage.rrHi||0),shake=0;
function reset(){P={x:0,alt:0,vy:0,fly:false,hp:100,boost:100,spd:1,flip:0,roll:0,bflip:0,spin:0,stunt:0,inv:0,combo:0,comboT:0,overs:{},cool:0};objs=[];shots=[];parts=[];popups=[];dist=0;spawnT=0;score=0;
  for(let z=4;z<60;z+=3)spawnBuild(z)}
reset();
const OB={truck:{w:.55,h:1.1,len:2.5,pts:300},car:{w:.35,h:.5,len:1,pts:100},dumpster:{w:.3,h:.45,len:.8,pts:100},barrier:{w:.5,h:.35,len:.3,pts:80},billboard:{w:.6,h:1.6,len:.2,pts:250,gap:1}};
function spawnBuild(z){for(const s of[-1,1])objs.push({t:'bld',x:s*(2.4+Math.random()*1.5),z,alt:0,h:3+Math.random()*5,w:.8+Math.random()*.6,hue:[300,190,50,270][Math.random()*4|0],seed:Math.random()*99})}
function spawn(){const r=Math.random(),x=(Math.random()*2-1)*1.1;
  if(r<.55){const ks=['truck','car','car','dumpster','barrier','billboard'];const k=ks[Math.random()*ks.length|0];objs.push({t:'ob',k,...OB[k],x:k==='billboard'?0:x,z:60,alt:0,id:Math.random(),vz:k==='car'||k==='truck'?.35:0,col:['#3af','#fd3','#3f8','#f6c'][Math.random()*4|0]})}
  else if(r<.72)objs.push({t:'crook',x,z:60,alt:0,w:.35,h:.5,hp:3,vz:.6,wob:Math.random()*6,pts:500});
  else if(r<.88)objs.push({t:'drone',x,z:60,alt:1+Math.random()*1.8,w:.3,h:.3,hp:2,fire:2+Math.random()*2,wob:Math.random()*6,pts:400});
  else objs.push({t:'civ',x:(Math.random()<.5?-1:1)*(1.6+Math.random()*.3),z:60,alt:1.5+Math.random()*1.5,w:.4,h:.4,pts:1000})}
function proj(x,alt,z){const zc=z+CAM;if(zc<.3)return null;const s=D/zc;return{x:W/2+(x-P.x*.6)*s*RW/D*1.6,y:HOR+(camAlt()-alt)*s*RW/D*1.6,s:s*RW/D*1.6}}
function camAlt(){return 1.6+P.alt*.9}
function addParts(x,y,n,c){for(let i=0;i<n;i++)parts.push({x,y,vx:(Math.random()-.5)*3,vy:(Math.random()-.5)*3-1,l:20+Math.random()*20,c})}
function pop(txt,c='#ff0'){popups.push({txt,c,l:60})}
function hurt(n){if(P.inv>0)return;P.hp-=n;P.inv=60;shake=10;SFX.hurt();P.combo=0;if(P.hp<=0){P.hp=0;state='over';if(score>hi){hi=score|0;localStorage.rrHi=hi}SFX.boom()}}
// ---------- update ----------
function update(dt){t++;
  if(pressed.crt)document.getElementById('crt').classList.toggle('off');
  if(state!=='play'){if(pressed.start||pressed.fire){reset();state='play';SFX.start()}clearP();return}
  if(pressed.pause){state='pause';clearP();return}
  music(dt);
  if(pressed.mode){P.fly=!P.fly;SFX.mode();if(P.fly)P.vy=.08}
  const boosting=K.boost&&P.boost>0;P.boost=Math.max(0,Math.min(100,P.boost+(boosting?-.8:.25)));
  P.spd+=((boosting?2:1)-P.spd)*.08;
  const sp=.22*P.spd;dist+=sp;score+=sp*2;
  const tpx=window.TP?TP.ax:0,tpy=window.TP?TP.ay:0;P.x+=Math.max(-1,Math.min(1,(K.right?1:0)-(K.left?1:0)+tpx))*.045;P.x=Math.max(-1.6,Math.min(1.6,P.x));
  if(P.fly){const tgt=P.alt+Math.max(-1,Math.min(1,(K.up?1:0)-(K.down?1:0)-tpy))*.06;P.alt=Math.max(.4,Math.min(3.2,tgt));P.vy=0}
  else{if((pressed.up||tpy<-.5)&&P.alt<=0){P.vy=.13;tone(200,.1,'square',.05,300)}P.vy-=.006;P.alt+=P.vy;
    if(P.alt<=0){if(P.vy<-.02&&(P.flip>0||P.roll>0||P.bflip>0)){hurt(25);pop('BAD LANDING!','#f44');P.flip=P.roll=P.bflip=0}P.spin=0;P.alt=0;P.vy=0}}
  const air=P.alt>.15;
  if(pressed.flip&&air&&P.flip<=0){P.flip=1;P.stunt++;SFX.flip()}
  if(pressed.roll&&air&&P.roll<=0){P.roll=1;P.stunt++;SFX.flip()}
  if(pressed.bflip&&air&&P.bflip<=0){P.bflip=1;P.stunt++;P.vy=Math.max(P.vy,.06);SFX.flip();pop('BACKFLIP!','#ff0')}
  if(pressed.spin&&air&&P.spin<=0){P.spin=1;P.stunt++;SFX.flip();pop('360!','#0ff')}
  if(P.bflip>0)P.bflip=Math.max(0,P.bflip-.028);if(P.spin>0)P.spin=Math.max(0,P.spin-.045);
  if(P.flip>0)P.flip-=.04;if(P.roll>0)P.roll-=.035;if(P.flip<0)P.flip=0;if(P.roll<0)P.roll=0;
  if(P.comboT>0&&--P.comboT==0)P.combo=0;if(P.inv>0)P.inv--;
  if(P.cool>0)P.cool--;if(K.fire&&P.cool<=0){P.cool=7;shots.push({x:P.x-.15,alt:P.alt+.2,z:.5,me:1},{x:P.x+.15,alt:P.alt+.2,z:.5,me:1});SFX.laser()}
  if(--spawnT<=0){spawn();spawnT=(28+Math.random()*30)/P.spd}
  if(Math.random()<sp/3)spawnBuild(60);
  for(const o of objs){o.z-=sp-(o.vz||0)*.22;
    if(o.t==='crook'){o.wob+=.05;o.x+=Math.sin(o.wob)*.012;o.vz=Math.max(.2,.6-dist%1*0)}
    if(o.t==='drone'){o.wob+=.06;o.x+=Math.sin(o.wob)*.015;o.z-=.0;if(o.z<25)o.z+=sp*.8;if((o.fire-=dt)<=0&&o.z<40){o.fire=1.5+Math.random()*1.5;shots.push({x:o.x,alt:o.alt,z:o.z,me:0,dx:(P.x-o.x)/o.z*.25,da:(P.alt-o.alt)/o.z*.25});tone(300,.1,'sawtooth',.04,-100)}o.life=(o.life||0)+dt;if(o.life>14)o.z-=.6}
    // collision with player
    if(o.t==='ob'&&Math.abs(o.z)<o.len/2+.3&&Math.abs(o.x-P.x)<o.w+.25){
      const under=o.gap&&P.alt<.3;const over=P.alt>o.h;
      if(!over&&!under&&!o.hit){o.hit=1;hurt(20);addParts(W/2,140,15,'#f80')}
      if(over&&!o.cleared){o.cleared=1;if(P.flip>0||P.roll>0||P.bflip>0||P.spin>0||P.stuntOver){P.combo++;P.comboT=150;const nst=(P.flip>0)+(P.roll>0)+(P.bflip>0)+(P.spin>0);const pts=o.pts*P.combo*(nst>1?nst:1)*(P.bflip>0?1.5:1);score+=pts;pop(`${o.k.toUpperCase()} TRICK x${P.combo}  +${pts}`);SFX.combo()}else{score+=o.pts/4|0;pop('CLEAR +'+(o.pts/4|0),'#8ff')}}}
    if((o.t==='crook'||o.t==='drone')&&Math.abs(o.z)<.6&&Math.abs(o.x-P.x)<.45&&Math.abs(o.alt-P.alt)<.5&&!o.hit){o.hit=1;hurt(15)}
    if(o.t==='civ'&&!o.saved&&Math.abs(o.z)<1.2&&Math.abs(o.x-P.x)<.8&&Math.abs(o.alt-P.alt)<1){o.saved=1;score+=1000;P.hp=Math.min(100,P.hp+10);pop('CIVILIAN RESCUED +1000','#3f8');SFX.rescue()}}
  for(const s of shots){if(s.me){s.z+=1.2;for(const o of objs)if((o.t==='crook'||o.t==='drone'||o.t==='ob')&&!o.dead&&Math.abs(o.z-s.z)<1&&Math.abs(o.x-s.x)<o.w+.1&&s.alt>o.alt-.1&&s.alt<o.alt+o.h+.2){s.dead=1;if(o.hp){o.hp--;o.flash=4;if(o.hp<=0){o.dead=1;score+=o.pts;const p=proj(o.x,o.alt,o.z);if(p)addParts(p.x,p.y,25,'#ff0');pop((o.t==='crook'?'CROOK BUSTED':'DRONE DOWN')+' +'+o.pts,'#f0f');SFX.boom();shake=5}}break}if(s.z>60)s.dead=1}
    else{s.z-=.5+sp;s.x+=s.dx;s.alt+=s.da;if(Math.abs(s.z)<.5&&Math.abs(s.x-P.x)<.35&&Math.abs(s.alt-P.alt)<.4){s.dead=1;hurt(10)}if(s.z<-2)s.dead=1}}
  for(const o of objs)if(o.t==='civ'&&o.z<-1&&!o.saved&&!o.missed){o.missed=1;pop('CIVILIAN MISSED','#f88')}
  objs=objs.filter(o=>!o.dead&&o.z>-CAM+.4);shots=shots.filter(s=>!s.dead);
  parts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.08;p.l--});parts=parts.filter(p=>p.l>0);popups.forEach(p=>p.l--);popups=popups.filter(p=>p.l>0);
  if(shake>0)shake--;clearP()}
function clearP(){for(const k in pressed)delete pressed[k]}
// ---------- render ----------
const sky=g.createLinearGradient(0,0,0,HOR);sky.addColorStop(0,'#05001a');sky.addColorStop(.7,'#3a0a5a');sky.addColorStop(1,'#ff3a8a');
const stars=[...Array(40)].map(()=>[Math.random()*W,Math.random()*HOR*.8]);
const skyline=[...Array(40)].map((_,i)=>[i*9,10+Math.random()*28,Math.random()]);
function rect(x,y,w,h,c){g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))}
function drawGround(){const off=dist;
  for(let y=HOR+1;y<H;y++){const dy=y-HOR,z=camAlt()*96/dy-CAM;const zz=z+off;const s=D/(z+CAM)*RW/D*1.6;const cx=W/2-P.x*.6*s;const rw=1.35*s;const st=(zz*1.2|0)&1;
    rect(0,y,W,1,st?'#140828':'#1c0c34');rect(cx-rw,y,rw*2,1,st?'#2a2a3a':'#323244');
    rect(cx-rw-s*.12,y,s*.12,1,st?'#ff2a9a':'#fff');rect(cx+rw,y,s*.12,1,st?'#ff2a9a':'#fff');
    if(((zz*.6)|0)&1)for(const l of[-.45,.45])rect(cx+l*s-s*.02,y,Math.max(1,s*.04),1,'#ffd23a');
    if(st){rect(cx-rw-s*1.2,y,1,1,'#0ff');rect(cx+rw+s*1.2,y,1,1,'#0ff')}}}
function drawBg(){g.fillStyle=sky;g.fillRect(0,0,W,HOR);for(const[x,y]of stars)if((t>>4^x)&1||1)rect(x,y,1,1,'#88a');
  g.fillStyle='#ff6ab0';g.beginPath();g.arc(W/2,HOR-6,22,Math.PI,0);g.fill();for(let i=0;i<5;i++)rect(W/2-22,HOR-26+i*5+i,44,1+i*.4,'#3a0a5a');
  const px=-P.x*8;for(const[x,h,r]of skyline){const xx=((x+px)%360+360)%360-20;rect(xx,HOR-h,8,h,'#120428');if(r>.5)for(let wy=HOR-h+3;wy<HOR-2;wy+=4)rect(xx+2,wy,1,1,r>.8?'#ff0':'#0ff')}}
function drawBld(o,p){const w=o.w*p.s,h=o.h*p.s;const x=p.x-w/2,y=p.y-h;rect(x,y,w,h,`hsl(${o.hue},60%,${8}%)`);rect(x,y,w,Math.max(1,p.s*.05),`hsl(${o.hue},100%,60%)`);
  if(p.s>6){const step=Math.max(2,p.s*.25);let i=0;for(let wy=y+step;wy<p.y-step;wy+=step)for(let wx=x+step*.5;wx<x+w-step*.5;wx+=step){i++;if((i*7+o.seed|0)%3)rect(wx,wy,Math.max(1,step*.4),Math.max(1,step*.4),`hsl(${o.hue},90%,${(i*13+o.seed|0)%2?65:35}%)`)}}
  if(p.s>12&&o.seed>60){rect(x+w*.1,y+h*.15,w*.8,p.s*.4,'#000');g.fillStyle=`hsl(${o.hue+120},100%,60%)`;g.font=`${Math.max(5,p.s*.3|0)}px monospace`;g.fillText(['NEON','24H','RAMEN','ARCADE'][o.seed%4|0],x+w*.15,y+h*.15+p.s*.32)}}
function drawOb(o,p){const s=p.s,w=o.w*2*s,h=o.h*s,x=p.x-w/2,y=p.y-h;
  if(o.k==='truck'){rect(x,y,w,h*.8,'#ddd');rect(x,y,w,2,o.col);g.fillStyle='#333';g.font=`${Math.max(4,s*.25|0)}px monospace`;if(s>10)g.fillText('FREIGHT',x+w*.15,y+h*.45);rect(x+w*.05,y+h*.8,w*.15,h*.2,'#111');rect(x+w*.8,y+h*.8,w*.15,h*.2,'#111');rect(x,y+h*.7,w*.1,h*.08,'#f22');rect(x+w*.9,y+h*.7,w*.1,h*.08,'#f22')}
  else if(o.k==='car'){rect(x,y+h*.35,w,h*.5,o.col);rect(x+w*.2,y,w*.6,h*.4,'#225');rect(x+w*.05,y+h*.5,w*.15,h*.12,'#f22');rect(x+w*.8,y+h*.5,w*.15,h*.12,'#f22');rect(x+w*.1,y+h*.85,w*.2,h*.15,'#111');rect(x+w*.7,y+h*.85,w*.2,h*.15,'#111')}
  else if(o.k==='dumpster'){rect(x,y,w,h,'#1a6a2a');rect(x,y,w,h*.15,'#0d4018');rect(x+w*.1,y+h*.4,w*.8,1,'#3a9a4a')}
  else if(o.k==='barrier'){for(let i=0;i<6;i++)rect(x+i*w/6,y,w/6,h*.5,i&1?'#fff':'#f60');rect(x+w*.1,y+h*.5,w*.08,h*.5,'#888');rect(x+w*.82,y+h*.5,w*.08,h*.5,'#888');if(t>>3&1)rect(x,y-2,2,2,'#fa0')}
  else if(o.k==='billboard'){const bh=h*.45;rect(x+w*.1,y+bh,w*.05,h-bh,'#555');rect(x+w*.85,y+bh,w*.05,h-bh,'#555');rect(x,y,w,bh,'#111');rect(x,y,w,1,'#0ff');rect(x,y+bh-1,w,1,'#0ff');g.fillStyle=t>>4&1?'#f0f':'#ff0';g.font=`${Math.max(5,s*.35|0)}px monospace`;if(s>8)g.fillText('FLY UNDER!',x+w*.1,y+bh*.65)}}
function drawCrook(o,p){const s=p.s,w=o.w*2*s,h=o.h*s,x=p.x-w/2,y=p.y-h;const f=o.flash>0&&o.flash--;rect(x,y+h*.35,w,h*.5,f?'#fff':'#111');rect(x+w*.2,y,w*.6,h*.4,'#333');rect(x+w*.05,y+h*.5,w*.15,h*.12,'#f22');rect(x+w*.8,y+h*.5,w*.15,h*.12,'#f22');rect(x+w*.1,y+h*.85,w*.2,h*.15,'#000');rect(x+w*.7,y+h*.85,w*.2,h*.15,'#000');
  if(s>6){g.fillStyle='#f33';g.font=`${Math.max(5,s*.25|0)}px monospace`;g.fillText('$$$',x+w*.3,y-2)}}
function drawDrone(o,p){const s=p.s,w=o.w*2*s,h=o.h*s,x=p.x-w/2,y=p.y-h/2;const f=o.flash>0&&o.flash--;rect(x+w*.3,y,w*.4,h,f?'#fff':'#555');rect(x,y+h*.2,w,Math.max(1,h*.15),'#999');rect(x+w*.45,y+h*.45,w*.1,h*.2,t>>2&1?'#f00':'#600');
  const pr=t%4<2;rect(x-w*.1,y,w*(pr?.3:.15),1,'#ccc');rect(x+w*.8,y,w*(pr?.3:.15),1,'#ccc')}
function drawCiv(o,p){const s=p.s,x=p.x,y=p.y;if(o.saved)return;rect(x-s*.5,y,s,s*.08,'#666');rect(x-s*.08,y-s*.4,s*.16,s*.4,'#3af');rect(x-s*.07,y-s*.55,s*.14,s*.14,'#fc9');if(t>>3&1){rect(x-s*.2,y-s*.5,s*.1,s*.06,'#fc9');rect(x+s*.1,y-s*.5,s*.1,s*.06,'#fc9')}
  if(s>5){g.fillStyle=t>>3&1?'#fff':'#3f8';g.font='6px monospace';g.fillText('HELP!',x-12,y-s*.65)}rect(x-1,y-s*.9-4,2,2,'#3f8')}
function drawShadow(){const p=proj(P.x,0,0);if(!p)return;g.fillStyle='rgba(0,0,0,.5)';g.beginPath();g.ellipse(p.x,p.y,p.s*.55/(1+P.alt*.3),p.s*.1/(1+P.alt*.3),0,0,7);g.fill()}
function drawPlayer(){const p=proj(P.x,P.alt,0);if(!p)return;if(P.inv>0&&t>>2&1)return;
  g.save();g.translate(p.x,p.y-8);const tilt=((K.right?1:0)-(K.left?1:0))*.15;const bf=P.bflip>0?Math.sin(P.bflip*Math.PI)*16:0;g.translate(0,-bf);g.rotate(tilt+P.roll*Math.PI*2);const sy=Math.cos(P.flip*Math.PI*2)*Math.cos(P.bflip*Math.PI*2);const sx=P.spin>0?(Math.abs(Math.cos(P.spin*Math.PI*2))*.75+.25)*(Math.cos(P.spin*Math.PI*2)<0?-1:1):1;g.scale(sx,sy);
  const R='#e01020',DR='#900818';
  rect(-22,-2,44,9,R);rect(-20,7,40,2,DR);rect(-14,-9,28,8,DR);rect(-12,-8,24,5,'#2a4a7a');rect(-11,-8,6,2,'#8cf');
  rect(-24,0,4,4,'#f33');rect(20,0,4,4,'#f33');rect(-22,6,9,5,'#111');rect(13,6,9,5,'#111');rect(-19,7,3,2,'#555');rect(16,7,3,2,'#555');
  const kx=Math.round(Math.sin(t*.12)*8);for(let i=-2;i<=2;i++)rect(kx+i*2-1,3,2,2,i==0?'#f44':'rgba(255,0,0,'+(.6-Math.abs(i)*.25)+')');
  rect(-6,4,12,1,'#600');
  if(P.alt>.1||P.fly){const fl=(t>>1&1)?6:3;rect(-18,11,5,fl,'#0ff');rect(13,11,5,fl,'#0ff')}
  if(P.spd>1.3){rect(-4,6,8,6+(t&3)*2,'#ff0');rect(-2,8,4,10+(t&3)*2,'#fff')}
  g.restore()}
function drawHUD(){g.font='8px monospace';const tx=(s,x,y,c='#fff')=>{g.fillStyle='#000';g.fillText(s,x+1,y+1);g.fillStyle=c;g.fillText(s,x,y)};
  tx('SCORE '+String(score|0).padStart(7,'0'),4,10,'#ff0');tx('HI '+String(hi).padStart(7,'0'),236,10,'#0ff');
  tx('HP',4,172);rect(16,165,52,7,'#300');rect(17,166,P.hp/2,5,P.hp>30?'#3f6':'#f33');
  tx('BOOST',74,172);rect(102,165,52,7,'#003');rect(103,166,P.boost/2,5,'#3cf');
  tx(P.fly?'FLY':'DRIVE',160,172,P.fly?'#0ff':'#fa0');tx('ALT '+P.alt.toFixed(1),196,172,'#aaa');
  if(P.combo>1)tx('COMBO x'+P.combo,250,172,t>>2&1?'#f0f':'#ff0');
  popups.forEach((p,i)=>{g.font='8px monospace';const w=g.measureText(p.txt).width;tx(p.txt,W/2-w/2,40+i*10-(60-p.l)*.2,p.c)})}
function centered(s,y,c,sz=8){g.font=sz+'px monospace';const w=g.measureText(s).width;g.fillStyle='#000';g.fillText(s,W/2-w/2+1,y+1);g.fillStyle=c;g.fillText(s,W/2-w/2,y)}
function render(){g.save();if(shake)g.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);
  drawBg();drawGround();
  const list=objs.slice().sort((a,b)=>b.z-a.z);let pd=false;
  for(const o of list){if(!pd&&o.z<0){drawShadow();drawPlayer();pd=true}const p=proj(o.x,o.alt,o.z);if(!p||p.s<.3)continue;
    if(o.t==='bld')drawBld(o,p);else if(o.t==='ob')drawOb(o,p);else if(o.t==='crook')drawCrook(o,p);else if(o.t==='drone')drawDrone(o,p);else if(o.t==='civ')drawCiv(o,p)}
  for(const s of shots){const p=proj(s.x,s.alt,s.z);if(!p)continue;if(s.me)rect(p.x-1,p.y-Math.max(1,p.s*.15),2,Math.max(2,p.s*.3),'#0f8');else rect(p.x-2,p.y-2,Math.max(3,p.s*.15),Math.max(3,p.s*.15),t&2?'#f40':'#ff0')}
  if(!pd){drawShadow();drawPlayer()}
  parts.forEach(p=>rect(p.x,p.y,2,2,p.c));
  g.restore();
  if(state==='play'||state==='pause')drawHUD();
  if(state==='title'){g.fillStyle='rgba(0,0,20,.55)';g.fillRect(0,0,W,H);centered('ROADSTER',48,'#f22',24);centered('RETRO ARCADE',66,'#0ff',12);
    centered('ARROWS/WASD steer   C fly/drive   SHIFT/B boost',92,'#ccc',7);centered('SPACE lasers   Z flip X roll Q backflip E 360 V CRT',102,'#ccc',7);
    centered('Stunt over traffic. Bust crooks & drones. Rescue civilians.',116,'#ff0',7);if(t>>5&1)centered('PRESS ENTER / TAP TO START',140,'#fff',8);centered('HI '+hi,160,'#f0f',7)}
  if(state==='over'){g.fillStyle='rgba(30,0,0,.6)';g.fillRect(0,0,W,H);centered('GAME OVER',70,'#f22',20);centered('SCORE '+(score|0),95,'#ff0',10);centered('HI '+hi,110,'#0ff',8);if(t>>5&1)centered('PRESS ENTER / TAP TO RETRY',140,'#fff',8)}
  if(state==='pause'){centered('PAUSED - P',90,'#fff',12)}}
let last=performance.now();
function loop(n){const dt=Math.min(.05,(n-last)/1000);last=n;if(state==='pause'){if(pressed.pause||pressed.start)state='play';clearP();t++}else update(dt);render();requestAnimationFrame(loop)}
requestAnimationFrame(loop);
window.__game={get state(){return state},start(){reset();state='play'},P:()=>P};
if(window.TP)TP.onstart=()=>{au();pressed.start=1};
