// Invisible TrackPoint-style touch steering: touch sets anchor, displacement -> rate (analog, deadzone, accel curve, capped).
window.TP=(function(){const tp={ax:0,ay:0,active:false,id:null,x0:0,y0:0,DZ:4,RANGE:56,EXP:1.35};
  function curve(d){const a=Math.abs(d);if(a<tp.DZ)return 0;const n=Math.min(1,(a-tp.DZ)/tp.RANGE);return Math.sign(d)*Math.pow(n,tp.EXP)}
  function skip(e){return e.target.closest&&e.target.closest('button,a,input')}
  addEventListener('touchstart',e=>{if(skip(e))return;for(const t of e.changedTouches){if(tp.id===null){tp.id=t.identifier;tp.x0=t.clientX;tp.y0=t.clientY;tp.active=true;tp.ax=tp.ay=0;tp.onstart&&tp.onstart()}}if(e.cancelable)e.preventDefault()},{passive:false});
  addEventListener('touchmove',e=>{for(const t of e.changedTouches)if(t.identifier===tp.id){const L=tp.DZ+tp.RANGE;let dx=t.clientX-tp.x0,dy=t.clientY-tp.y0;/* anchor follows the finger past full deflection so reversing is instant */if(Math.abs(dx)>L){tp.x0+=dx-Math.sign(dx)*L;dx=Math.sign(dx)*L}if(Math.abs(dy)>L){tp.y0+=dy-Math.sign(dy)*L;dy=Math.sign(dy)*L}tp.ax=curve(dx);tp.ay=curve(dy)}if(tp.active&&e.cancelable)e.preventDefault()},{passive:false});
  const end=e=>{for(const t of e.changedTouches)if(t.identifier===tp.id){tp.id=null;tp.active=false;tp.ax=tp.ay=0}};
  addEventListener('touchend',end);addEventListener('touchcancel',end);
  tp.curve=curve;return tp})();
