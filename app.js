const D=window.CHARS;const $=s=>document.querySelector(s);const cv=$('#cv');
const BGN=['Park','Street','Sunset'];
let P,cur=0,sel=-1,selI=-1,z=100,grid=false,hist=[],hi=-1,hkey='',TL={ev:[],total:0,span:30},curExp=0,run=null,busy=false,drag=null,dl=null,AC=null,rec=null,recIdx=-1,lineTarget=null,outBlob=null,outExt='webm',outUrl=null;
const BUF=new WeakMap(),IM={},MUS={buf:null};
const blank=()=>({bg:0,bgImg:null,chars:[],lines:[],items:[],fx:'none',flt:'none',tr:'fade'});
const base=()=>({title:'Episode 1: The Impossible Delivery',aspect:'16:9',music:null,voices:{},scenes:[blank()]});
try{const j=JSON.parse(localStorage.getItem('toonora2')||'null');if(j&&Array.isArray(j.scenes)&&j.scenes.length&&j.scenes.every(s=>Array.isArray(s.chars)&&Array.isArray(s.lines)))P=Object.assign(base(),j)}catch(e){}
P=P||base();
const sc=()=>P.scenes[cur],portrait=()=>P.aspect==='9:16';
const msg=t=>{$('#st').textContent=t};
function persist(){try{localStorage.setItem('toonora2',JSON.stringify(P,(k,v)=>(k==='audio'||k==='bgImg'||k==='music'||k==='dur')?undefined:v))}catch(e){}}
(async()=>{try{if(window.claude&&claude.use)dl=await claude.use('downloads')}catch(e){}})();
/* ---------- images ---------- */
const ok=i=>i&&i.complete&&i.naturalWidth>0;
function img(src){let i=IM[src];if(!i){i=IM[src]=new Image();i.onload=()=>{if(!run)redraw()};i.src=src}return i}
const loaded=i=>ok(i)?Promise.resolve():new Promise(r=>{i.addEventListener('load',r);i.addEventListener('error',r)});
/* ---------- rendering ---------- */
function geo(c,W,H){const b=portrait()?W*.8:H,h=.78*c.s*b,i=img(D[c.id].poses[c.pose]);return{x:c.x/100*W,y:c.y/100*H,h,w:ok(i)?h*i.naturalWidth/i.naturalHeight:h*.4,i}}
function bgDraw(g,W,H,s){
 if(s.bgImg){const i=img(s.bgImg);if(ok(i)){const r=Math.max(W/i.naturalWidth,H/i.naturalHeight),w=i.naturalWidth*r,h=i.naturalHeight*r;g.drawImage(i,(W-w)/2,(H-h)/2,w,h);return}}
 const k=s.bg,hz=H*(portrait()?.7:.64),sky=[['#6fb8ff','#dff1ff'],['#8ccfff','#ffeed8'],['#ff8f66','#ffd89a']][k],gr=['#7fcf68','#8a95a6','#4b5b8b'][k];
 const gd=g.createLinearGradient(0,0,0,hz);gd.addColorStop(0,sky[0]);gd.addColorStop(1,sky[1]);g.fillStyle=gd;g.fillRect(0,0,W,hz);
 g.globalAlpha=.55;g.fillStyle=k==2?'#5a4a7a':'#9fb4d6';
 for(let i=0;i<14;i++){const bw=W*(.05+.04*((i*7)%5)/4),bh=H*(.12+.2*(((i*5)%7)/6));g.fillRect(i*W/13-bw/2,hz-bh,bw,bh)}
 g.globalAlpha=1;
 if(k===0)for(let i=0;i<5;i++){const tx=W*(.08+i*.21),r=H*.09;g.fillStyle='#7a5a3a';g.fillRect(tx-r*.1,hz-r*.5,r*.2,r*.5);g.fillStyle='#4aa655';g.beginPath();g.arc(tx,hz-r*.9,r,0,7);g.fill()}
 if(k===2){g.fillStyle='#fff3b0';g.beginPath();g.arc(W*.75,hz-H*.05,H*.08,0,7);g.fill()}
 g.fillStyle=gr;g.fillRect(0,hz,W,H-hz);g.fillStyle='rgba(255,255,255,.25)';g.fillRect(0,hz,W,H*.012)}
function wrap(g,t,mw){const out=[];let c='';for(const w of t.split(/\s+/)){const x=c?c+' '+w:w;if(g.measureText(x).width>mw&&c){out.push(c);c=w}else c=x}if(c)out.push(c);return out}
function rr(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath()}
const FN='system-ui,-apple-system,Segoe UI,sans-serif';
function bubble(g,W,H,l,s){
 const d=D[l.id],fs=portrait()?W*.046:W*.024,p=fs*.7,bw=portrait()?W*.88:W*.62,pi=img(d.exps[l.exp]||d.exps[0]),ph=fs*3.4,pw=ok(pi)?ph*pi.naturalWidth/pi.naturalHeight:ph;
 g.font='700 '+fs+'px '+FN;const L=wrap(g,l.text,bw-p*3-pw),bh=Math.max(ph,L.length*fs*1.3+fs*1.2)+p*2;
 const c=s.chars.find(c=>c.id===l.id),sx=c?c.x/100*W:W/2,bx=Math.min(W-bw-12,Math.max(12,sx-bw/2)),by=H*(portrait()?.07:.05);
 g.fillStyle='#fff';g.strokeStyle='#111';g.lineWidth=4;rr(g,bx,by,bw,bh,fs*.8);g.fill();g.stroke();
 const tx=Math.min(bx+bw-fs*1.5,Math.max(bx+fs*1.5,sx));g.beginPath();g.moveTo(tx-fs*.6,by+bh-3);g.lineTo(tx,by+bh+fs*1.1);g.lineTo(tx+fs*.6,by+bh-3);g.fillStyle='#fff';g.fill();g.stroke();
 g.save();rr(g,bx+p,by+p,pw,ph,fs*.4);g.clip();if(ok(pi))g.drawImage(pi,bx+p,by+p,pw,ph);g.restore();
 g.textAlign='left';g.textBaseline='top';g.fillStyle=d.color;g.font='800 '+fs*.8+'px '+FN;g.fillText(d.name,bx+p*2+pw,by+p);
 g.fillStyle='#111';g.font='700 '+fs+'px '+FN;L.forEach((t,i)=>g.fillText(t,bx+p*2+pw,by+p+fs*1.2+i*fs*1.3))}
function itemBox(g,W,H,it){const fs=W*(it.k==='s'?.1:.05)*(it.s||1);g.font=(it.k==='s'?'400 ':'900 ')+fs+'px '+FN;const w=it.k==='s'?fs*1.15:g.measureText(it.v).width,x=it.x/100*W,y=it.y/100*H;return{fs,x,y,x0:x-w/2,x1:x+w/2,y0:y-fs/2,y1:y+fs/2}}
function drawItem(g,W,H,it,on){const b=itemBox(g,W,H,it);g.textAlign='center';g.textBaseline='middle';
 if(it.k==='t'){g.lineWidth=b.fs*.18;g.strokeStyle='#111';g.lineJoin='round';g.strokeText(it.v,b.x,b.y);g.fillStyle='#fff';g.fillText(it.v,b.x,b.y)}else{g.fillStyle='#000';g.fillText(it.v,b.x,b.y)}
 if(on){g.setLineDash([8,6]);g.strokeStyle='#ffd21f';g.lineWidth=3;g.strokeRect(b.x0-6,b.y0-6,b.x1-b.x0+12,b.y1-b.y0+12);g.setLineDash([])}g.textAlign='left'}
function vig(g,W,H){const r=g.createRadialGradient(W/2,H/2,H*.35,W/2,H/2,Math.max(W,H)*.7);r.addColorStop(0,'rgba(0,0,0,0)');r.addColorStop(1,'rgba(0,0,0,.55)');g.fillStyle=r;g.fillRect(0,0,W,H)}
function fltDraw(g,W,H,f){if(f==='warm'){g.fillStyle='rgba(255,150,60,.2)';g.fillRect(0,0,W,H)}else if(f==='cool'){g.fillStyle='rgba(60,120,255,.2)';g.fillRect(0,0,W,H)}
 else if(f==='bw'){g.globalCompositeOperation='saturation';g.fillStyle='#808080';g.fillRect(0,0,W,H);g.globalCompositeOperation='source-over'}
 else if(f==='vintage'){g.fillStyle='rgba(160,105,45,.3)';g.fillRect(0,0,W,H);vig(g,W,H)}}
function fxDraw(g,W,H,fx,t){if(fx==='vignette')vig(g,W,H);else if(fx==='rain'){g.strokeStyle='rgba(200,220,255,.6)';g.lineWidth=2;g.beginPath();for(let i=0;i<70;i++){const x=(i*97%100)/100*W,y=(((i*53%100)/100*H)+(t||0)*H*1.2)%H;g.moveTo(x,y);g.lineTo(x-8,y+H*.04)}g.stroke()}}
function render(g,W,H,s,o){
 g.clearRect(0,0,W,H);g.save();
 if(s.fx==='zoom'&&o.zp!=null){const z=1+.08*o.zp;g.translate(W/2,H/2);g.scale(z,z);g.translate(-W/2,-H/2)}
 bgDraw(g,W,H,s);const ln=o.line;
 s.chars.forEach((c,i)=>{let cc=c,bob=0;if(ln&&ln.id===c.id){cc=Object.assign({},c,{pose:ln.pose!=null?ln.pose:c.pose});bob=Math.abs(Math.sin((o.t||0)*9))*H*.012}
  const q=geo(cc,W,H);g.fillStyle='rgba(0,0,0,.22)';g.beginPath();g.ellipse(q.x,q.y,q.w*.45,q.h*.03,0,0,7);g.fill();
  if(ok(q.i)){g.save();g.translate(q.x,q.y-bob);g.scale(c.flip?-1:1,1);g.drawImage(q.i,-q.w/2,-q.h,q.w,q.h);g.restore()}
  if(o.sel===i){g.setLineDash([10,8]);g.strokeStyle='#ffd21f';g.lineWidth=3;g.strokeRect(q.x-q.w/2-6,q.y-q.h-6,q.w+12,q.h+12);g.setLineDash([])}});
 g.restore();fltDraw(g,W,H,s.flt);fxDraw(g,W,H,s.fx,o.t);
 (s.items||[]).forEach((it,i)=>drawItem(g,W,H,it,o.selI===i));
 if(ln)bubble(g,W,H,ln,s);
 if(o.title){const f=W*(portrait()?.07:.045);g.fillStyle='rgba(8,16,60,.78)';g.fillRect(0,H*.38,W,H*.24);g.fillStyle='#ffd21f';g.textAlign='center';g.textBaseline='middle';g.font='900 '+f+'px '+FN;
  const L=wrap(g,o.title,W*.9);L.forEach((t,i)=>g.fillText(t,W/2,H*.5+(i-(L.length-1)/2)*f*1.2));g.textAlign='left'}
 if(o.grid){g.strokeStyle='rgba(255,255,255,.45)';g.lineWidth=1.5;g.beginPath();for(let i=1;i<3;i++){g.moveTo(W*i/3,0);g.lineTo(W*i/3,H);g.moveTo(0,H*i/3);g.lineTo(W,H*i/3)}g.stroke()}
 g.font='800 '+W*.018+'px '+FN;g.textAlign='right';g.textBaseline='bottom';g.fillStyle='rgba(255,255,255,.88)';g.shadowColor='rgba(0,0,0,.5)';g.shadowBlur=4;g.fillText('TOONORA STUDIOS',W-14,H-10);g.shadowBlur=0;g.textAlign='left'}
function redraw(){if(run)return;render(cv.getContext('2d'),cv.width,cv.height,sc(),{sel:sel,selI:selI,grid:grid,line:null})}
function applyAspect(){const w=portrait()?720:1280,h=portrait()?1280:720;cv.width=w;cv.height=h;cv.style.aspectRatio=w+'/'+h;cv.style.width=portrait()?'auto':z+'%';cv.style.height=portrait()?'min('+72*z/100+'vh,'+620*z/100+'px)':'auto';$('#asp').value=P.aspect;redraw()}
/* ---------- audio ---------- */
const getCtx=()=>AC||(AC=new (window.AudioContext||window.webkitAudioContext)());
const rd=b=>new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(b)});
function d2ab(u){const b=atob(u.split(',')[1]),a=new Uint8Array(b.length);for(let i=0;i<b.length;i++)a[i]=b.charCodeAt(i);return a.buffer}
async function decodeLine(l){if(!l.audio)return null;if(BUF.has(l))return BUF.get(l);const b=await getCtx().decodeAudioData(d2ab(l.audio));BUF.set(l,b);l.dur=b.duration;return b}
async function loadMusic(){MUS.buf=null;if(P.music){try{MUS.buf=await getCtx().decodeAudioData(d2ab(P.music))}catch(e){MUS.buf=null;P.music=null;msg('Could not read that music file.')}}$('#bmus').textContent=P.music?'🎵 Music ✓ (remove)':'🎵 Music'}
const VP=[{n:'Calm & Confident',p:0,r:1},{n:'Energetic',p:.25,r:1.12},{n:'Deep & Slow',p:-.25,r:.9}];
function tts(l){try{speechSynthesis.cancel();const v=VP[((P.voices||{})[l.id]|0)]||VP[0],u=new SpeechSynthesisUtterance(l.text);u.pitch=Math.min(2,Math.max(0,D[l.id].pitch+v.p));u.rate=v.r;speechSynthesis.speak(u)}catch(e){}}
async function playLine(i){const l=sc().lines[i];if(!l)return;if(l.audio){try{await getCtx().resume();const b=await decodeLine(l),s=getCtx().createBufferSource();s.buffer=b;s.connect(getCtx().destination);s.start()}catch(e){msg('Could not play that voice file.')}}else tts(l)}
async function micToggle(i){
 if(rec){rec.stop();return}
 try{const st=await navigator.mediaDevices.getUserMedia({audio:true}),ch=[],mr=new MediaRecorder(st),l=sc().lines[i];rec=mr;recIdx=i;
  mr.ondataavailable=e=>{if(e.data.size)ch.push(e.data)};
  mr.onstop=async()=>{st.getTracks().forEach(t=>t.stop());rec=null;recIdx=-1;msg('Processing recording…');
   try{l.audio=await rd(new Blob(ch,{type:mr.mimeType}));BUF.delete(l);await decodeLine(l);msg('Voice recorded ('+l.dur.toFixed(1)+' s).')}catch(e){l.audio=null;l.dur=undefined;msg('Could not read that recording. Try uploading an audio file instead.')}ui()};
  mr.start();ui();msg('Recording… tap Stop when finished.')}
 catch(e){rec=null;recIdx=-1;msg('The microphone is not available here. Use “Voice file” to upload a recording instead.');ui()}}
/* ---------- playback / export ---------- */
function plan(){const lead=P.title?2:0;let t=lead;const ev=[];P.scenes.forEach((s,si)=>{const t0=si?t:0,L=[];s.lines.forEach(l=>{const d=l.audio&&l.dur?l.dur:Math.max(1.8,l.text.length*.07+.6);L.push({l,t0:t,t1:t+d});t+=d+.25});if(!s.lines.length)t+=2;t+=.3;ev.push({si,t0,t1:t,L})});return{ev,total:t,lead}}
function setBtns(){$('#play').textContent=run&&!run.record?'■ Stop':'▶ Preview';$('#tplay').textContent=run&&!run.record?'■':'▶';$('#bexp').textContent=run&&run.record?'■ Cancel render':'🎞 Render Video';$('#play').disabled=!!(run&&run.record);$('#tplay').disabled=!!(run&&run.record);$('#bexp').disabled=!!(run&&!run.record)}
async function play(record){
 if(run){finish(true);return}if(busy)return;
 if(!P.scenes.some(s=>s.lines.length)){msg('Add at least one line of dialogue first.');return}
 if(record&&(!window.MediaRecorder||!cv.captureStream)){msg('Video export is not supported in this browser. Try Chrome, Edge or Safari 16+.');return}
 busy=true;
 try{const ac=getCtx();try{await ac.resume()}catch(e){}msg('Preparing…');
  for(const s of P.scenes){for(const l of s.lines)await decodeLine(l);if(s.bgImg)await loaded(img(s.bgImg))}
  const srcs=[];P.scenes.forEach(s=>s.chars.forEach(c=>{srcs.push(...D[c.id].poses);}));P.scenes.forEach(s=>s.lines.forEach(l=>srcs.push(D[l.id].exps[l.exp]||D[l.id].exps[0])));
  await Promise.all([...new Set(srcs)].map(x=>loaded(img(x))));
  const {ev,total,lead}=plan(),master=ac.createGain();master.connect(ac.destination);
  let dest=null,mr=null,chunks=[],mime='';
  if(record){dest=ac.createMediaStreamDestination();master.connect(dest);
   const st=cv.captureStream(30);dest.stream.getAudioTracks().forEach(t=>st.addTrack(t));
   mime=['video/mp4;codecs=avc1.42E01E,mp4a.40.2','video/mp4','video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'].find(m=>MediaRecorder.isTypeSupported(m))||'';
   mr=new MediaRecorder(st,mime?{mimeType:mime,videoBitsPerSecond:6e6}:{videoBitsPerSecond:6e6});mr.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)}}
  const T0=ac.currentTime+.3,nodes=[],timers=[];
  ev.forEach(e=>e.L.forEach(x=>{const b=x.l.audio?BUF.get(x.l):null;
   if(b){const s=ac.createBufferSource();s.buffer=b;s.connect(master);s.start(T0+x.t0+.05);nodes.push(s)}
   else if(!record&&window.speechSynthesis)timers.push(setTimeout(()=>tts(x.l),(x.t0+.35)*1000))}));
  if(MUS.buf){const s=ac.createBufferSource(),gn=ac.createGain();s.buffer=MUS.buf;s.loop=true;gn.gain.value=.22;s.connect(gn);gn.connect(master);s.start(T0);nodes.push(s)}
  run={ac,nodes,timers,mr,chunks,mime,record,master,raf:0};if(mr)mr.start(500);setBtns();
  const g=cv.getContext('2d'),W=cv.width,H=cv.height;
  const tick=()=>{if(!run)return;const t=ac.currentTime-T0;if(t>=total+.3){finish(false);return}
   const tt=Math.max(0,t),e=ev.find(e=>tt>=e.t0&&tt<e.t1)||ev[ev.length-1],x=e.L.find(x=>tt>=x.t0&&tt<x.t1);
   render(g,W,H,P.scenes[e.si],{line:x?x.l:null,t:tt,zp:Math.min(1,(tt-e.t0)/Math.max(.1,e.t1-e.t0)),title:(e.si===0&&tt<lead)?P.title:null});
   const f=tt-e.t0,tr=P.scenes[e.si].tr||'fade';if(tr!=='cut'&&f<.25){g.fillStyle=(tr==='flash'?'rgba(255,255,255,':'rgba(0,0,0,')+(1-f/.25)+')';g.fillRect(0,0,W,H)}setHead(tt);
   msg((record?'Recording ':'Playing ')+tt.toFixed(1)+' / '+total.toFixed(1)+' s'+(record?' — keep this tab open and visible.':''));
   run.raf=requestAnimationFrame(tick)};
  run.raf=requestAnimationFrame(tick)}
 catch(e){run=null;setBtns();msg('Something went wrong while preparing playback. '+(e&&e.message?e.message:''));redraw()}
 busy=false}
function finish(cancel){const r=run;if(!r)return;run=null;cancelAnimationFrame(r.raf);r.timers.forEach(clearTimeout);try{speechSynthesis.cancel()}catch(e){}
 r.nodes.forEach(s=>{try{s.stop()}catch(e){}});try{r.master.disconnect()}catch(e){}
 const done=()=>{setBtns();redraw()};
 if(r.mr){r.mr.onstop=()=>{if(!cancel&&r.chunks.length){const type=(r.mime||'video/webm').split(';')[0];showResult(new Blob(r.chunks,{type}),type.includes('mp4')?'mp4':'webm')}else msg(cancel?'Export cancelled.':'Nothing was recorded.');done()};try{r.mr.stop()}catch(e){done()}}
 else{msg(cancel?'Stopped.':'Preview finished.');done()}}
function showResult(b,ext){outBlob=b;outExt=ext;if(outUrl)URL.revokeObjectURL(outUrl);outUrl=URL.createObjectURL(b);$('#rv').src=outUrl;$('#res').hidden=false;$('#rs').textContent=(b.size/1048576).toFixed(1)+' MB · '+ext;msg('Export finished. Press Save video.');$('#res').scrollIntoView({block:'nearest'})}
async function saveFile(name,data){if(!dl){try{const b=data instanceof Blob?data:new Blob([data],{type:'application/json'}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000);msg('Saved '+name)}catch(e){msg('Could not save the file.')}return}
 try{await dl.save({filename:name,data});msg('Saved '+name)}catch(e){msg(e&&e.code==='declined'?'Save cancelled.':'Could not save ('+((e&&e.code)||'error')+').')}}
const slug=()=>((P.title||'toonora-episode').replace(/[^\w\- ]+/g,'').trim().replace(/\s+/g,'-')||'toonora-episode');
/* ---------- script import ---------- */
const SAMPLE='title: Episode 1: The Impossible Delivery\n# Scene 1 | Street\nMax (serious, standing): I have a perfect plan for this delivery.\nOliver (laughing, excited): Plans? Where’s the fun in that?\nMia (thinking, thinking): Let’s find a better way.\n# Scene 2 | Park\nOliver (surprised, pointing): Wait… the package is already gone!\nMax (angry, talking): What?! I planned everything!\nMia (happy, waving): Relax. I think I know who took it.';
function parseScript(txt){const out=[],errs=[],key={};let s=null,title=null;Object.keys(D).forEach(k=>{key[D[k].name.toLowerCase()]=k});
 const ns=b=>{s=blank();s.bg=b;out.push(s)};
 txt.split(/\r?\n/).forEach((raw,n)=>{const t=raw.trim(),ln='Line '+(n+1)+': ';if(!t||t.startsWith('//'))return;let m;
  if(m=t.match(/^title\s*:\s*(.+)$/i)){title=m[1].trim();return}
  if(m=t.match(/^#\s*scene[^|]*(?:\|\s*(.+))?$/i)){let b=0;if(m[1]){b=BGN.findIndex(x=>x.toLowerCase()===m[1].trim().toLowerCase());if(b<0){errs.push(ln+'unknown background “'+m[1].trim()+'” (use Park, Street or Sunset)');b=0}}ns(b);return}
  if(m=t.match(/^([A-Za-z]+)\s*(?:\(([^)]*)\))?\s*:\s*(.+)$/)){const id=key[m[1].toLowerCase()];if(!id){errs.push(ln+'unknown character “'+m[1]+'”');return}
   if(!s)ns(0);const d=D[id];let e=0,p;
   (m[2]||'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean).forEach(w=>{const ei=d.exn.findIndex(x=>x.toLowerCase()===w),pi=d.pn.findIndex(x=>x.toLowerCase()===w);if(ei>=0)e=ei;else if(pi>=0)p=pi;else errs.push(ln+'“'+w+'” is not an expression or pose for '+d.name)});
   if(!s.chars.some(c=>c.id===id))s.chars.push({id,pose:0,x:50,y:portrait()?80:94,s:1,flip:false});
   const l={id,exp:e,text:m[3].trim()};if(p!=null)l.pose=p;s.lines.push(l);return}
  errs.push(ln+'could not read “'+t.slice(0,40)+'”')});
 out.forEach(s=>{const n=s.chars.length,xs=n===1?[50]:n===2?[30,70]:n===3?[20,50,80]:s.chars.map((_,i)=>10+80*i/(n-1));s.chars.forEach((c,i)=>{c.x=xs[i]})});
 return{scenes:out,title,errs}}
/* ---------- UI ---------- */
function lineRow(l,i){const w=document.createElement('div');w.className='lr';const h=document.createElement('div');h.className='ln';
 const b=document.createElement('b'),t=document.createElement('i');b.textContent=D[l.id].name;b.style.color=D[l.id].color;t.textContent=l.text;h.append(b,t);
 const bar=document.createElement('div');bar.className='row';
 [['play','▶ Play'],['rec',recIdx===i?'■ Stop':'🎙 Record'],['up','Voice file'],['del','✕']].forEach(([a,tx])=>{const x=document.createElement('button');x.textContent=tx;x.dataset.a=a;x.dataset.i=i;if(a==='rec'&&recIdx===i)x.className='p';bar.append(x)});
 const sm=document.createElement('small');sm.textContent=l.audio?'🔊 Voice added'+(l.dur?' ('+l.dur.toFixed(1)+' s)':''):'No voice yet — captions only in the video';
 w.append(h,bar,sm);return w}
const ICON={Standing:'🧍',Walking:'🚶',Talking:'💬',Thinking:'🤔',Pointing:'👉',Waving:'👋',Running:'🏃',Excited:'🙌'};
const key=()=>JSON.stringify(P,(k,v)=>(k==='audio'||k==='bgImg'||k==='music')?(v?1:0):v);
const cl=v=>Array.isArray(v)?v.map(cl):(v&&typeof v==='object')?Object.fromEntries(Object.entries(v).map(([k,x])=>[k,cl(x)])):v;
const fm=n=>{n=Math.max(0,Math.round(n));return String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0')};
function setHead(t){const f=Math.min(1,Math.max(0,t/TL.span));$('#head').style.left='calc(var(--lw) + (100% - var(--lw) - 13px)*'+f+')';$('#tt').textContent=fm(t)+' / '+fm(TL.total)}
function thumb(s){const k=document.createElement('canvas');k.width=portrait()?108:192;k.height=portrait()?192:108;try{render(k.getContext('2d'),k.width,k.height,s,{line:null})}catch(e){}return k.toDataURL('image/jpeg',.7)}
function tlWave(){const k=$('#wav'),w=k.parentNode.clientWidth,h=k.parentNode.clientHeight;if(!w)return;k.width=w;k.height=h;const g=k.getContext('2d');g.clearRect(0,0,w,h);
 TL.ev.forEach(e=>e.L.forEach(x=>{const x0=x.t0/TL.span*w,x1=x.t1/TL.span*w,b=x.l.audio?BUF.get(x.l):null;
  if(b){const dat=b.getChannelData(0),n=Math.max(1,Math.floor((x1-x0)/3));g.fillStyle='#3ddc97';for(let i=0;i<n;i++){const a=Math.floor(i/n*dat.length),e2=Math.floor((i+1)/n*dat.length);let m=0;for(let j=a;j<e2;j+=Math.max(1,Math.floor((e2-a)/40)))m=Math.max(m,Math.abs(dat[j]));const bh=Math.max(2,m*h*.9);g.fillRect(x0+i*3,(h-bh)/2,2,bh)}}
  else{g.strokeStyle='rgba(120,140,190,.7)';g.setLineDash([4,4]);g.beginPath();g.moveTo(x0,h/2);g.lineTo(x1,h/2);g.stroke();g.setLineDash([])}}))}
function tlDraw(){const {ev,total}=plan(),span=Math.max(30,Math.ceil(total/5)*5);TL={ev,total,span};
 let r='';for(let t=0;t<=span;t+=5)r+='<i style="left:'+(t/span*96)+'%">'+t+'s</i>';$('#ruler').innerHTML=r;
 $('#trkS').innerHTML=ev.map(e=>'<div class="sg'+(e.si===cur?' on':'')+'" data-si="'+e.si+'" style="left:'+e.t0/span*100+'%;width:'+(e.t1-e.t0)/span*100+'%;background-image:url(&quot;'+thumb(P.scenes[e.si])+'&quot;)"></div>').join('');
 $('#trkC').innerHTML=ev.map(e=>e.L.map(x=>'<div class="cb" data-si="'+e.si+'" style="left:'+x.t0/span*100+'%;width:'+(x.t1-x.t0)/span*100+'%;background:'+D[x.l.id].color+'"><img src="'+D[x.l.id].exps[0]+'" alt=""><span>'+D[x.l.id].name+'</span></div>').join('')).join('');
 $('#trkM').innerHTML=P.music?'<div class="mb">🎵 Background Music</div>':'<button class="mb add" id="addmus">+ Add music</button>';
 P.scenes.forEach(s=>s.lines.forEach(l=>{if(l.audio&&!BUF.has(l))decodeLine(l).then(tlWave).catch(()=>{})}));
 tlWave();setHead(ev[cur]?ev[cur].t0:0)}
function ui(){
 const c=sc().chars[sel],d=c&&D[c.id];
 document.querySelectorAll('#lib button').forEach(b=>b.classList.toggle('on',!!c&&b.dataset.k===c.id));
 document.querySelectorAll('#bgs button').forEach(b=>b.classList.toggle('on',+b.dataset.b===sc().bg&&!sc().bgImg));
 $('#wn').textContent=d?d.name:'No character selected';$('#wr').textContent=d?d.role:'Click a character on the stage';$('#wa').hidden=!d;if(d)$('#wa').src=d.exps[0];
 $('#ex').innerHTML=d?d.exps.map((p,i)=>'<button data-e="'+i+'" class="'+(i===curExp?'on':'')+'"><img src="'+p+'" alt=""><span>'+d.exn[i]+'</span></button>').join(''):'';
 $('#po').innerHTML=d?d.poses.map((p,i)=>'<button data-p="'+i+'" class="'+(i===c.pose?'on':'')+'"><b>'+(ICON[d.pn[i]]||'•')+'</b><span>'+d.pn[i]+'</span></button>').join(''):'';
 $('#vsel').innerHTML=VP.map((v,i)=>'<option value="'+i+'">'+(d?d.name:'Character')+' Voice – '+v.n+'</option>').join('');$('#vsel').value=String(d?((P.voices||{})[c.id]|0):0);
 $('#cnt').textContent=$('#tx').value.length+' / 200';
 const L=$('#lines');L.innerHTML='';sc().lines.forEach((l,i)=>L.append(lineRow(l,i)));
 $('#scsel').innerHTML=P.scenes.map((s,i)=>'<option value="'+i+'">'+(i+1)+'</option>').join('');$('#scsel').value=String(cur);
 $('#zv').textContent=z+'%';$('#title').value=P.title||'';
 tlDraw();
 const k=key();if(k!==hkey){hist.length=hi+1;hist.push(cl(P));hi=hist.length-1;if(hist.length>60){hist.shift();hi--}hkey=k}
 $('#undo').disabled=hi<1;$('#redo').disabled=hi>=hist.length-1;
 redraw();persist()}
$('#lib').innerHTML=Object.keys(D).map(k=>'<button data-k="'+k+'"><img src="'+D[k].exps[0]+'" alt=""><span><b>'+D[k].name+'</b><br><small>'+D[k].role+'</small></span></button>').join('');
$('#bgs').innerHTML=BGN.map((n,i)=>{const k=document.createElement('canvas');k.width=120;k.height=160;bgDraw(k.getContext('2d'),120,160,{bg:i});return '<button data-b="'+i+'" title="'+n+'"><img src="'+k.toDataURL('image/jpeg',.8)+'" alt="'+n+'"></button>'}).join('');
$('#lib').onclick=e=>{const b=e.target.closest('button');if(!b)return;const k=b.dataset.k,ex=sc().chars.findIndex(c=>c.id===k);
 if(ex>=0)sel=ex;else{sc().chars.push({id:k,pose:0,x:[50,25,75,12,88][sc().chars.length%5],y:portrait()?80:94,s:1,flip:false});sel=sc().chars.length-1}ui()};
$('#bgs').onclick=e=>{const b=e.target.closest('button');if(b){sc().bg=+b.dataset.b;sc().bgImg=null;ui()}};
$('#po').onclick=e=>{const b=e.target.closest('[data-p]');if(b&&sc().chars[sel]){sc().chars[sel].pose=+b.dataset.p;ui()}};
$('#ex').onclick=e=>{const b=e.target.closest('[data-e]');if(b){curExp=+b.dataset.e;ui()}};
$('#add').onclick=()=>{const c=sc().chars[sel],t=$('#tx').value.trim();if(!c){msg('Select a character first, then add a line.');return}if(!t){msg('Type a line of dialogue first.');return}sc().lines.push({id:c.id,exp:curExp,text:t});$('#tx').value='';ui()};
$('#lines').onclick=async e=>{const b=e.target.closest('button');if(!b)return;const i=+b.dataset.i,a=b.dataset.a;
 if(a==='del'){sc().lines.splice(i,1);ui()}else if(a==='play')playLine(i);else if(a==='rec')micToggle(i);else if(a==='up'){lineTarget=sc().lines[i];$('#fline').click()}};
$('#fline').onchange=async e=>{const f=e.target.files[0];e.target.value='';const l=lineTarget;if(!f||!l)return;try{l.audio=await rd(f);BUF.delete(l);await decodeLine(l);msg('Voice file added ('+l.dur.toFixed(1)+' s).')}catch(x){l.audio=null;l.dur=undefined;msg('Could not read that audio file.')}ui()};
$('#ns').onclick=()=>{if(run)return;P.scenes.push(blank());cur=P.scenes.length-1;sel=-1;selI=-1;ui()};
$('#dup').onclick=()=>{if(run)return;P.scenes.splice(cur+1,0,JSON.parse(JSON.stringify(sc())));cur++;sel=-1;ui()};
$('#del').onclick=()=>{if(P.scenes.length>1){P.scenes.splice(cur,1);cur=Math.max(0,cur-1);sel=-1;ui()}else msg('A project needs at least one scene.')};
$('#flip').onclick=()=>{const c=sc().chars[sel];if(c){c.flip=!c.flip;ui()}};
$('#sm').onclick=()=>{const c=selI>=0?sc().items[selI]:sc().chars[sel];if(c){c.s=Math.max(.4,(c.s||1)-.1);ui()}};
$('#lg').onclick=()=>{const c=selI>=0?sc().items[selI]:sc().chars[sel];if(c){c.s=Math.min(2.5,(c.s||1)+.1);ui()}};
$('#rm').onclick=()=>{if(selI>=0&&sc().items&&sc().items[selI]){sc().items.splice(selI,1);selI=-1;ui();return}const c=sc().chars[sel];if(c){sc().lines=sc().lines.filter(l=>l.id!==c.id);sc().chars.splice(sel,1);sel=-1;ui()}};
$('#brep').onclick=()=>{if(sc().chars[sel])$('#frep').click();else msg('Select a character first.')};
$('#frep').onchange=async e=>{const f=e.target.files[0];e.target.value='';const c=sc().chars[sel];if(!f||!c)return;try{D[c.id].poses[c.pose]=await rd(f);msg('Pose image replaced for this session. Use Save project to keep it.');ui()}catch(x){msg('Could not read that image.')}};
$('#bbgu').onclick=()=>$('#fbg').click();
$('#fbg').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;try{sc().bgImg=await rd(f);ui()}catch(x){msg('Could not read that image.')}};
$('#title').oninput=e=>{P.title=e.target.value;persist()};
$('#asp').onchange=e=>{P.aspect=e.target.value;applyAspect();persist()};
$('#bmus').onclick=async()=>{if(P.music){P.music=null;await loadMusic();msg('Music removed.')}else $('#fmus').click()};
$('#fmus').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;try{P.music=await rd(f);await loadMusic();if(P.music)msg('Music added. It loops quietly under the whole episode.')}catch(x){msg('Could not read that file.')}};
$('#bscript').onclick=()=>{const p=$('#sp');p.hidden=!p.hidden;if(!p.hidden&&!$('#stx').value)$('#stx').value=SAMPLE};
$('#ssample').onclick=()=>{$('#stx').value=SAMPLE};
$('#sbuild').onclick=()=>{const r=parseScript($('#stx').value);if(!r.scenes.length){$('#serr').textContent=r.errs.length?r.errs.join(' · '):'No dialogue found. Use: Name (expression, pose): text';return}
 P.scenes=r.scenes;if(r.title)P.title=r.title;cur=0;sel=-1;ui();$('#serr').textContent=r.errs.length?'Built with notes: '+r.errs.join(' · '):'';msg('Episode built: '+r.scenes.length+' scene(s). Add voices to each line, then Preview.')};
$('#bsave').onclick=()=>saveFile(slug()+'.json',JSON.stringify(P));
$('#bload').onclick=()=>$('#fproj').click();
$('#fproj').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;
 try{const j=JSON.parse(await f.text());if(!j||!Array.isArray(j.scenes)||!j.scenes.length)throw 0;
  j.scenes.forEach(s=>{s.chars=(Array.isArray(s.chars)?s.chars:[]).filter(c=>D[c.id]);s.lines=(Array.isArray(s.lines)?s.lines:[]).filter(l=>D[l.id]&&typeof l.text==='string');s.bg=Math.min(2,Math.max(0,s.bg|0));s.items=Array.isArray(s.items)?s.items:[];s.chars.forEach(c=>{c.pose=Math.min(Math.max(c.pose|0,0),D[c.id].poses.length-1);c.x=+c.x||50;c.y=+c.y||94;c.s=+c.s||1})});
  P=Object.assign(base(),j);if(P.aspect!=='9:16')P.aspect='16:9';cur=0;sel=-1;await loadMusic();applyAspect();ui();msg('Project loaded.')}
 catch(x){msg('That file is not a Toonora project.')}};
$('#play').onclick=()=>play(false);$('#bexp').onclick=()=>play(true);
$('#rsave').onclick=()=>{if(outBlob)saveFile(slug()+'.'+outExt,outBlob)};
/* ---------- stage dragging ---------- */
function pt(e){const r=cv.getBoundingClientRect();return[(e.clientX-r.left)/r.width*cv.width,(e.clientY-r.top)/r.height*cv.height]}
const cap=e=>{try{cv.setPointerCapture(e.pointerId)}catch(z){}};
cv.onpointerdown=e=>{if(run)return;const[x,y]=pt(e),W=cv.width,H=cv.height,g=cv.getContext('2d'),it=sc().items||[];
 for(let i=it.length-1;i>=0;i--){const b=itemBox(g,W,H,it[i]);if(x>=b.x0&&x<=b.x1&&y>=b.y0&&y<=b.y1){selI=i;sel=-1;drag={k:'i',i,dx:x-b.x,dy:y-b.y};cap(e);ui();return}}
 const cs=sc().chars;for(let i=cs.length-1;i>=0;i--){const q=geo(cs[i],W,H);if(x>=q.x-q.w/2&&x<=q.x+q.w/2&&y>=q.y-q.h&&y<=q.y+q.h*.05){sel=i;selI=-1;drag={k:'c',i,dx:x-q.x,dy:y-q.y};cap(e);ui();return}}
 sel=-1;selI=-1;ui()};
cv.onpointermove=e=>{if(!drag||run)return;const[x,y]=pt(e),o=drag.k==='i'?(sc().items||[])[drag.i]:sc().chars[drag.i];if(!o)return;
 o.x=Math.min(100,Math.max(0,(x-drag.dx)/cv.width*100));o.y=drag.k==='i'?Math.min(100,Math.max(0,(y-drag.dy)/cv.height*100)):Math.min(105,Math.max(30,(y-drag.dy)/cv.height*100));redraw()};
cv.onpointerup=cv.onpointercancel=()=>{if(drag){drag=null;ui()}};
/* ---------- studio chrome ---------- */
const openM=id=>{$('#'+id).hidden=false};
document.addEventListener('click',e=>{const c=e.target.closest('[data-close]');if(c){c.closest('.mod').hidden=true}else if(e.target.classList&&e.target.classList.contains('mod'))e.target.hidden=true});
function setTab(t){['c','a','v'].forEach(k=>{$('#tab-'+k).hidden=k!==t});document.querySelectorAll('.tabs button').forEach(b=>b.classList.toggle('on',b.dataset.tab===t))}
document.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>setTab(b.dataset.tab));
document.querySelectorAll('.rail button[data-nav]').forEach(b=>b.onclick=()=>{const n=b.dataset.nav;
 document.querySelectorAll('.rail button').forEach(x=>x.classList.toggle('on',x===b));
 if(n==='home'||n==='chars')setTab('c');else if(n==='anim')setTab('a');else if(n==='voice')setTab('v');
 else if(n==='scenes')$('#tlw').scrollIntoView({behavior:'smooth',block:'nearest'});else if(n==='export')openM('m-export');else if(n==='pro')openM('m-pro')});
$('#bprof').onclick=()=>openM('m-export');$('#mrender').onclick=()=>{$('#m-export').hidden=true;play(true)};
$('#seeall').onclick=()=>openM('m-bg');$('#bgclr').onclick=()=>{sc().bgImg=null;$('#m-bg').hidden=true;ui()};
$('#fbg').addEventListener('change',()=>{$('#m-bg').hidden=true});
function addChar(){const k=Object.keys(D).find(k=>!sc().chars.some(c=>c.id===k));if(!k){msg('All characters are already in this scene.');return}
 sc().chars.push({id:k,pose:0,x:[50,25,75,12,88][sc().chars.length%5],y:portrait()?80:94,s:1,flip:false});sel=sc().chars.length-1;selI=-1;ui()}
$('#addc').onclick=addChar;$('#addc2').onclick=addChar;
$('#wch').onclick=()=>{const n=sc().chars.length;if(n<2){msg(n?'Add another character to switch between them.':'Add a character first.');return}sel=(sel+1)%n;selI=-1;ui()};
$('#tx').oninput=()=>{$('#cnt').textContent=$('#tx').value.length+' / 200'};
$('#vsel').onchange=e=>{const c=sc().chars[sel];if(!c)return;P.voices=P.voices||{};P.voices[c.id]=+e.target.value;ui()};
$('#vplay').onclick=()=>{const c=sc().chars[sel],id=c?c.id:Object.keys(D)[0];tts({id,text:$('#tx').value.trim()||'I have a perfect plan for this delivery.'})};
$('#scsel').onchange=e=>{if(run)return;cur=+e.target.value;sel=-1;selI=-1;ui()};
$('#tprev').onclick=()=>{if(run)return;cur=Math.max(0,cur-1);sel=-1;selI=-1;ui()};
$('#tnext').onclick=()=>{if(run)return;cur=Math.min(P.scenes.length-1,cur+1);sel=-1;selI=-1;ui()};
$('#tplay').onclick=()=>play(false);
function setZoom(n){z=Math.min(200,Math.max(50,n));$('#zv').textContent=z+'%';applyAspect()}
$('#zin').onclick=()=>setZoom(z+10);$('#zout').onclick=()=>setZoom(z-10);$('#fit').onclick=()=>setZoom(100);
$('#grid').onclick=()=>{grid=!grid;$('#grid').style.outline=grid?'2px solid var(--ac)':'';redraw()};
function restore(){P=cl(hist[hi]);hkey=key();cur=Math.min(cur,P.scenes.length-1);sel=-1;selI=-1;loadMusic();applyAspect();ui()}
$('#undo').onclick=()=>{if(run||hi<1)return;hi--;restore()};$('#redo').onclick=()=>{if(run||hi>=hist.length-1)return;hi++;restore()};
$('#tlw').onclick=e=>{if(run)return;if(e.target.id==='addmus'){$('#fmus').click();return}const t=e.target.closest('[data-si]');if(t){cur=+t.dataset.si;sel=-1;selI=-1;ui()}};
document.addEventListener('keydown',e=>{if((e.key==='Delete'||e.key==='Backspace')&&!run&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)&&(sel>=0||selI>=0)){e.preventDefault();$('#rm').click()}});
/* ---------- quick tools ---------- */
const TOOLS={effect:['Effect',[['none','None'],['vignette','Vignette'],['zoom','Slow zoom'],['rain','Rain']],'fx'],transition:['Transition',[['fade','Fade in'],['cut','Cut'],['flash','Flash']],'tr'],filter:['Filter',[['none','None'],['warm','Warm'],['cool','Cool'],['bw','Black & white'],['vintage','Vintage']],'flt']};
const mkb=(t,f,on)=>{const b=document.createElement('button');b.className='chip'+(on?' on':'');b.textContent=t;b.onclick=f;return b};
function openTool(k){const m=$('#mtb');m.innerHTML='';const add=it=>{(sc().items=sc().items||[]).push(it);selI=sc().items.length-1;sel=-1;$('#m-tool').hidden=true;ui()};
 if(k==='sfx'){msg('Sound FX library is coming next. For now, add sound effects through the Music track or a voice file.');return}
 if(k==='text'){$('#mtt').textContent='Add text';const i=document.createElement('input');i.maxLength=60;i.placeholder='Type text…';i.style.cssText='flex:1;min-width:180px;padding:9px;border-radius:10px;border:1px solid var(--bd);background:var(--card)';
  const go=()=>{const v=i.value.trim();if(v)add({k:'t',v,x:50,y:20,s:1})};i.onkeydown=e=>{if(e.key==='Enter')go()};m.append(i,mkb('Add to scene',go,true))}
 else if(k==='sticker'){$('#mtt').textContent='Add sticker';['⭐','❤️','😂','🔥','💥','❓','❗','💡','🎉','👍','😎','💬'].forEach(em=>m.append(mkb(em,()=>add({k:'s',v:em,x:50,y:45,s:1}))))}
 else{const T=TOOLS[k];$('#mtt').textContent=T[0]+' (this scene)';T[1].forEach(([v,n])=>m.append(mkb(n,()=>{sc()[T[2]]=v;$('#m-tool').hidden=true;ui()},(sc()[T[2]]||T[1][0][0])===v)))}
 $('#m-tool').hidden=false;const f=m.querySelector('input');if(f)f.focus()}
document.querySelectorAll('.qg button').forEach(b=>b.onclick=()=>openTool(b.dataset.tool));
window.addEventListener('resize',()=>{if(!run)tlWave()});
applyAspect();ui();setBtns();
