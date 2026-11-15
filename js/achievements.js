/* v3.0 Achievements: 15 tracks x 5 levels (data + exclusive cosmetics in js/cos30.js: ACHDEF). Architecture follows js/mastery.js:
   - own SIGNED save key (ACH.KEY): k[id] = bit mask of CLAIMED levels, h[id] = high-water mark of the counter (so selling a cosmetic / a lower later reading never un-completes a level).
   - the counters themselves are real gameplay statistics kept in the main signed save (Store.d.ls, see Life in storage.js) or read from existing systems (rounds Store.d.lq, rank Store.d.rk, Mastery.total(), the inventory, per-game stats).
   - INDIVIDUAL claims only (there is deliberately no Claim All). The claimed bit is saved BEFORE anything is paid, so a double click / crash can never pay twice; a cosmetic already in the inventory is never added twice.
   - Coin / Gem rewards are small on purpose (they must not compete with rank progression); the prestige is in the exclusive animated cosmetics.
   Counters: lc lifetime Coin income | lq lifetime rounds (Store.d.lq) | lg lifetime Gems earned | rk/end highest rank | cg/ct Gradient / Tag crates opened | lp lifetime round profit | hm highest multiplier |
             lm minigames completed | gv different minigames played | ml Mastery levels completed | rd Rare+Epic cosmetics found | lgd Legendary cosmetics found | ds best daily-activity streak. */
const Ach=(()=>{
const KEY='0-100_v3.0_ach',LV=5,by=Object.fromEntries(ACHDEF.map(t=>[t.id,t]));
const int=v=>Math.max(0,Math.floor(Store.num(v,0))),pop=m=>{let n=0;for(;m;m&=m-1)n++;return n};
const blank=()=>({v:1,k:{},h:{}});
function read(){const r=Store.readSigned(KEY),d=blank();let o=null;if(r.status!=='bad'&&r.raw!=null)try{o=JSON.parse(r.raw)}catch(e){}
ACHDEF.forEach(t=>{d.k[t.id]=int(o&&o.k&&o.k[t.id])&31;d.h[t.id]=Math.max(0,Store.num(o&&o.h&&o.h[t.id],0))});return d}
const write=d=>Store.writeSigned(KEY,JSON.stringify(d));
const ownedBy=f=>{const inv=Store.d&&Array.isArray(Store.d.inv)?Store.d.inv:[];let n=0;new Set(inv).forEach(id=>{const c=Cos.by(id);if(c&&f(c))n++});return n};
const LIVE={
lc:d=>d.ls.lc,lq:d=>d.lq,lg:d=>d.ls.lg,rk:d=>Math.max(d.rk,d.ls.rkh),end:d=>Math.max(d.rk,d.ls.rkh),cg:d=>d.ls.cg,ct:d=>d.ls.ct,lp:d=>d.ls.lp,hm:d=>d.ls.hm,lm:d=>d.ls.lm,
gv:d=>Object.keys(d.g||{}).filter(k=>d.g[k]&&d.g[k].w>0).length,ml:()=>typeof Mastery!=='undefined'?Mastery.total():0,
rd:()=>ownedBy(c=>c.rar==='rare'||c.rar==='epic'),lgd:()=>ownedBy(c=>c.rar==='legendary'),ds:d=>Math.max(d.ls.dsb,d.ls.ds)};
const live=id=>{const d=Store.d;if(!d||!d.ls)return 0;try{return +LIVE[id](d)||0}catch(e){return 0}};
const value=(id,d=read())=>Math.max(d.h[id]||0,live(id));
const levelAt=(t,v)=>t.thr.filter(x=>v>=x).length;
const level=(id,d=read())=>levelAt(by[id],value(id,d));
const cosAt=(t,lv)=>Cos.by('a_'+t.id+'_'+lv);
const stats=(id,d=read())=>{const done=level(id,d),cl=pop(d.k[id]);return{completed:done,claimed:cl,claimable:done-cl}};
const claimableCount=(d=read())=>ACHDEF.reduce((a,t)=>a+level(t.id,d)-pop(d.k[t.id]),0);
const total=(d=read())=>ACHDEF.reduce((a,t)=>a+level(t.id,d),0);
/* sync: raise high-water marks, announce newly completed levels (never at first sync of a session: no toast flood for already-completed levels). Throttled; claims force it. */
let seen=null,lastSync=0;
function sync(force){if(!Store.d||!Store.d.ls)return;const now=Date.now();if(!force&&now-lastSync<800)return;lastSync=now;const d=read();let ch=false;
ACHDEF.forEach(t=>{const l=live(t.id);if(l>d.h[t.id]){d.h[t.id]=l;ch=true}});if(ch)write(d);
if(seen===null){seen={};ACHDEF.forEach(t=>{seen[t.id]=level(t.id,d)});return}
ACHDEF.forEach(t=>{const n=level(t.id,d);if(n>seen[t.id]){seen[t.id]=n;try{App.toast(`Achievement unlocked: ${t.name}, Level ${n}! Claim it on the Achievements page.`)}catch(e){}}})}
/* individual claim */
function claim(id,lv){const t=by[id];lv=Math.floor(lv);if(!t||!(lv>=1&&lv<=LV))return{ok:false,msg:'Unknown reward'};Store.load();sync(true);const d=read();
if(lv>level(id,d))return{ok:false,msg:'Level not completed yet'};const bit=1<<(lv-1);if(d.k[id]&bit)return{ok:false,msg:'Already claimed'};
d.k[id]|=bit;write(d);
const cash=t.cash[lv-1],gems=t.gems[lv-1];if(cash)Econ.addCoins(cash);if(gems){Store.check();Store.d.gems+=gems;Store.sync()}
const c=cosAt(t,lv);let gave=false;if(c&&!Store.d.inv.includes(c.id)){Store.d.inv.push(c.id);gave=true}
Store.save();try{App.bal()}catch(e){}return{ok:true,t,lv,cash,gems,cos:c||null,gave}}
const api={KEY,LV,tracks:ACHDEF,by,read,value,level,stats,claim,claimableCount,total,sync,cosAt,live};
/* crates: count Gradient / Tag crate opens at the one place a crate is actually opened (after the Gems were spent and the item granted) */
if(typeof Crate!=='undefined'&&Crate.open){const o=Crate.open;Crate.open=function(kind,rnd){const r=o.call(this,kind,rnd);if(r&&r.ok){Life.crate(kind);Store.save()}return r}}
{const sv=Store.save;Store.save=function(){const r=sv.apply(this,arguments);try{sync()}catch(e){console.error(e)}return r}}
{const s=Inv.sell;Inv.sell=function(id){try{sync(true)}catch(e){}return s.apply(this,arguments)}}   // lock in Rare / Legendary discoveries before a cosmetic leaves the inventory
return api})();
if(typeof Pages!=='undefined'&&typeof document!=='undefined'){
const fmt=n=>(+n).toLocaleString('en-US');
const fv=(t,v)=>t.rank?CFG.RANKS[Math.min(CFG.RANKS.length-1,Math.floor(v))].n:t.id==='lc'||t.id==='lp'?'$'+Econ.fi(Math.floor(v)):t.id==='hm'?(+v).toFixed(2)+'x':fmt(Math.floor(v));
const objText=(t,lv)=>{const x=t.thr[lv-1];return t.rank?'Reach '+CFG.RANKS[x].n:t.id==='hm'?`Land a ${x}x multiplier`:t.id==='lc'?`Earn $${fmt(x)} Coin in total`:t.id==='lp'?`Earn $${fmt(x)} total profit`:`${fmt(x)} ${t.unit}`};
const TIERN=['','BRONZE','SILVER','GOLD','PLATINUM','DIAMOND'];
const trophy=(sz,col)=>`<svg class="axo-tr" viewBox="0 0 120 120" width="${sz}" height="${sz}" aria-hidden="true" style="color:${col}"><defs><linearGradient id="axg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".85"/><stop offset=".45" stop-color="currentColor"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></linearGradient></defs><path d="M28 16c-14 0-20 8-18 20 2 11 12 18 22 18M92 16c14 0 20 8 18 20-2 11-12 18-22 18" fill="none" stroke="url(#axg)" stroke-width="7" stroke-linecap="round"/><path d="M28 10h64v30c0 24-14 40-32 44-18-4-32-20-32-44z" fill="url(#axg)" stroke="#00000066" stroke-width="3" stroke-linejoin="round"/><path d="M52 84h16v14H52z" fill="url(#axg)"/><rect x="36" y="98" width="48" height="12" rx="4" fill="url(#axg)" stroke="#00000066" stroke-width="3"/><path d="M60 22l5 11 12 1.500-9 8 2.500 12-10.500-6-10.500 6 2.500-12-9-8 12-1.500z" fill="#fff" fill-opacity=".9"/></svg>`;
const TC=['','#cd7f32','#cbd5e1','#ffd84d','#7dd3fc','#f0abfc'];
function celebrate(r,done){const o=document.createElement('div');o.className='axo';o.dataset.t=r.lv;o.setAttribute('role','dialog');o.setAttribute('aria-modal','true');o.setAttribute('aria-label','Achievement claimed');
let p='';for(let i=0;i<14+r.lv*10;i++){const a=Math.random()*6.283,d=120+Math.random()*(180+r.lv*60);p+=`<i class="axo-p" style="--dx:${Math.round(Math.cos(a)*d)}px;--dy:${Math.round(Math.sin(a)*d*.8)}px;animation-delay:${(Math.random()*.4).toFixed(2)}s"></i>`}
const rw=[];if(r.cash)rw.push('$'+Econ.fi(r.cash));if(r.gems)rw.push(r.gems+' '+gemIcon(18)+' Gem'+(r.gems>1?'s':''));
o.innerHTML=`<div class="axo-rays"></div>${p}<div class="axo-box">${trophy(190,TC[r.lv])}<div class="axo-h">${r.lv===5?'LEGENDARY ACHIEVEMENT':'ACHIEVEMENT CLAIMED'}</div><div class="axo-n">${r.t.name} &bull; Level ${r.lv} &bull; ${TIERN[r.lv]}</div><div class="axo-rw">${rw.length?`<div>${rw.join(' + ')}</div>`:''}${r.cos?`<div class="axo-pv">${prevHtml(r.cos)}</div><div>${rarTxt(r.cos)} cosmetic added to your Inventory</div>`:''}</div><button class="btn" id="axok" type="button">Continue</button></div>`;
document.body.appendChild(o);const app=$('app');if(app)app.setAttribute('aria-hidden','true');try{FX.confetti(o,40+r.lv*18)}catch(e){}
const close=()=>{document.removeEventListener('keydown',kd,true);o.remove();if(app)app.removeAttribute('aria-hidden');done()},kd=e=>{if(e.key==='Escape'||e.key==='Enter'){e.preventDefault();e.stopPropagation();close()}};
document.addEventListener('keydown',kd,true);o.querySelector('#axok').onclick=close;o.querySelector('#axok').focus()}
Pages.achievements={mount(app){let sel=ACHDEF[0].id,busy=false;
const render=()=>{Ach.sync(true);const D=Ach.read(),T=Ach.by[sel],S=Ach.stats(sel,D),all=Ach.claimableCount(D),V=Ach.value(sel,D);
const card=t=>{const v=Ach.value(t.id,D),l=Ach.level(t.id,D),st=Ach.stats(t.id,D),mx=l>=5,nx=t.thr[Math.min(l,4)];
return `<button class="ach-c${t.id===sel?' on':''}${st.claimable?' rdy':''}" data-t="${t.id}" aria-pressed="${t.id===sel}">${st.claimable?`<span class="acn">${st.claimable} TO CLAIM</span>`:''}<span class="an">${t.name}</span><span class="al">${mx?'ALL LEVELS COMPLETE':'LEVEL '+l+' / 5'}</span><span class="ach-pips" style="--tc:#ffd84d">${[1,2,3,4,5].map(i=>`<i class="${i<=l?'d':''}${i<=l&&!(D.k[t.id]&(1<<(i-1)))?' c':''}"></i>`).join('')}</span>${mx?'':Dash.bar(`${fv(t,v)} / ${fv(t,nx)}`,Math.min(1,v/nx))}<small>${mx?fv(t,v):'Next: '+objText(t,l+1)}</small></button>`};
const row=lv=>{const done=lv<=S.completed,claimed=!!(D.k[T.id]&(1<<(lv-1))),cur=lv===S.completed+1,c=Cos.by('a_'+T.id+'_'+lv),x=T.thr[lv-1];
return `<div class="ach-r${claimed?' claimed':done?' ready':''}${cur?' cur':''}" data-t="${lv}"><span class="tier">${TIERN[lv]}<b>LEVEL ${lv}</b></span><span class="obj">${objText(T,lv)}${cur?`<small>${fv(T,Math.min(V,x))} / ${fv(T,x)} (${Math.floor(Math.min(1,V/x)*100)}%)</small>`:''}</span>
<span class="rw"><span>$${Econ.fi(T.cash[lv-1])} + ${gemIcon(14)} ${T.gems[lv-1]}</span>${c?`<span class="cs">${prevHtml(c)}</span><small>${c.name} &bull; ${rarTxt(c)} &bull; unsellable</small>`:'<small>Coin and Gems only</small>'}</span>
${claimed?'<span class="st ok">&#10003; CLAIMED</span>':done?`<button class="btn ach-claim" data-claim="${lv}" type="button">CLAIM</button>`:'<span class="st">LOCKED</span>'}</div>`};
app.innerHTML=`<h2 class="sec">🏆 Achievements ›</h2>${gchip()}<div class="dp qp2"><div class="ach-hero"><p class="ach-sum">Five levels per achievement, each with its own objective. Claim every reward by hand: higher levels unlock exclusive animated tags and gradients. Levels completed: <b>${Ach.total(D)}</b> / ${ACHDEF.length*5}${all?` &bull; <b>${all}</b> ready to claim`:''}</p></div>
<div class="ach-grid">${ACHDEF.map(card).join('')}</div><h3 class="lined">${T.name}</h3><p class="mssm">Completed <b>${S.completed}</b> &bull; Claimable <b>${S.claimable}</b> &bull; Claimed <b>${S.claimed}</b> (of 5)</p><div class="ach-list">${[1,2,3,4,5].map(row).join('')}</div></div>`;
app.dataset.sg=Ach.claimableCount(D)+':'+ACHDEF.map(t=>Ach.level(t.id,D)).join();
app.querySelectorAll('[data-t].ach-c').forEach(b=>b.onclick=()=>{sel=b.dataset.t;render()});
app.querySelectorAll('[data-claim]').forEach(b=>b.onclick=()=>{if(busy||b.dataset.busy)return;b.dataset.busy=1;busy=true;const r=Ach.claim(sel,+b.dataset.claim);if(!r.ok){busy=false;App.toast(r.msg||'Nothing to claim');render();return}
try{App.bal()}catch(e){}celebrate(r,()=>{busy=false;render()})})};
render();Pages._tick=()=>{if(!busy&&!document.querySelector('.axo')){const k=Ach.claimableCount()+':'+ACHDEF.map(t=>Ach.level(t.id)).join();if(k!==app.dataset.sg){app.dataset.sg=k;render()}}};return()=>{Pages._tick=null}}};
if(typeof Shell!=='undefined'){const u=Shell.update;Shell.update=function(){const r=u.apply(this,arguments);try{const a=document.querySelector('#sb a[href="#achievements"]');if(a)a.classList.toggle('mscl',Ach.claimableCount()>0)}catch(e){}return r}}
}
