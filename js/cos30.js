/* v3.0 cosmetics layer. Loaded after limited.js and BEFORE storage.js (Store.load() validates saved cosmetic ids with Cos.by()).
   1) RankFx: one shared definition of every rank gradient (rank text, promotion screen, Rank-Up Gradient cosmetics, inventory, equipped names). Ranks from page 3 on (index 22+) animate;
      Elite / Obsidian / Netherite / Bedrock (index 35+) also get an outline + particle family (CSS in css/update30.css, keyed on .rkf-<family>).
   2) 47 Rank-Up Gradient cosmetics (id rg_<rank index>, "<Rank Name> Gradient"). Limited + unsellable; granted by the Mastery "Rank-Up Gradients" objective (js/mastery.js).
   3) ACHDEF: the Achievements data (15 tracks x 5 levels) and 36 exclusive achievement cosmetics (id a_<track>_<level>, rarity "exclusive", unsellable).
   Everything here is data + presentation; progress / claiming lives in js/achievements.js. Cosmetics have no gameplay effect. */
CFG.RAR.exclusive={n:'Exclusive',gems:0,deal:0,w:0,color:'#ff9de2'};
const RankFx=(()=>{
const fam=i=>i>=44?'bedrock':i>=41?'netherite':i>=38?'obsidian':i>=35?'elite':'';
const FS={elite:['#1a1300','#8a6a00','#ffd84d','#fff1a8','#ffd84d','#8a6a00','#1a1300'],obsidian:['#0b0014','#3b0a6e','#a855f7','#e9d5ff','#a855f7','#3b0a6e','#0b0014'],
netherite:['#26262b','#4a4a52','#8a8a96','#4a4a52','#26262b'],bedrock:['#000000','#6b6b6b','#ffffff','#6b6b6b','#000000']};
const anim=i=>i>=22;
const stops=i=>{const f=fam(i),g=CFG.RANKS[i].g;return f?FS[f]:[g[0],g[1],g[0]]};
const grad=i=>anim(i)?`linear-gradient(90deg,${stops(i).join(',')})`:`linear-gradient(135deg,${CFG.RANKS[i].g[0]},${CFG.RANKS[i].g[1]})`;
return{fam,anim,stops,grad,FS}})();
const X30=(()=>{
const out=[],by={},add=c=>{out.push(c);by[c.id]=c};
const hexRGB=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)),lum=r=>(.2126*r[0]+.7152*r[1]+.0722*r[2])/255,
lift=r=>{const L=lum(r);if(L>=.55)return r;const t=(.55-L)/(1-L);return r.map(v=>Math.round(v+(255-v)*t))},hx=r=>'#'+r.map(v=>v.toString(16).padStart(2,'0')).join('');
const pal=st=>{const u=[...new Set(st.map(x=>x.toLowerCase()))].map(hexRGB).sort((a,b)=>lum(b)-lum(a)),n=u.length;return[u[0],u[Math.floor((n-1)/2)],u[n-1]].map(r=>hx(lift(r)))};
const loop=st=>st[0].toLowerCase()===st[st.length-1].toLowerCase()?st:st.concat(st[0]);
/* ---- rank gradients ---- */
CFG.RANKS.forEach((r,i)=>{const f=RankFx.fam(i),a=RankFx.anim(i);
add({id:'rg_'+i,type:'grad',name:r.n+' Gradient',label:r.n+' Gradient',rar:'limited',bg:RankFx.grad(i),anim:a?'x':'',fx:'',lim:1,src:'rank',rk:i,fam:f,
desc:`Rank-Up Gradients reward: the ${r.n} rank gradient. Limited and unsellable.${a?' Animated.':''}`})});
/* ---- achievements ---- */
const C5=[250,750,2000,5000,12000],G5=[1,2,3,5,8],C5E=[500,1500,4000,10000,25000],G5E=[2,3,5,8,12];
const NETH=['#26262b','#4a4a52','#8a8a96','#4a4a52','#26262b'];
/* cosmetic row: [level, type, name, label, gradient stops, particle kind, text animation (x|y|p), options {ic icon kind, fam outline family, mc minecraft font, dn particles fall}] */
const ACHDEF=[
{id:'lc',name:'Lifetime Cash Earned',unit:'Coin earned',thr:[25000,250000,1000000,10000000,50000000],cash:C5,gems:G5,cos:[
 [2,'grad','Greenback Gradient','Greenback Gradient',['#14532d','#22c55e','#86efac','#facc15'],'dollar','x'],
 [3,'tag','The Millionaire Tag','[THE MILLIONAIRE]',['#facc15','#ca8a04','#22c55e','#bbf7d0'],'dollar','x',{ic:'dollar'}],
 [5,'grad','Tycoon Gradient','Tycoon Gradient',['#ffe27a','#ffd84d','#16a34a','#052e16'],'coin','x']]},
{id:'lq',name:'Lifetime Rounds',unit:'rounds played',thr:[100,500,2000,8000,25000],cash:C5,gems:G5,cos:[
 [3,'tag','The Gold Tag','[THE GOLD]',['#8b929c','#c0c4cc','#e5e7eb','#f1d27a','#ffd84d','#fff3b0','#ffd84d','#b8860b'],'coin','p',{ic:'coin',dn:1}],
 [5,'grad','Midas Gradient','Midas Gradient',['#8a5a00','#ffd84d','#fff2a8','#ffd84d','#b8860b'],'coin','x',{dn:1}]]},
{id:'lg',name:'Gems Earned',unit:'Gems earned (lifetime)',thr:[10,50,150,400,1000],cash:C5,gems:G5,cos:[
 [2,'grad','Gemstone Gradient','Gemstone Gradient',['#f093ff','#be0bb1','#7dd3fc','#f093ff'],'gem','x'],
 [3,'tag','Gem Hoarder Tag','[GEM HOARDER]',['#d58cff','#8b3dd6','#f3d6ff','#d58cff'],'gem','x',{ic:'gem'}],
 [5,'tag','The Jeweler Tag','[THE JEWELER]',['#e0f2fe','#7dd3fc','#c084fc','#f0abfc'],'gem','x',{ic:'gem'}]]},
{id:'rk',name:'Rank Conqueror',unit:'rank reached',rank:1,thr:[3,10,19,27,38],cash:C5E,gems:G5E,cos:[
 [3,'grad','Rank Climber Gradient','Rank Climber Gradient',['#9ca3af','#f8fafc','#7dd3fc','#9ca3af'],'star','x'],
 [5,'tag','The Nether Tag','[THE NETHER]',RankFx.FS.obsidian,'portal','x',{ic:'portal',fam:'obsidian',mc:1,dn:1}]]},
{id:'end',name:'Endgame Ascent',unit:'rank reached',rank:1,thr:[35,37,41,44,46],cash:C5E,gems:G5E,cos:[
 [2,'tag','The Elite Tag','[THE ELITE]',RankFx.FS.elite,'ember','x',{fam:'elite'}],
 [3,'grad','Netherforged Gradient','Netherforged Gradient',NETH,'ember','x',{fam:'netherite'}],
 [4,'tag','Bedrock Bound Tag','[BEDROCK BOUND]',RankFx.FS.bedrock,'spark','x',{fam:'bedrock'}],
 [5,'grad','Unbreakable Gradient','Unbreakable Gradient',RankFx.FS.bedrock,'spark','x',{fam:'bedrock',ic:'bolt'}]]},
{id:'cg',name:'Gradient Crates Opened',unit:'Gradient crates',thr:[10,30,75,150,300],cash:C5,gems:G5,cos:[
 [3,'grad','Prism Opener Gradient','Prism Opener Gradient',['#f472b6','#c084fc','#38bdf8','#4ade80'],'crate','x'],
 [5,'tag','Gradient Hunter Tag','[GRADIENT HUNTER]',['#ff4d4d','#ffd84d','#4dff88','#4dd2ff','#b44dff'],'crate','x',{ic:'crate'}]]},
{id:'ct',name:'Tag Crates Opened',unit:'Tag crates',thr:[10,30,75,150,300],cash:C5,gems:G5,cos:[
 [3,'tag','Tag Cracker Tag','[TAG CRACKER]',['#e0f2fe','#38bdf8','#0ea5e9','#f8fafc'],'crate','x',{ic:'crate'}],
 [5,'grad','Tagmaster Gradient','Tagmaster Gradient',['#0ea5e9','#e0f2fe','#6366f1','#0ea5e9'],'spark','x']]},
{id:'lp',name:'Lifetime Profit',unit:'Coin profit',thr:[10000,100000,500000,2500000,20000000],cash:C5,gems:G5,cos:[
 [3,'tag','In The Green Tag','[IN THE GREEN]',['#14532d','#22c55e','#bbf7d0','#14532d'],'dollar','x'],
 [5,'grad','Profit Prophet Gradient','Profit Prophet Gradient',['#052e16','#22c55e','#facc15','#fff3b0'],'dollar','x']]},
{id:'hm',name:'Highest Multiplier',unit:'x multiplier',thr:[2,5,10,50,250],cash:C5,gems:G5,cos:[
 [3,'tag','Skybreaker Tag','[SKYBREAKER]',['#1e3a8a','#38bdf8','#ffffff','#1e3a8a'],'bolt','x',{ic:'bolt'}],
 [5,'grad','Jackpot Skies Gradient','Jackpot Skies Gradient',['#fde047','#f97316','#ef4444','#fff7cc'],'bolt','x']]},
{id:'lm',name:'Minigames Completed',unit:'minigames completed',thr:[250,1500,6000,20000,60000],cash:C5,gems:G5,cos:[
 [3,'tag','The Grinder Tag','[THE GRINDER]',['#7c2d12','#f97316','#fde68a','#7c2d12'],'ember','x'],
 [5,'grad','Endless Grind Gradient','Endless Grind Gradient',['#f97316','#fde047','#ef4444','#f97316'],'flame','x']]},
{id:'gv',name:'Game Variety',unit:'different minigames played',thr:[2,4,6,8,10],cash:C5,gems:G5,cos:[
 [3,'tag','Jack Of All Games Tag','[JACK OF ALL GAMES]',['#ff4d4d','#ffd84d','#4dff88','#4dd2ff','#b44dff'],'spark','x'],
 [5,'grad','Full Deck Gradient','Full Deck Gradient',['#f8fafc','#ef4444','#0f172a','#f8fafc'],'star','x']]},
{id:'ml',name:'Mastery Levels',unit:'Mastery levels completed',thr:[5,20,50,100,150],cash:C5E,gems:G5E,cos:[
 [3,'tag','The Master Tag','[THE MASTER]',['#fde68a','#ffffff','#f59e0b','#fde68a'],'star','x',{ic:'star'}],
 [5,'grad','Grandmaster Gradient','Grandmaster Gradient',['#7c3aed','#fde68a','#ffffff','#7c3aed'],'star','x']]},
{id:'rd',name:'Rare Discoveries',unit:'Rare / Epic cosmetics found',thr:[2,5,9,14,20],cash:C5,gems:G5,cos:[
 [3,'tag','Rare Finder Tag','[RARE FINDER]',['#1d4ed8','#60a5fa','#e0f2fe','#1d4ed8'],'gem','x'],
 [5,'grad','Rarity Radar Gradient','Rarity Radar Gradient',['#4f7cff','#d066e8','#e0f2fe','#4f7cff'],'bubble','x']]},
{id:'lgd',name:'Legendary Discoveries',unit:'Legendary cosmetics found',thr:[1,3,6,10,15],cash:C5E,gems:G5E,cos:[
 [3,'tag','Legend Spotter Tag','[LEGEND SPOTTER]',['#b8860b','#ffd84d','#fff3b0','#b8860b'],'flame','x',{ic:'flame'}],
 [5,'grad','Legendary Eyes Gradient','Legendary Eyes Gradient',['#ffd84d','#fff7cc','#f97316','#ffd84d'],'star','x']]},
{id:'ds',name:'Daily Streak',unit:'day streak (best)',thr:[3,7,14,30,60],cash:C5,gems:G5,cos:[
 [3,'tag','Daily Devotee Tag','[DAILY DEVOTEE]',['#7c2d12','#f97316','#fde047','#7c2d12'],'flame','x',{ic:'flame'}],
 [5,'grad','Eternal Flame Gradient','Eternal Flame Gradient',['#7f1d1d','#ef4444','#f97316','#fde047'],'flame','y']]}];
/* ---- particle art: tiny SVG tiles generated from each cosmetic's own palette ---- */
const SH={
dollar:(c,x,y,s)=>`<text x='${x}' y='${y+s}' font-size='${s*2.6}' font-weight='900' fill='${c}' font-family='Arial,sans-serif' text-anchor='middle'>$</text>`,
coin:(c,x,y,s)=>`<circle cx='${x}' cy='${y}' r='${s}' fill='${c}' stroke='#00000055' stroke-width='.6'/><circle cx='${x}' cy='${y}' r='${s*.55}' fill='none' stroke='#ffffff88' stroke-width='.5'/>`,
gem:(c,x,y,s)=>`<path d='M${x} ${y-s}l${s} ${s*.8}-${s} ${s*1.2}-${s}-${s*1.2}z' fill='${c}' stroke='#ffffff99' stroke-width='.5'/>`,
star:(c,x,y,s)=>`<path d='M${x} ${y-s}l${s*.3} ${s*.7} ${s*.7} ${s*.3}-${s*.7} ${s*.3}-${s*.3} ${s*.7}-${s*.3}-${s*.7}-${s*.7}-${s*.3} ${s*.7}-${s*.3}z' fill='${c}'/>`,
ember:(c,x,y,s)=>`<circle cx='${x}' cy='${y}' r='${s*.6}' fill='${c}'/>`,
portal:(c,x,y,s)=>`<rect x='${x-s*.5}' y='${y-s*.5}' width='${s}' height='${s}' fill='${c}'/>`,
bubble:(c,x,y,s)=>`<circle cx='${x}' cy='${y}' r='${s}' fill='none' stroke='${c}' stroke-width='.9'/>`,
bolt:(c,x,y,s)=>`<path d='M${x+s*.3} ${y-s}l-${s*.9} ${s*1.2}h${s*.7}l-${s*.3} ${s*.9} ${s*1.1}-${s*1.3}h-${s*.7}z' fill='${c}'/>`,
spark:(c,x,y,s)=>`<path d='M${x-s} ${y}h${s*2}M${x} ${y-s}v${s*2}' stroke='${c}' stroke-width='1' stroke-linecap='round'/>`,
crate:(c,x,y,s)=>`<rect x='${x-s}' y='${y-s}' width='${s*2}' height='${s*2}' fill='${c}' stroke='#00000066' stroke-width='.6'/><path d='M${x-s} ${y}h${s*2}M${x} ${y-s}v${s*2}' stroke='#00000066' stroke-width='.6'/>`,
flame:(c,x,y,s)=>`<path d='M${x} ${y-s*1.2}c${s} ${s*.8} ${s*1.1} ${s*1.4} 0 ${s*2}c-${s*1.1}-${s*.6}-${s}-${s*1.2} 0-${s*2}z' fill='${c}'/>`};
const uri=s=>'url("data:image/svg+xml,'+encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' ${s}</svg>`)+'")';
const tile=(k,cols,w,h,pts)=>uri(`viewBox='0 0 ${w} ${h}'>`+pts.map(([x,y,s],i)=>SH[k](cols[i%cols.length],x,y,s)).join(''));
const icon=(k,cols)=>uri(`viewBox='0 0 24 24'>`+SH[k](cols[0],12,12,8.5)+(k==='coin'||k==='gem'||k==='crate'?'':SH.spark(cols[1],12,12,3)));
const hs=s=>{let h=0;for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))>>>0;return h};
let css='';
ACHDEF.forEach(t=>{t.cash=t.cash||C5;t.gems=t.gems||G5;t.cos.forEach(([lv,type,name,label,st,fx,an,o])=>{o=o||{};const stops=loop(st),id='a_'+t.id+'_'+lv,cols=pal(stops);
add({id,type,name,label,rar:'exclusive',bg:`linear-gradient(90deg,${stops.join(',')})`,anim:an,fx:'',lim:1,src:'achievement',ax:t.id,lv,pfx:fx,cols,fam:o.fam||'',ic:o.ic||'',mc:o.mc?1:0,dn:o.dn?1:0,
desc:`Achievement reward: ${t.name}, Level ${lv}. Exclusive and unsellable.`});
css+=`.ax-${id}::before{background-image:${tile(fx,cols,48,18,[[8,12,3],[24,8,2.4],[40,13,3]])};background-size:48px 18px}.ax-${id}::after{background-image:${tile(fx,cols.slice().reverse(),40,16,[[10,5,2],[28,11,2.6]])};background-size:40px 16px}`;
if(o.ic)css+=`.ax-${id} .axi{background-image:${icon(o.ic,cols)}}`})});
/* ---- Cos integration (same pattern as js/limited.js) ---- */
const by0=Cos.by,sv0=Cos.sellValue,gm0=Cos.gems,html0=Cos.html;
Cos.by=id=>by0(id)||by[id]||null;
Cos.sellValue=c=>c&&c.lim?0:sv0(c);Cos.gems=c=>c&&c.lim?0:gm0(c);
Cos.html=(c,txt)=>{if(!c||(c.src!=='rank'&&c.src!=='achievement'))return html0(c,txt);const t=txt==null?c.label:txt,an=c.anim?' an'+c.anim:'',fam=c.fam?' rkf-'+c.fam:'';
if(c.src==='rank')return `<span class="axw rkw${fam}"><span class="cos${an}" style="background-image:${c.bg}">${t}</span></span>`;
const[a,b,d]=c.cols;return `<span class="axw ax-${c.id} ${c.dn?'axd':'axu'}${fam}${c.mc?' mcf':''}" style="--p1:${a};--p2:${b};--p3:${d};--dl:${-(hs(c.id)%30)/10}s">${c.ic?'<i class="axi" aria-hidden="true"></i>':''}<span class="cos${an}" style="background-image:${c.bg}">${t}</span></span>`};
Cos.rank=out.filter(c=>c.src==='rank');Cos.ach=out.filter(c=>c.src==='achievement');
if(typeof document!=='undefined'&&!document.getElementById('stk-ax30')){const s=document.createElement('style');s.id='stk-ax30';s.textContent=css;document.head.appendChild(s)}
return{ACHDEF,out,by}})();
const ACHDEF=X30.ACHDEF;
