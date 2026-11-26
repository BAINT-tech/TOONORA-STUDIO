/* Toonora Autonomous Episode Builder — character intelligence, rule-based story engine, animation planner, builder UI.
   Loads BEFORE app.js (registers saved custom characters), uses app.js globals (D, P, ui, msg…) only when called. */
(function(){
const T=window.Toonora=window.Toonora||{},C=window.CHARS=window.CHARS||{};
const LS=(k,v)=>{try{if(v===undefined)return JSON.parse(localStorage.getItem(k)||'null');localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return v===undefined?null:false}};
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const q=s=>document.querySelector(s),BG=['Park','Street','Sunset'],BEATS=['Beginning','Middle','Ending'];
/* ---------- 1. character information ---------- */
const DEF={max:{age:23,traits:['Ambitious','Confident','Focused'],look:'Tall, short curly hair with faded sides, blue and white varsity jacket with an M, black cargo pants, blue sneakers.',rel:'Oliver: close friend whose chaos he tries to organise.\nMia: trusted friend who often improves his plans.',voice:0},
 oliver:{age:21,traits:['Funny','Energetic','Fearless'],look:'Messy twisted curls, red hoodie with a crown logo, headphones around his neck, black cargo pants, red sneakers.',rel:'Max: best friend and favourite person to tease.\nMia: friend he is always trying to impress.',voice:1},
 mia:{age:22,traits:['Calm','Clever','Observant'],look:'Long braids in a high ponytail, gold hoop earrings, purple butterfly crop top, blue cargo jeans, purple sneakers.',rel:'Max: friend who values his planning.\nOliver: friend she keeps out of trouble.',voice:0}};
const blankInfo=()=>({age:'',traits:[],look:'',rel:'',voice:0});
T.info={};T.customList=LS('toonora_custom')||[];
function reg(c){if(!c||!c.id||C[c.id]||!c.pose||!c.name)return false;C[c.id]={name:String(c.name),role:c.role||'Friend',pitch:1,color:c.color||'#0ea5a4',poses:[c.pose],exps:[c.face||c.pose],exn:['Normal'],pn:['Standing']};T.info[c.id]=Object.assign(blankInfo(),c.info||{});return true}
Object.keys(C).forEach(k=>{T.info[k]=Object.assign(blankInfo(),DEF[k]||{})});
T.customList.forEach(reg);
const saved=LS('toonora_info')||{};Object.keys(saved).forEach(k=>{if(T.info[k])Object.assign(T.info[k],saved[k])});
const saveInfo=()=>{LS('toonora_info',T.info);T.attach()};
T.attach=()=>{T.customList.forEach(c=>{c.info=T.info[c.id]});try{if(typeof P!=='undefined'&&P)P.custom=T.customList.length?T.customList:undefined}catch(e){}};
T.regCustom=list=>{let n=0;(Array.isArray(list)?list:[]).forEach(c=>{if(reg(c)){T.customList.push(c);n++}});if(n){LS('toonora_custom',T.customList);if(typeof buildLib==='function')buildLib()}return n};
const roleOf=id=>{const r=(C[id].role||'');return /plan/i.test(r)?'P':/trouble/i.test(r)?'T':/solv/i.test(r)?'S':'F'};
/* ---------- 2. rule-based story engine ---------- */
const est=t=>Math.max(2,Math.round((t.length*.07+.8)*2)/2),n=id=>C[id].name;
const S=(id,exp,pose,text)=>({id,exp,pose,text,dur:est(text)});
const Sc=(title,beat,bg,desc,...steps)=>({title,beat,bg,desc,steps});
function cast(idea){const ids=Object.keys(C),by=r=>ids.find(i=>roleOf(i)===r),low=idea;
 const f=ids.map(i=>({i,p:low.search(new RegExp('\\b'+n(i).replace(/[^\w ]/g,'')+'\\b','i'))})).filter(x=>x.p>=0).sort((a,b)=>a.p-b.p).map(x=>x.i);
 const slot={A:null,B:null,K:null},rk={A:'P',B:'T',K:'S'},used=()=>Object.values(slot);
 f.forEach(i=>{const k=Object.keys(rk).find(k=>rk[k]===roleOf(i)&&!slot[k]);if(k)slot[k]=i});
 f.forEach(i=>{if(!used().includes(i)){const k=Object.keys(slot).find(k=>!slot[k]);if(k)slot[k]=i}});
 Object.keys(slot).forEach(k=>{if(!slot[k])slot[k]=[by(rk[k]),...ids].find(i=>i&&!used().includes(i))||ids[0]});
 const A=slot.A,B=slot.B,K=slot.K,H=f[0]||B,G=f[1]||[K,A,B].find(i=>i!==H)||H,R=[A,K,B,ids[0]].find(i=>i!==H&&i!==G)||G;
 return{A,B,K,H,G,R}}
const TPL=[
{re:/rich|money|impress|fancy|expensive|millionaire|pretend/i,go:(c)=>{const{H,G,R}=c;return{title:'The Rich Illusion',beats:[n(H)+' decides to impress '+n(G)+' by pretending to be rich.',n(R)+' knows the truth, and the pretending gets bigger and sillier.',n(G)+' explains that honesty is more impressive than money, and '+n(H)+' agrees.'],scenes:[
 Sc('A brilliant idea','Beginning',1,n(H)+' announces the plan to look rich.',S(H,'Happy','Excited','I have a brilliant idea! Today, I’m pretending to be super rich.'),S(R,'Confused','Talking','Since when? You borrowed my bus fare yesterday.'),S(H,'Laughing','Pointing','Shh! Just play along.')),
 Sc('The first impression','Middle',0,n(G)+' meets the “millionaire”.',S(G,'Happy','Waving','Hey, what are you two up to?'),S(H,'Happy','Talking','Oh, just back from my private jet. Well… my private jet-shaped bus.'),S(G,'Confused','Thinking','Interesting. Rich people don’t usually count coins.'),S(H,'Surprised','Talking','Count? I’m… counting my many, many coins!')),
 Sc('The limousine','Middle',1,'The lies fall apart.',S(R,'Angry','Pointing',n(H)+', your limousine is a shopping cart!'),S(H,'Confused','Standing','It’s a very exclusive cart.'),S(G,'Laughing','Standing','This is the funniest thing all day!')),
 Sc('The honest truth','Ending',2,n(H)+' tells the truth.',S(H,'Serious','Standing','Okay… I’m not rich. I just wanted you to like me.'),S(G,'Happy','Talking','You don’t need money to impress me. Just be yourself.'),S(H,'Happy','Waving','Deal. And I still have really great jokes.'),S(R,'Laughing','Standing','That’s the real fortune.'))]}}},
{re:/missing|lost|stolen|package|delivery|mystery|find|search/i,go:(c)=>{const{A,B,K}=c;return{title:'The Missing Package',beats:[n(A)+' has a perfect delivery plan, but '+n(B)+' isn’t taking it seriously.',' The package vanishes and '+n(K)+' spots a clue.',' The clue leads to a surprising culprit and the friends laugh about it.'],scenes:[
 Sc('The perfect plan','Beginning',1,n(A)+' explains the delivery plan.',S(A,'Serious','Talking','I have a perfect plan for this delivery.'),S(B,'Laughing','Excited','Plans? Where’s the fun in that?'),S(K,'Serious','Thinking','Let’s find a better way.')),
 Sc('Gone!','Middle',0,'The package disappears.',S(B,'Surprised','Pointing','Wait… the package is already gone!'),S(A,'Angry','Talking','What?! I planned everything!'),S(K,'Happy','Pointing','Look. There are tiny footprints.')),
 Sc('Following the clue','Middle',1,'The friends follow the footprints.',S(K,'Serious','Talking','The footprints lead this way.'),S(B,'Confused','Talking','Why is this clue so small?'),S(A,'Confused','Thinking','Footprints don’t usually have paws…')),
 Sc('Case closed','Ending',2,'The culprit is revealed.',S(K,'Happy','Waving','Found it! A puppy borrowed the package for a nap.'),S(A,'Happy','Standing','Okay. Best delivery ever.'),S(B,'Laughing','Excited','Told you the fun was worth it!'))]}}},
{re:/surprise|party|birthday|celebrat/i,go:(c)=>{const{A,B,K}=c;return{title:'The Surprise Party',beats:[n(A)+' and '+n(B)+' plan a surprise party for '+n(K)+'.',n(B)+' ruins part of the plan and everyone panics.',n(K)+' loves the party anyway.'],scenes:[
 Sc('The secret plan','Beginning',0,'The friends plan the party.',S(A,'Happy','Talking','Today is '+n(K)+'’s birthday, so we’re planning a surprise party!'),S(B,'Happy','Excited','I’ll handle the music and snacks!'),S(A,'Serious','Pointing','Everything must go exactly to plan.')),
 Sc('Oops','Middle',1,'The cake goes missing.',S(B,'Surprised','Standing','Oops… I ate the cake.'),S(A,'Angry','Talking','What?!'),S(B,'Laughing','Standing','It was too tasty to resist!')),
 Sc('Acting normal','Middle',0,n(K)+' gets suspicious.',S(K,'Confused','Thinking','Why are you two acting so strange?'),S(A,'Surprised','Standing','Nothing! Absolutely nothing!'),S(B,'Confused','Talking','We’re just… exercising.')),
 Sc('Surprise!','Ending',2,'The party begins.',S(A,'Happy','Talking','Surprise!'),S(K,'Surprised','Standing','You did all this for me?'),S(K,'Happy','Talking','Even without the cake, this is perfect.'),S(B,'Laughing','Excited','There’s always next year’s cake!'))]}}},
{re:/./,go:(c)=>{const{A,B,K}=c;return{title:'Big Plans, Bigger Trouble',beats:[n(A)+' announces a big plan for the day.',n(B)+' causes trouble and the plan falls apart.',n(K)+' finds a smarter way and the friends win together.'],scenes:[
 Sc('The big plan','Beginning',1,n(A)+' shares the plan.',S(A,'Serious','Talking','Listen up. I have a big plan for today.'),S(B,'Happy','Excited','Sounds fun! What could go wrong?'),S(K,'Serious','Thinking','Everything. Let’s be careful.')),
 Sc('Uh-oh','Middle',0,'Something goes wrong.',S(B,'Surprised','Pointing','Uh-oh. Something just went wrong.'),S(A,'Angry','Talking','That’s not in the plan!')),
 Sc('A better way','Middle',1,n(K)+' steps in.',S(K,'Happy','Pointing','Wait. I have a better way.'),S(B,'Confused','Talking','Better than my plan?'),S(K,'Serious','Talking','Better than both of our plans.')),
 Sc('Teamwork','Ending',2,'The friends celebrate.',S(A,'Happy','Standing','It worked. Teamwork wins.'),S(B,'Laughing','Excited','Told you it would be fun!'),S(K,'Happy','Waving','Until next time, everyone.'))]}}}];
T.engines={rules:{label:'Rule-based (offline)',generate:idea=>{const t=TPL.find(x=>x.re.test(idea)),r=t.go(cast(idea));return{id:null,idea,engine:'rules',title:r.title,summary:'Idea: “'+idea.replace(/[.!?\s]+$/,'')+'”. '+r.beats.map(s=>s.trim()).join(' '),beats:r.beats.map(s=>s.trim()),scenes:r.scenes}}}};
T.engine='rules';
/* ---------- 3. animation planner: only assets the engine really has ---------- */
const find=(list,v)=>list.findIndex(x=>x.toLowerCase()===String(v||'').toLowerCase());
const fixExp=(id,v)=>{const l=C[id].exn,i=find(l,v);return i>=0?l[i]:l[0]};
const fixPose=(id,v)=>{const l=C[id].pn;let i=find(l,v);if(i<0)i=find(l,'Talking');if(i<0)i=0;return l[i]};
T.plan=raw=>{const ep=JSON.parse(JSON.stringify(raw||{})),notes=[];ep.title=String(ep.title||'Untitled episode');ep.summary=String(ep.summary||'');ep.beats=[0,1,2].map(i=>String((ep.beats||[])[i]||''));
 ep.scenes=(Array.isArray(ep.scenes)?ep.scenes:[]).map((s,si)=>{const L='Scene '+(si+1);s.title=String(s.title||L);s.desc=String(s.desc||'');s.beat=BEATS.includes(s.beat)?s.beat:'Middle';
  const bi=find(BG,s.bg);if(bi<0){notes.push(L+': background “'+s.bg+'” is not available, used Street.');s.bg='Street'}else s.bg=BG[bi];
  s.steps=(Array.isArray(s.steps)?s.steps:[]).filter(st=>{if(!st||!C[st.id]){notes.push(L+': a line was removed because its character no longer exists.');return false}return String(st.text||'').trim()}).map(st=>{
   const e=fixExp(st.id,st.exp),p=fixPose(st.id,st.pose);
   if(find(C[st.id].exn,st.exp)<0&&st.exp)notes.push(L+', '+n(st.id)+': expression “'+st.exp+'” is not available, used '+e+'.');
   if(find(C[st.id].pn,st.pose)<0&&st.pose)notes.push(L+', '+n(st.id)+': pose “'+st.pose+'” is not available, used '+p+'.');
   return{id:st.id,exp:e,pose:p,text:String(st.text).trim(),dur:Math.max(1,Math.min(20,parseFloat(st.dur)||est(String(st.text))))}});
  s.chars=[...new Set(s.steps.map(x=>x.id))];s.dur=s.steps.reduce((a,x)=>a+x.dur,0);return s});
 return{ep,notes}};
T.generate=idea=>{const e=T.engines[T.engine];return T.plan(e.generate(idea))};
const planText=ep=>ep.scenes.map((s,i)=>'Scene '+(i+1)+' — '+s.title+' ('+s.beat+', about '+s.dur+' s)\n  Background: '+s.bg+' (built-in preset)\n  Characters: '+(s.chars.map(n).join(', ')||'none')+'\n'+s.steps.map(x=>'  • '+n(x.id)+' | Pose: '+x.pose+' | Expression: '+x.exp+' | Says: “'+x.text+'” | '+x.dur+' s').join('\n')).join('\n\n');
/* ---------- 4. transfer into the workspace ---------- */
T.build=raw=>{const{ep}=T.plan(raw);if(!ep.scenes.some(s=>s.steps.length))return false;const por=P.aspect==='9:16',pi=(id,v)=>Math.max(0,find(C[id].pn,v)),ei=(id,v)=>Math.max(0,find(C[id].exn,v)),voices=Object.assign({},P.voices||{});
 const scenes=ep.scenes.filter(s=>s.steps.length).map(s=>{const ids=s.chars,k=ids.length,xs=k===1?[50]:k===2?[30,70]:k===3?[20,50,80]:ids.map((_,i)=>10+80*i/(k-1));ids.forEach(id=>{voices[id]=(T.info[id]&&T.info[id].voice)|0});
  return{bg:Math.max(0,find(BG,s.bg)),bgImg:null,chars:ids.map((id,i)=>({id,pose:pi(id,s.steps.find(x=>x.id===id).pose),x:xs[i],y:por?80:94,s:1,flip:false})),lines:s.steps.map(x=>({id:x.id,exp:ei(x.id,x.exp),pose:pi(x.id,x.pose),text:x.text,hold:x.dur})),items:[],fx:'none',flt:'none',tr:'fade'}});
 P=Object.assign(base(),{title:ep.title,aspect:P.aspect,music:P.music,voices,scenes});T.attach();cur=0;sel=-1;selI=-1;applyAspect();ui();return scenes.length};
/* ---------- 5. builder UI ---------- */
const U=T.ui={tab:'idea',idea:'',ep:null,notes:[],edit:null};
const draftSave=()=>LS('toonora_ep_draft',{idea:U.idea,ep:U.ep});
const dr=LS('toonora_ep_draft');if(dr&&dr.ep){U.idea=dr.idea||'';try{U.ep=T.plan(dr.ep).ep}catch(e){U.ep=null}}
const say=t=>{const a=q('#amsg');if(a)a.textContent=t;else if(typeof msg==='function')msg(t)};
const opts=(l,v)=>l.map(x=>'<option'+(String(x).toLowerCase()===String(v).toLowerCase()?' selected':'')+'>'+esc(x)+'</option>').join('');
const charOpts=v=>Object.keys(C).map(id=>'<option value="'+id+'"'+(id===v?' selected':'')+'>'+esc(n(id))+'</option>').join('');
const EXAMPLES=['Create a funny episode where Oliver tries to impress Mia by pretending to be rich.','Max plans a perfect delivery but the package goes missing.','The friends plan a surprise birthday party for Mia.'];
function rIdea(b){b.innerHTML='<p class="hint">Describe your episode. Mention characters by name to choose who stars. The built-in story engine works offline with no AI service or API key.</p><textarea id="aidea" rows="4" placeholder="'+esc(EXAMPLES[0])+'">'+esc(U.idea)+'</textarea><div class="row" style="margin:8px 0">'+EXAMPLES.map((x,i)=>'<button class="chip" data-ex="'+i+'">Example '+(i+1)+'</button>').join('')+'</div><button class="bb wide" data-a="gen">Generate episode</button><small id="amsg" class="hint">Engine: '+esc(T.engines[T.engine].label)+'</small>'}
function rEp(b){const E=U.ep;if(!E){b.innerHTML='<p>No episode yet. Write an idea first.</p><button class="bb" data-go="idea">Go to idea</button>';return}
 const scenes=E.scenes.map((s,i)=>'<div class="acard"><div class="row"><b>Scene '+(i+1)+'</b><select data-k="sbeat" data-s="'+i+'" style="flex:0 1 120px">'+opts(BEATS,s.beat)+'</select><small id="ds'+i+'">about '+Math.round(s.steps.reduce((a,x)=>a+x.dur,0))+' s</small><div class="sp"></div><button class="chip" data-a="up" data-s="'+i+'">↑</button><button class="chip" data-a="down" data-s="'+i+'">↓</button><button class="chip rd" data-a="dels" data-s="'+i+'">✕</button></div>'
  +'<input type="text" data-k="stitle" data-s="'+i+'" value="'+esc(s.title)+'" aria-label="Scene title"><div class="row" style="margin:6px 0"><label>Background <select data-k="sbg" data-s="'+i+'">'+opts(BG,s.bg)+'</select></label></div><textarea rows="2" data-k="sdesc" data-s="'+i+'" aria-label="Scene description">'+esc(s.desc)+'</textarea>'
  +s.steps.map((x,t)=>'<div class="stp"><div class="row"><select data-k="sid" data-s="'+i+'" data-t="'+t+'">'+charOpts(x.id)+'</select><select data-k="sexp" data-s="'+i+'" data-t="'+t+'">'+opts(C[x.id].exn,x.exp)+'</select><select data-k="spose" data-s="'+i+'" data-t="'+t+'">'+opts(C[x.id].pn,x.pose)+'</select><input type="number" min="1" max="20" step="0.5" data-k="sdur" data-s="'+i+'" data-t="'+t+'" value="'+x.dur+'" style="flex:0 1 70px" aria-label="Seconds"><button class="chip rd" data-a="delst" data-s="'+i+'" data-t="'+t+'">✕</button></div><textarea rows="2" data-k="stext" data-s="'+i+'" data-t="'+t+'">'+esc(x.text)+'</textarea></div>').join('')
  +'<button class="chip" data-a="addst" data-s="'+i+'">+ Add line</button></div>').join('');
 b.innerHTML='<h4>Episode</h4><input type="text" data-k="title" value="'+esc(E.title)+'" aria-label="Episode title"><h4>Story summary</h4><textarea rows="3" data-k="summary">'+esc(E.summary)+'</textarea>'+BEATS.map((x,i)=>'<h4>'+x+'</h4><textarea rows="2" data-k="b'+i+'">'+esc(E.beats[i])+'</textarea>').join('')+'<h4>Scenes</h4>'+scenes
  +'<div class="row"><button class="chip" data-a="adds">+ Add scene</button><button class="chip" data-a="plan">Animation plan →</button><button class="chip" data-a="save">Save episode</button></div><p><button class="bb wide" data-a="build">BUILD EPISODE</button></p><small id="amsg" class="hint"></small>'}
function rPlan(b){if(!U.ep){b.innerHTML='<p>No episode yet.</p><button class="bb" data-go="idea">Go to idea</button>';return}const r=T.plan(U.ep);U.ep=r.ep;draftSave();
 b.innerHTML='<p class="hint">Animation instructions the engine can really perform: pose changes, expressions (shown as a portrait in the speech bubble), captions, browser voice preview, and built-in backgrounds. Characters start on stage in set positions. There is no walking or lip-sync animation yet.</p>'+(r.notes.length?'<div class="acard"><b>Adjusted to available assets</b><ul>'+r.notes.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul></div>':'')+'<pre class="plan">'+esc(planText(r.ep))+'</pre><div class="row"><button class="chip" data-go="ep">← Edit episode</button><button class="bb" data-a="build">BUILD EPISODE</button></div><small id="amsg" class="hint"></small>'}
function charForm(id){const isNew=id==='__new',c=isNew?{name:'',role:'',color:'#0ea5a4'}:C[id],i=isNew?blankInfo():T.info[id],VPn=(typeof VP!=='undefined'?VP:[{n:'Calm & Confident'}]).map(v=>v.n);
 return '<div class="acard"><b>'+(isNew?'New character':'Edit '+esc(c.name))+'</b>'+(isNew?'<label>Name<input type="text" id="cf-name" maxlength="20"></label>':'')+'<label>Role<input type="text" id="cf-role" maxlength="40" value="'+esc(c.role==='Friend'&&isNew?'':c.role)+'"></label><label>Age<input type="number" id="cf-age" min="1" max="120" value="'+esc(i.age)+'"></label><label>Personality (comma separated)<input type="text" id="cf-traits" value="'+esc(i.traits.join(', '))+'"></label><label>Appearance<textarea id="cf-look" rows="2">'+esc(i.look)+'</textarea></label><label>Relationships (one per line, Name: relationship)<textarea id="cf-rel" rows="3">'+esc(i.rel)+'</textarea></label><label>Voice<select id="cf-voice">'+VPn.map((v,k)=>'<option value="'+k+'"'+(k===(i.voice|0)?' selected':'')+'>'+esc(v)+'</option>').join('')+'</select></label>'
  +(isNew?'<label>Colour<input type="color" id="cf-color" value="'+c.color+'"></label><label>Full-body image (transparent PNG in the Toonora style works best)<input type="file" id="cf-img" accept="image/*"></label>':'')+'<div class="row" style="margin-top:8px"><button class="bb" data-a="csave" data-id="'+id+'">Save character</button><button class="chip" data-a="ccancel">Cancel</button></div></div>'}
function rChars(b){const VPn=(typeof VP!=='undefined'?VP:[{n:'Calm & Confident'}]).map(v=>v.n);
 b.innerHTML='<p class="hint">The story engine uses this information when writing episodes. Edit anything here; changes are saved in this browser.</p>'+Object.keys(C).map(id=>{const i=T.info[id];return '<div class="acard"><div class="who2"><img src="'+C[id].exps[0]+'" alt=""><div><b>'+esc(n(id))+'</b> <small>'+esc(C[id].role)+(i.age?' · Age '+esc(i.age):'')+'</small><br><small>'+esc(i.traits.join(', '))+'</small></div></div><small class="hint">Appearance: '+esc(i.look||'—')+'<br>Relationships: '+esc((i.rel||'—').replace(/\n/g,' · '))+'<br>Expressions: '+esc(C[id].exn.join(', '))+'<br>Movements: '+esc(C[id].pn.join(', '))+'<br>Voice: '+esc(VPn[i.voice|0]||VPn[0])+'</small><div class="row" style="margin-top:6px"><button class="chip" data-a="echar" data-id="'+id+'">Edit</button></div></div>'+(U.edit===id?charForm(id):'')}).join('')+(U.edit==='__new'?charForm('__new'):'<button class="bb wide" data-a="echar" data-id="__new">+ New character</button>')+'<small id="amsg" class="hint"></small>'}
function rSaved(b){const L=LS('toonora_eps')||[];b.innerHTML='<div class="row"><button class="bb" data-a="save">Save current episode</button><button class="chip" data-a="import">Import episode file</button></div><small id="amsg" class="hint"></small>'+(L.length?L.map(x=>'<div class="acard"><b>'+esc(x.title)+'</b><br><small>'+new Date(x.updated).toLocaleString()+' · '+x.ep.scenes.length+' scenes</small><div class="row" style="margin-top:6px"><button class="chip" data-a="open" data-id="'+esc(x.id)+'">Open &amp; edit</button><button class="chip" data-a="dl" data-id="'+esc(x.id)+'">Download file</button><button class="chip rd" data-a="del" data-id="'+esc(x.id)+'">Delete</button></div></div>').join(''):'<p class="hint">No saved episodes yet.</p>')}
function render(){const b=q('#abody');if(!b)return;document.querySelectorAll('#atabs button').forEach(x=>x.classList.toggle('on',x.dataset.at===U.tab));({idea:rIdea,ep:rEp,plan:rPlan,chars:rChars,saved:rSaved})[U.tab](b)}
const go=t=>{U.tab=t;render()};
function saveEp(){if(!U.ep){say('Generate an episode first.');return}const L=LS('toonora_eps')||[];U.ep.id=U.ep.id||Date.now().toString(36);const r={id:U.ep.id,title:U.ep.title,updated:Date.now(),idea:U.idea,ep:U.ep},i=L.findIndex(x=>x.id===r.id);if(i>=0)L[i]=r;else L.unshift(r);say(LS('toonora_eps',L)?'Episode saved in this browser.':'Could not save: browser storage is full or blocked. Use Download file instead.');draftSave()}
function prep(file){return new Promise((res,rej)=>{const im=new Image(),u=URL.createObjectURL(file);im.onerror=()=>{URL.revokeObjectURL(u);rej(new Error('That image could not be read.'))};im.onload=()=>{URL.revokeObjectURL(u);
 try{const k=Math.min(1,900/im.naturalHeight),w=Math.max(1,Math.round(im.naturalWidth*k)),h=Math.max(1,Math.round(im.naturalHeight*k)),cv=document.createElement('canvas');cv.width=w;cv.height=h;const g=cv.getContext('2d');g.drawImage(im,0,0,w,h);const d=g.getImageData(0,0,w,h),a=d.data,px=(x,y)=>(y*w+x)*4;
 if([[0,0],[w-1,0],[0,h-1],[w-1,h-1]].every(([x,y])=>a[px(x,y)+3]>250)){const m=[0,1,2].map(c=>{const v=[];for(let x=0;x<w;x++){v.push(a[px(x,0)+c],a[px(x,h-1)+c])}for(let y=0;y<h;y++){v.push(a[px(0,y)+c],a[px(w-1,y)+c])}v.sort((p,r)=>p-r);return v[v.length>>1]}),seen=new Uint8Array(w*h),st=[],tol=42*42;
  const add=(x,y)=>{const i=y*w+x;if(seen[i])return;const p=i*4,dd=(a[p]-m[0])**2+(a[p+1]-m[1])**2+(a[p+2]-m[2])**2;if(dd<tol){seen[i]=1;st.push(x,y)}};
  for(let x=0;x<w;x++){add(x,0);add(x,h-1)}for(let y=0;y<h;y++){add(0,y);add(w-1,y)}
  while(st.length){const y=st.pop(),x=st.pop();a[px(x,y)+3]=0;if(x>0)add(x-1,y);if(x<w-1)add(x+1,y);if(y>0)add(x,y-1);if(y<h-1)add(x,y+1)}g.putImageData(d,0,0)}
 let x0=w,y0=h,x1=-1,y1=-1;const e=g.getImageData(0,0,w,h).data;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(e[px(x,y)+3]>12){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}
 if(x1<0)throw new Error('No character found in that image.');const bw=x1-x0+1,bh=y1-y0+1,o=document.createElement('canvas');o.height=380;o.width=Math.max(1,Math.round(bw*380/bh));o.getContext('2d').drawImage(cv,x0,y0,bw,bh,0,0,o.width,o.height);
 const fs=Math.min(bw,bh*.3),f=document.createElement('canvas');f.width=140;f.height=140;const fg=f.getContext('2d');fg.fillStyle='#fff';fg.fillRect(0,0,140,140);fg.drawImage(cv,x0+(bw-fs)/2,y0,fs,fs,0,0,140,140);
 res({pose:o.toDataURL('image/png'),face:f.toDataURL('image/jpeg',.85)})}catch(er){rej(er)}};im.src=u})}
async function charSave(id){const g=x=>(q('#cf-'+x)||{}).value,info=()=>({age:g('age')===''?'':+g('age'),traits:String(g('traits')||'').split(',').map(s=>s.trim()).filter(Boolean),look:g('look')||'',rel:g('rel')||'',voice:+g('voice')||0});
 if(id!=='__new'){C[id].role=(g('role')||C[id].role).trim();T.info[id]=info();const cu=T.customList.find(c=>c.id===id);if(cu){cu.role=C[id].role;LS('toonora_custom',T.customList)}saveInfo();U.edit=null;render();say('Character saved.');return}
 const name=String(g('name')||'').trim(),f=(q('#cf-img')||{}).files&&q('#cf-img').files[0];
 if(!/^[A-Za-z0-9 ]{1,20}$/.test(name)){say('Use a name of letters, numbers and spaces (up to 20).');return}
 if(Object.keys(C).some(k=>C[k].name.toLowerCase()===name.toLowerCase())){say('A character with that name already exists.');return}
 if(!f){say('Choose a full-body image first.');return}
 say('Processing image…');try{const im=await prep(f);let cid=name.toLowerCase().replace(/ /g,'-');while(C[cid])cid+='-x';
  const rec={id:cid,name,role:(g('role')||'Friend').trim(),color:g('color')||'#0ea5a4',pose:im.pose,face:im.face,info:info()};reg(rec);T.customList.push(rec);const ok=LS('toonora_custom',T.customList);saveInfo();if(typeof buildLib==='function')buildLib();if(typeof ui==='function')ui();U.edit=null;render();say(ok?name+' was added to the library.':name+' was added for this session, but browser storage is full, so use Save project to keep it.')}catch(er){say(er.message||'Could not add that character.')}}
function click(e){const t=e.target.closest('button');if(!t)return;const d=t.dataset,E=U.ep,s=E&&E.scenes[+d.s];
 if(d.ex!=null){q('#aidea').value=EXAMPLES[+d.ex];return}if(d.go){go(d.go);return}
 switch(d.a){
 case 'gen':{const v=(q('#aidea').value||'').trim();if(!v){say('Write an idea first.');return}U.idea=v;const r=T.generate(v);U.ep=r.ep;U.notes=r.notes;draftSave();go('ep');break}
 case 'up':if(d.s>0){[E.scenes[d.s-1],E.scenes[+d.s]]=[E.scenes[+d.s],E.scenes[d.s-1]];draftSave();render()}break;
 case 'down':if(+d.s<E.scenes.length-1){[E.scenes[+d.s+1],E.scenes[+d.s]]=[E.scenes[+d.s],E.scenes[+d.s+1]];draftSave();render()}break;
 case 'dels':E.scenes.splice(+d.s,1);draftSave();render();break;
 case 'adds':E.scenes.push({title:'New scene',beat:'Middle',bg:'Street',desc:'',steps:[{id:Object.keys(C)[0],exp:'Happy',pose:'Talking',text:'New line.',dur:2}]});draftSave();render();break;
 case 'addst':{const id=s.steps.length?s.steps[s.steps.length-1].id:Object.keys(C)[0];s.steps.push({id,exp:fixExp(id,'Happy'),pose:fixPose(id,'Talking'),text:'New line.',dur:2});draftSave();render();break}
 case 'delst':s.steps.splice(+d.t,1);draftSave();render();break;
 case 'plan':go('plan');break;case 'save':saveEp();break;
 case 'build':{if(!U.ep){say('Generate an episode first.');return}const k=T.build(U.ep);if(!k){say('Add at least one line of dialogue before building.');return}draftSave();q('#m-auto').hidden=true;msg('Episode built: '+k+' scenes. Press Preview to play it, or tap a scene to edit. Undo restores your previous project.');break}
 case 'echar':U.edit=U.edit===d.id?null:d.id;render();break;case 'ccancel':U.edit=null;render();break;case 'csave':charSave(d.id);break;
 case 'open':{const r=(LS('toonora_eps')||[]).find(x=>x.id===d.id);if(r){U.ep=T.plan(r.ep).ep;U.ep.id=r.id;U.idea=r.idea||'';draftSave();go('ep')}break}
 case 'dl':{const r=(LS('toonora_eps')||[]).find(x=>x.id===d.id);if(r&&typeof saveFile==='function')saveFile((r.title.replace(/[^\w\- ]+/g,'').trim().replace(/\s+/g,'-')||'episode')+'.toonora-episode.json',JSON.stringify({toonoraEpisode:1,idea:r.idea,ep:r.ep}));break}
 case 'del':LS('toonora_eps',(LS('toonora_eps')||[]).filter(x=>x.id!==d.id));render();break;
 case 'import':q('#fepi').click();break}}
function edit(e){const t=e.target,k=t.dataset.k;if(!k||!U.ep)return;const E=U.ep,s=E.scenes[+t.dataset.s],st=s&&s.steps[+t.dataset.t],v=t.value;
 switch(k){case 'title':E.title=v;break;case 'summary':E.summary=v;break;case 'b0':case 'b1':case 'b2':E.beats[+k[1]]=v;break;case 'stitle':s.title=v;break;case 'sdesc':s.desc=v;break;case 'sbg':s.bg=v;break;case 'sbeat':s.beat=v;break;
 case 'sid':st.id=v;st.exp=fixExp(v,st.exp);st.pose=fixPose(v,st.pose);draftSave();render();return;case 'sexp':st.exp=v;break;case 'spose':st.pose=v;break;
 case 'sdur':st.dur=Math.max(1,Math.min(20,parseFloat(v)||2));{const l=q('#ds'+t.dataset.s);if(l)l.textContent='about '+Math.round(s.steps.reduce((a,x)=>a+x.dur,0))+' s'}break;case 'stext':st.text=v;break}
 draftSave()}
document.addEventListener('DOMContentLoaded',()=>{const b=q('#abody');if(!b)return;b.addEventListener('click',click);b.addEventListener('input',edit);
 q('#atabs').onclick=e=>{const t=e.target.closest('button');if(t)go(t.dataset.at)};
 q('#bauto').onclick=()=>{q('#m-auto').hidden=false;render()};
 q('#fepi').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;try{const j=JSON.parse(await f.text()),raw=j.ep||j;if(!raw||!Array.isArray(raw.scenes))throw 0;U.ep=T.plan(raw).ep;U.idea=j.idea||'';draftSave();go('ep')}catch(x){say('That file is not a Toonora episode.')}}});
})();
