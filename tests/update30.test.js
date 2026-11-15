// Update 3.0 tests: Rank Expansion 3, Achievements, lifetime tracking, pity, Rank-Up Gradients, Aviamasters bands, wiring. Run: node tests/update30.test.js  (no browser needed)
const fs=require('fs'),vm=require('vm'),path=require('path'),J=f=>path.join(__dirname,'../js/'+f+'.js'),RT=p=>path.join(__dirname,'..',p);
const store={};global.localStorage={getItem:k=>store[k]??null,setItem:(k,v)=>store[k]=String(v),removeItem:k=>{delete store[k]}};global.window=global;global.Games={};global.addEventListener=()=>{};
const toasts=[];global.App={toast:m=>toasts.push(m),bal(){},settle:(g,b,gr,o)=>Econ.settle(g,b,gr,o)};
global.location={hostname:'example.github.io',protocol:'https:'};
for(const f of ['config','cosmetics','cosfx','cos295','limfx','limited','cos30','storage','stats','economy','crates','mastery','achievements','addon295'])vm.runInThisContext(fs.readFileSync(J(f),'utf8'),{filename:f});
const realLoad=Store.load.bind(Store);Store.load=()=>Store.d;
let pass=0,fail=0;const t=(n,ok,x='')=>{ok?pass++:fail++;console.log((ok?'PASS ':'FAIL ')+n+(x?'  '+x:''))};
const fresh=()=>{for(const k in store)delete store[k];Store.d=Store.def();Store.d.user='t';Store.sync();toasts.length=0;Crate.pend=null};
const src=f=>fs.readFileSync(RT(f),'utf8'),R=CFG.RANKS;
// ================= 1. ranks
const NEW=['Division 1','Elite I','Elite II','Elite III','Obsidian I','Obsidian II','Obsidian III','Netherite I','Netherite II','Netherite III','Bedrock I','Bedrock II','Bedrock III'];
t('12 new ranks follow Division 1 in the exact order',R.slice(34).map(r=>r.n).join()===NEW.join()&&R.length===47);
t('Bedrock III is the only rank without a requirement (maximum)',R.filter(r=>!r.req).map(r=>r.n).join()==='Bedrock III'&&R[46].req===null);
{const nr=R.slice(33,46);t('requirements rise strictly (cash) and never fall (rounds) from Division 2 to Bedrock II',nr.every((r,i)=>i===0||(r.req.c>nr[i-1].req.c&&r.req.r>=nr[i-1].req.r)));
t('rank-up rewards (starting cash and Gems) rise with every new rank and stay modest',R.slice(34).every((r,i,a)=>i===0||(r.rw.c>=a[i-1].rw.c&&r.rw.g>=a[i-1].rw.g))&&R[46].rw.c<=15000&&R[46].rw.g<=60);
t('steps between requirements stay gentle (each +5% .. +20%)',R.slice(33,45).every((r,i)=>{const q=R[34+i].req.c/r.req.c;return q>1.05&&q<1.2}))}
fresh();Store.d.rk=33;let seq=[];for(let i=0;i<14;i++){Store.d.rc=1e9;Store.d.rq=1e9;const rw=Rank.rankUp();if(!rw)break;seq.push(R[Store.d.rk].n)}
t('rank-up walks Division 2 -> Bedrock III and then refuses',seq.join()===NEW.join()&&Store.d.rk===46&&Rank.rankUp()===null&&Rank.status().max);
t('every rank-up grants exactly its configured cash and Gems',(()=>{for(let i=33;i<46;i++){fresh();Store.d.rk=i;Store.d.rc=1e9;Store.d.rq=1e9;Store.d.gems=0;Store.sync();const rw=Rank.rankUp();if(!rw||Store.d.balance!==R[i+1].rw.c||Store.d.gems!==R[i+1].rw.g)return false}return true})());
// rank gradients + visuals
t('RankFx: static below index 22, animated from page 3 (22+), families from 35',[21,22,34].map(RankFx.anim).join()==='false,true,true'&&[34,35,37,38,40,41,43,44,46].map(RankFx.fam).join()===',elite,elite,obsidian,obsidian,netherite,netherite,bedrock,bedrock');
t('rank gradient strings: static = 135deg 2 stops; animated = looping 90deg gradient',/^linear-gradient\(135deg,/.test(RankFx.grad(5))&&[22,30,40,46].every(i=>{const m=RankFx.grad(i).match(/linear-gradient\(90deg,(.*)\)$/);if(!m)return false;const st=m[1].split(',');return st[0]===st[st.length-1]}));
const css=src('css/update30.css');
t('CSS defines all four families with particles, and the specified outlines',['elite','obsidian','netherite','bedrock'].every(f=>new RegExp('\\.rkf-'+f+'::before').test(css)&&new RegExp('\\.rkf-'+f+'::after').test(css))&&/\.rkf-obsidian\{-webkit-text-stroke:\.7px #fff/.test(css)&&/@keyframes rkNeth[^}]*#ffd84d/.test(css)&&/@keyframes rkBed[^}]*#a855f7/.test(css));
t('promotion / rank text / cosmetics share ONE definition (cos30 RankFx used by Badge in ui.js; no second animation set)',/RankFx\.grad\(i\)/.test(src('js/ui.js'))&&/RankFx\.fam\(i\)/.test(src('js/ui.js'))&&(css.match(/@keyframes rkNeth/g)||[]).length===1&&(css.match(/@keyframes rkBed/g)||[]).length===1);
t('animated rank text + families respect reduced motion',/prefers-reduced-motion/.test(css)&&/\.rkf-netherite,\.rkf-bedrock,\.rk\.rka/.test(css));
t('4 white placeholder JPGs exist with the exact names and are mapped in BIMG',['elite','obsidian','netherite','bedrock'].every(n=>fs.existsSync(RT('img/'+n+'.jpg'))&&fs.readFileSync(RT('img/'+n+'.jpg')).slice(0,2).toString('hex')==='ffd8'&&new RegExp(n+":'"+n+"\\.jpg'").test(src('js/ui.js')))&&R.slice(35,38).every(r=>r.ic==='elite')&&R.slice(44).every(r=>r.ic==='bedrock'));
t('rank-up page has 4 pages and page 4 holds exactly the new ranks',/data-p="3">Page 4/.test(src('js/ui.js'))&&/side\(35,R\.length,34,R\.length-1/.test(src('js/ui.js')));
// ================= 2. Rank-Up Gradients (Mastery ir)
t('47 rank gradients, one per rank, named "<Rank> Gradient", animated from page 3',Cos.rank.length===47&&Cos.rank.every((c,i)=>c.id==='rg_'+i&&c.name===R[i].n+' Gradient'&&c.type==='grad'&&!!c.anim===(i>=22)&&c.lim===1));
t('families carry their class on the cosmetic markup (Elite/Obsidian/Netherite/Bedrock)',[35,38,41,44].every((i,k)=>Cos.html(Cos.by('rg_'+i)).includes('rkf-'+['elite','obsidian','netherite','bedrock'][k]))&&!/rkf-/.test(Cos.html(Cos.by('rg_20'))));
t('rank gradients are unsellable and not in the shop / crates',Cos.rank.every(c=>Cos.sellValue(c)===0&&!COS.includes(c))&&Cos.by('rg_46')===Cos.rank[46]);
t('Mastery ir is now "Rank-Up Gradients": 10 levels, no Coin, no Gems, rising rank thresholds',Mastery.by.ir.name==='Rank-Up Gradients'&&Mastery.by.ir.gr===1&&Mastery.by.ir.cash.every(v=>v===0)&&Mastery.by.ir.gems.every(v=>v===0)&&Mastery.by.ir.thr.every((v,i,a)=>!i||v>a[i-1])&&Mastery.by.ir.thr[9]===R.length-1);
{const all=[];for(let l=1;l<=10;l++)all.push(...Mastery.irIds(l));t('the 10 levels together grant EVERY rank gradient exactly once (rg_0 .. rg_46)',all.length===47&&new Set(all).size===47&&all.every((id,i)=>id==='rg_'+i)&&Mastery.irIds(1).includes('rg_1')&&Mastery.irIds(10).slice(-1)[0]==='rg_46')}
fresh();Store.d.rk=7;Store.sync();Store.save();{const b=Store.d.balance,g=Store.d.gems;t('ir progress follows the highest rank reached (Amethyst = 7: levels 1 completed, 5 needs rank 5 -> 2 completed)',Mastery.stats('ir').completed===2);
const r1=Mastery.claim('ir',1),r2=Mastery.claim('ir',2);t('claiming grants only gradients: no cash, no Gems, correct ids',r1.ok&&r2.ok&&r1.cash===0&&r2.cash===0&&Store.d.balance===b&&Store.d.gems===g&&['rg_0','rg_1','rg_2','rg_3','rg_4','rg_5'].every(id=>Store.d.inv.includes(id))&&!Store.d.inv.includes('rg_6'));
t('a gradient claim cannot be repeated, and level 3 is not claimable yet',!Mastery.claim('ir',1).ok&&!Mastery.claim('ir',3).ok&&Store.d.inv.filter(x=>x==='rg_3').length===1)}
// migration of the old objective: old save counted Rank-Up Ready rewards and had claimed levels
fresh();Store.d.inv=['m_ir_3','m_ir_6'];Store.d.rk=0;Store.sync();Store.writeSigned(Mastery.KEY,JSON.stringify({c:{ir:12,mn:120},l:{ir:5,mn:2},k:{ir:31,mn:3}}));
t('legacy ir progress is reset ONCE (old Rank-Up Ready counts must not grant gradients); other tracks untouched',Mastery.stats('ir').completed===0&&Mastery.stats('ir').claimed===0&&Mastery.stats('mn').claimed===2&&Mastery.read().v===3);
t('legacy limited cosmetics m_ir_3 / m_ir_6 / m_ir_10 still resolve and stay owned',['m_ir_3','m_ir_6','m_ir_10'].every(id=>Cos.by(id)&&Cos.by(id).lim)&&Store.d.inv.includes('m_ir_3'));
Store.d.rk=2;Store.save();Mastery.syncCollection();t('after migration the counter follows rank (Bronze = 2 -> level 1)',Mastery.stats('ir').completed===1&&Mastery.read().v===3);
// ================= 3. lifetime tracking (Life) + persistence
fresh();Store.d.balance=1000;Store.sync();
Econ.settle('MINES',10,30);Econ.settle('MINES',10,0);Econ.settle('FLIP',1,2);
{const l=Store.d.ls;t('profit / income counted from real settled rounds (profit 20 + 1), rounds counted, highest multiplier 3x',l.lp===21&&l.lc===21&&l.lm===3&&l.hm===3);
Econ.settle('MINES',.5,5);t('wagers under ROUND_MIN_BET never count as completed rounds / multipliers (profit still counts)',l.lm===3&&l.hm===3&&l.lp===25.5);
Econ.settle('MINES',5,0,{noCount:true});t('noCount rounds do not count',l.lm===3);
Econ.addCoins(100);t('addCoins (rewards / sales) counts as Coin income, not as profit',l.lc===125.5&&l.lp===25.5);
Store.d.gems+=3;Store.sync();Store.d.gems-=2;Store.sync();Store.d.gems+=1;Store.sync();t('lifetime Gems earned counts gains only (3 + 1), never spending',l.lg===4&&Store.d.gems===2);
Store.d.gems=2;t('current Gem balance is not lifetime earned',l.lg===4)}
{const ls=()=>Store.d.ls;fresh();const day=20000,d0=day*864e5;Life.touch(d0);Life.touch(d0+3600e3);t('same-day activity does not extend the streak',ls().ds===1);Life.touch(d0+864e5);Life.touch(d0+2*864e5);t('consecutive days extend the streak and best streak (3)',ls().ds===3&&ls().dsb===3);
Life.touch(d0+5*864e5);t('a missed day resets the streak to 1 but keeps the best (3)',ls().ds===1&&ls().dsb===3&&Life.streak(d0+5*864e5)===1&&Life.streak(d0+9*864e5)===0)}
fresh();Store.d.gems=9;Crate.open('grads');Crate.open('tags');Crate.open('grads');t('crate opens are counted separately (2 gradient, 1 tag)',Store.d.ls.cg===2&&Store.d.ls.ct===1&&Store.d.gems===0);
fresh();Store.d.gems=2;Crate.open('grads');t('a refused crate open (not enough Gems) counts nothing',Store.d.ls.cg===0);
fresh();Store.d.rk=33;Store.d.rc=1e9;Store.d.rq=1e9;Rank.rankUp();t('highest rank reached is recorded at the rank-up event',Store.d.ls.rkh===34);
fresh();Store.d.ls={lc:5,lp:4,lg:3,lm:2,hm:7.5,ds:2,dsb:4,dsl:77,cg:6,ct:8,rkh:3};Store.d.rk=3;Store.save();realLoad();t('lifetime stats persist through the signed save (save -> reload)',JSON.stringify(Store.d.ls)===JSON.stringify({lc:5,lp:4,lg:3,lm:2,hm:7.5,ds:2,dsb:4,dsl:77,cg:6,ct:8,rkh:3}));
// legacy / migration
fresh();Store.d.g={MINES:{w:10,l:0,x:123.5},CASES:{w:5,l:1,x:76.5}};Store.d.gems=7;Store.d.rk=5;Store.d.ls=undefined;const sv=Store.d;delete sv.ls;Store.writeSigned(Store.key,JSON.stringify(sv));realLoad();
t('older signed save without stats is migrated: profit seeded from per-game "made", Gems from balance, rank high-water',Store.d.ls&&Store.d.ls.lp===200&&Store.d.ls.lc===200&&Store.d.ls.lg===7&&Store.d.ls.rkh===5&&Store.d.ls.lm===0);
Store.armed=true;localStorage.setItem(Store.key,JSON.stringify({user:'old',balance:50,gems:3,g:{MINES:{w:1,l:0,x:1e9}}}));realLoad();Store.armed=false;t('unsigned legacy saves get zeroed stats (no seeding from untrusted data)',Store.d.ls.lp===0&&Store.d.ls.lg===0);
fresh();localStorage.setItem(Store.key,'S2:bad-sig:{"user":"x"}');realLoad();t('a tampered save still resets safely and gets default stats',Store.tamper>=1&&Store.d.ls.lp===0);
fresh();Store.d.ls.lc=-5;Store.d.ls.hm=1e12;Store.d.ls.ds=NaN;Store.save();realLoad();t('corrupt stat values are sanitised on load',Store.d.ls.lc===0&&Store.d.ls.hm<=1e6&&Store.d.ls.ds===0);
// ================= 4. achievements
const AC=Ach.tracks;
t('15 achievements x exactly 5 levels, rising objectives, rising Coin and Gem rewards',AC.length===15&&AC.every(x=>x.thr.length===5&&x.cash.length===5&&x.gems.length===5&&x.thr.every((v,i)=>!i||v>x.thr[i-1])&&x.cash.every((v,i)=>!i||v>x.cash[i-1])&&x.gems.every((v,i)=>!i||v>x.gems[i-1])));
t('Coin / Gem rewards stay small (cannot undermine rank progression): max $25,000 and 12 Gems per level',AC.every(x=>Math.max(...x.cash)<=25000&&Math.max(...x.gems)<=12));
t('required categories exist (cash, rounds, Gems, rank, endgame ranks, Gradient + Tag crates, profit, multiplier, minigames, mastery, rare, legendary, streak)',['lc','lq','lg','rk','end','cg','ct','lp','hm','lm','gv','ml','rd','lgd','ds'].every(id=>Ach.by[id]));
t('examples from the spec: $1,000,000 cash -> [THE MILLIONAIRE]; 2,000 rounds -> [THE GOLD]; Obsidian I -> [THE NETHER]; 150 Gradient / Tag crates',Ach.by.lc.thr[2]===1e6&&Cos.by('a_lc_3').label==='[THE MILLIONAIRE]'&&Ach.by.lq.thr[2]===2000&&Cos.by('a_lq_3').label==='[THE GOLD]'&&Ach.by.rk.thr[4]===38&&R[38].n==='Obsidian I'&&Cos.by('a_rk_5').label==='[THE NETHER]'&&Ach.by.cg.thr[3]===150&&Ach.by.ct.thr[3]===150);
t('Elite / Obsidian / Netherite / Bedrock each have an Endgame Ascent level',Ach.by.end.thr.map(i=>R[i].n).join()==='Elite I,Elite III,Netherite I,Bedrock I,Bedrock III');
t('exclusive cosmetics: 34, unique ids, animated, each track has at least 2, levels valid, unsellable, in no shop/crate table',Cos.ach.length===34&&new Set(Cos.ach.map(c=>c.id)).size===34&&Cos.ach.every(c=>c.rar==='exclusive'&&c.anim&&c.lim&&Cos.sellValue(c)===0&&!COS.includes(c)&&Ach.by[c.ax]&&c.lv>=2&&c.lv<=5)&&AC.every(x=>Cos.ach.filter(c=>c.ax===x.id).length>=2));
t('exclusive cosmetics are rarity "exclusive" with their own label colour',CFG.RAR.exclusive&&CFG.RAR.exclusive.n==='Exclusive'&&Cos.ach.every(c=>CFG.RAR[c.rar]));
t('prestigious cosmetics sit at the hard end: every track puts its top reward at level 5 and the highest-tier ones need Division-era progress',AC.every(x=>Cos.by('a_'+x.id+'_5'))&&R[Ach.by.rk.thr[3]].n==='Unreal I');
t('special visuals: Gold tag silver->gold progressive anim, Nether tag Minecraft font + Obsidian family, Millionaire dollar particles, Netherite/Bedrock outline classes',Cos.by('a_lq_3').anim==='p'&&/^linear-gradient\(90deg,#8b929c/.test(Cos.by('a_lq_3').bg)&&Cos.by('a_rk_5').mc===1&&Cos.by('a_rk_5').fam==='obsidian'&&Cos.by('a_lc_3').pfx==='dollar'&&Cos.by('a_end_3').fam==='netherite'&&Cos.by('a_end_4').fam==='bedrock'&&/mcf/.test(Cos.html(Cos.by('a_rk_5'))));
t('no Claim All exists anywhere in Achievements',typeof Ach.claimAll==='undefined'&&!/claimAll|claim-all|msall|CLAIM ALL \(/.test(src('js/achievements.js')));
// tracking -> levels
fresh();Store.d.ls.lc=30000;Store.save();t('Lifetime Cash 30,000 completes level 1 only (25,000)',Ach.level('lc')===1);
fresh();Store.d.lq=2000;Store.save();t('2,000 lifetime rounds completes level 3 of Lifetime Rounds',Ach.level('lq')===3);
fresh();Store.d.rk=38;Store.save();t('rank 38 (Obsidian I) completes Rank Conqueror level 5 and Endgame Ascent level 2',Ach.level('rk')===5&&Ach.level('end')===2);
fresh();Store.d.ls.lg=1000;Store.save();t('Gems earned 1,000 completes all 5 Gem levels',Ach.level('lg')===5);
fresh();Store.d.g={A:{w:1,l:0,x:0},B:{w:1,l:0,x:0},C:{w:0,l:0,x:0},D:{w:2,l:0,x:0}};Store.save();t('Game Variety counts distinct games with wagers (3)',Ach.value('gv')===3&&Ach.level('gv')===1);
fresh();Store.d.ls.hm=60;Store.save();t('highest multiplier 60x completes 4 levels (2, 5, 10, 50)',Ach.level('hm')===4);
fresh();Store.d.inv=COS.filter(c=>c.rar==='rare'||c.rar==='epic').slice(0,5).map(c=>c.id).concat(COS.filter(c=>c.rar==='legendary').slice(0,3).map(c=>c.id));Store.save();Ach.sync(true);t('Rare+Epic / Legendary discoveries come from owned cosmetics (5 -> level 2; 3 -> level 2)',Ach.level('rd')===2&&Ach.level('lgd')===2);
Store.d.inv=[];Store.save();Ach.sync(true);t('selling / losing cosmetics never lowers a completed level (high-water mark)',Ach.level('rd')===2&&Ach.level('lgd')===2);
fresh();Store.d.ls.dsb=14;Store.save();t('best daily streak 14 completes 3 levels and never drops when the streak breaks',Ach.level('ds')===3);
fresh();Mastery.add('mn',1e6);Mastery.add('fl',1e6);Store.save();t('Mastery Levels counts completed Mastery levels (20 completed: 2 + ... )',Ach.value('ml')===Mastery.total()&&Ach.value('ml')>=20);
// ================= 5. claims
fresh();{const b0=Store.d.balance,g0=Store.d.gems;t('an unfinished level cannot be claimed',!Ach.claim('lc',1).ok&&Store.d.balance===b0&&Store.d.gems===g0);
Store.d.ls.lc=300000;Store.save();const c1=Ach.claim('lc',1),c1b=Ach.claim('lc',1);t('claim pays that level once (Coin + Gems), second claim refused',c1.ok&&c1.cash===Ach.by.lc.cash[0]&&c1.gems===Ach.by.lc.gems[0]&&!c1b.ok&&/Already/.test(c1b.msg)&&Store.d.balance===b0+c1.cash&&Store.d.gems===g0+c1.gems);
t('levels are claimed individually (level 2 still claimable, level 3 not completed)',Ach.stats('lc').claimed===1&&Ach.stats('lc').claimable===1&&!Ach.claim('lc',3).ok);
const c2=Ach.claim('lc',2);t('claiming a cosmetic level adds the exclusive cosmetic to the inventory exactly once',c2.ok&&c2.cos&&c2.cos.id==='a_lc_2'&&Store.d.inv.filter(x=>x==='a_lc_2').length===1&&Store.d.balance===b0+c1.cash+c2.cash)}
fresh();Store.d.ls.lc=300000;Store.d.inv=['a_lc_2'];Store.save();{const b=Store.d.balance;Ach.claim('lc',1);const c=Ach.claim('lc',2);t('an already owned cosmetic is never duplicated (Coin / Gems still paid once)',c.ok&&!c.gave&&Store.d.inv.filter(x=>x==='a_lc_2').length===1&&Store.d.balance===b+Ach.by.lc.cash[0]+Ach.by.lc.cash[1])}
t('claimed Gems count as earned Gems; claimed Coin as Coin income (not profit)',Store.d.ls.lg>=Ach.by.lc.gems[0]+Ach.by.lc.gems[1]&&Store.d.ls.lp===0);
fresh();Store.d.ls.lc=1e9;Store.save();for(let l=1;l<=5;l++)Ach.claim('lc',l);Store.save();realLoad();t('claims and cosmetics persist across reload; everything claimed once',Ach.stats('lc').claimed===5&&Ach.stats('lc').claimable===0&&['a_lc_2','a_lc_3','a_lc_5'].every(id=>Store.d.inv.includes(id))&&!Ach.claim('lc',5).ok);
t('achievement save is signed; an edited one is rejected (claims read as empty, nothing granted)',(()=>{fresh();Store.d.lq=100;Store.save();Store.armed=true;Store.sync();const g=Ach.claim('lq',1),raw=localStorage.getItem(Ach.KEY),ok=g.ok&&raw.startsWith('S2:')&&Ach.read().k.lq===1;localStorage.setItem(Ach.KEY,raw.replace(/"lq":\d+/,'"lq":31'));const bad=Ach.read().k.lq===0;Store.armed=false;return ok&&bad})());
fresh();Store.d.ls.lc=1e9;Store.save();Ach.claim('lc',3);const owned=Store.d.inv.slice();Store.d.eq.tag='a_lc_3';t('equipped exclusive cosmetics validate through Inv.apply (tag) and Cos.user (gradient)',Inv.apply('a_lc_3',null)&&Store.d.eq.tag==='a_lc_3'&&Cos.user('Bob','a_lc_2').includes('Bob'));
fresh();Store.d.ls.lp=10;Store.save();Ach.read();t('achievement data never touches rank money / quests',Store.d.rc===0&&Store.d.q.d.p.profit===0);
// ================= 6. pity
const rows=k=>Crate.table(k),pickAt=(k,rar)=>{let cum=0;const tb=rows(k);for(const r of tb){if(r.c.rar===rar){return(cum+r.p/2)/100}cum+=r.p}};
const P=()=>Crate.pity.get();
fresh();Store.d.gems=300;localStorage.removeItem('0-100_v2.95_pity');
Crate.open('tags',()=>pickAt('tags','common'));t('a common spin increments pity (1)',P().tags===1&&P().grads===0);
Crate.open('tags',()=>pickAt('tags','epic'));t('an Epic spin ALSO increments and never resets pity (2)',P().tags===2);
Crate.open('tags',()=>pickAt('tags','legendary'));t('a Legendary spin ALSO increments and never resets pity (3)',P().tags===3);
Crate.open('grads',()=>pickAt('grads','epic'));t('Gradient pity is independent (1) and Tag pity is untouched (3)',P().grads===1&&P().tags===3);
Crate.open('grads',()=>pickAt('grads','rare'));Crate.open('grads',()=>pickAt('grads','legendary'));t('rare / legendary gradient rolls: 3 total, tags still 3',P().grads===3&&P().tags===3);
t('pity is persisted in its own signed key and survives a reload of the game state',(()=>{const cur=Crate.pity.get();Store.armed=true;Crate.pity.put(cur);const raw=localStorage.getItem('0-100_v2.95_pity');realLoad();const ok=raw.startsWith('S2:')&&Crate.pity.get().tags===3&&Crate.pity.get().grads===3;Store.armed=false;return ok})());
fresh();Store.d.gems=900;localStorage.removeItem('0-100_v2.95_pity');let nat=0,forced=null;for(let i=0;i<10;i++){const r=Crate.open('tags',()=>pickAt('tags','common'));if(!r.ok||r.c.rar!=='common')nat++}
t('ten non-Epic spins fill pity to 10 (limit kept at 10)',P().tags===10&&Crate.PITY_LIMIT===10&&nat===0);
forced=Crate.open('tags',()=>pickAt('tags','common'));t('spin 11 is a guaranteed Epic/Legendary even when the RNG says common, then the counter is consumed',forced.ok&&(forced.c.rar==='epic'||forced.c.rar==='legendary')&&P().tags===0);
Crate.open('tags',()=>pickAt('tags','common'));t('after the guarantee the counter starts again from 1',P().tags===1);
fresh();Store.d.gems=900;localStorage.removeItem('0-100_v2.95_pity');for(let i=0;i<10;i++)Crate.open('grads',()=>pickAt('grads','epic'));t('ten natural Epic spins still count to 10 (Epic never resets) and the 11th is guaranteed Epic+',P().grads===10&&(()=>{const r=Crate.open('grads',()=>pickAt('grads','rare'));return r.ok&&(r.c.rar==='epic'||r.c.rar==='legendary')&&P().grads===0})());
fresh();Store.d.gems=2;Crate.open('tags');t('a refused open (not enough Gems) does not move pity',P().tags===0);
t('Gem cost / crate odds untouched',CFG.CRATE.COST===3&&Math.abs(Crate.totals('tags').legendary-6.5)<1e-9&&Math.abs(Crate.totals('grads').epic-30)<1e-9);
// ================= 7. Aviamasters
{const sb={console,Math,Date,Games:{},CFG:{AVI_SPEED:[[34,2.75],[30,2.5],[7,2],[3,1.5]]},document:{}};vm.createContext(sb);vm.runInContext(fs.readFileSync(J('games/aviamasters'),'utf8'),sb);const A=sb.Games.aviamasters,N=1500000;
let s=0,land=0,pf=0,cr=0,fa=0,u1=0,b12=0,b24=0,b45=0,b56=0,b67=0,jp=0,mx=0;for(let i=0;i<N;i++){const p=A.plan();if(p.crash){cr++;continue}if(p.fall){fa++;continue}land++;s+=p.m;mx=Math.max(mx,p.m);if(p.m>1)pf++;if(p.jp)jp++;else if(p.m<1)u1++;else if(p.m<2)b12++;else if(p.m<4)b24++;else if(p.m<5)b45++;else if(p.m<6)b56++;else b67++}
t('Aviamasters: 4-5x, 5-6x and 6-7x are all genuinely reachable ('+[b45,b56,b67].join('/')+' landings in '+N+' flights)',b45>5000&&b56>2500&&b67>1500);
t('Aviamasters: explicit bands config (2-4x, 4-5x, 5-6x, 6-7x) with sensible chances',A.BANDS.map(b=>b[0]+'-'+b[1]).join()==='2-4,4-5,5-6,6-7'&&A.BANDS.every(b=>b[2]>0&&b[2]<.05)&&A.BANDS[1][2]>A.BANDS[2][2]&&A.BANDS[2][2]>A.BANDS[3][2]);
t('Aviamasters: return ~101% ('+(s/N*100).toFixed(2)+'%) and profit rate ~36% ('+(pf/N*100).toFixed(2)+'%) - measured, not assumed',Math.abs(s/N-1.0096)<.02&&pf/N>.34&&pf/N<.38&&land/N>.88);
const C=Object.fromEntries(A.CHANCES.map(([n,p])=>[n,p])),sum=A.CHANCES.reduce((a,r)=>a+r[1],0),emp={'Crashed into the sea':cr/N,'Slid off the runway':fa/N,'Landed under 1x (loss)':u1/N,'Landed 1x to 2x':b12/N,'Landed 2x to 4x':b24/N,'Landed 4x to 5x':b45/N,'Landed 5x to 6x':b56/N,'Landed 6x to 7x':b67/N};
t('Aviamasters: displayed chances total 100% ('+sum.toFixed(3)+')',Math.abs(sum-100)<.05);
t('Aviamasters: every displayed physics / band chance matches the simulation (<0.15 points)',Object.entries(emp).every(([k,v])=>Math.abs(C[k]-v*100)<.15),Object.entries(emp).map(([k,v])=>k+' '+C[k]+' vs '+(v*100).toFixed(3)).join(' | '));
t('Aviamasters: jackpots unchanged (ranges 10-300x, still the rarest result, max 300x)',A.JP.length===5&&A.JP[0][0]===250&&A.JP[0][1]===300&&mx<=300&&jp/N>.002&&jp/N<.0045&&A.PR===.3);
t('Aviamasters: the odds panel renders the new band rows',['Landed 2x to 4x','Landed 4x to 5x','Landed 5x to 6x','Landed 6x to 7x'].every(n=>A.chancesHtml().includes(n)));
t('Aviamasters: boosted landings reuse the HUD snap (P.hi) and the source documents the soft-cap recalibration',/P\.jp\|\|P\.hi/.test(src('js/games/aviamasters.js'))&&/old soft cap/.test(src('js/games/aviamasters.js')))}
fresh();Econ.settle('AVIAMASTERS',10,45);Econ.settle('AVIAMASTERS',10,55);Econ.settle('AVIAMASTERS',10,65);Econ.settle('AVIAMASTERS',10,39.9);
{const c=Mastery.read().c;t('Mastery a4 / a5 / a6 recognise 4.5x / 5.5x / 6.5x landings (and 3.99x counts nowhere)',c.a4===1&&c.a5===1&&c.a6===1&&c.a7===0&&c.av===4)}
// ================= 8. wiring
const ld=src('js/loader.js'),list=[...ld.match(/const F=\[([^\]]*)\]/)[1].matchAll(/'([^']+)'/g)].map(m=>m[1]),ix=n=>list.indexOf(n);
t('loader: cos30 after limited and BEFORE storage; achievements right after mastery; no duplicates',ix('cos30')>ix('limited')&&ix('cos30')<ix('storage')&&ix('achievements')===ix('mastery')+1&&new Set(list).size===list.length);
{let err=null;try{new Function(list.map(n=>fs.readFileSync(J(n),'utf8')).join('\n;\n'))}catch(e){err=e.message}t('the whole loader bundle ('+list.length+' files) parses as ONE script'+(err?' - '+err:''),!err)}
t('every file the loader names exists',list.every(n=>fs.existsSync(J(n))||n==='dev'||n==='dev295'));
const gh=src('game.html');
t('game.html: Achievements nav item directly below Mastery with a trophy icon; update30.css and the pixel font are loaded',/Mastery<\/span><\/a>\s*<a class="sbi" href="#achievements"/.test(gh)&&/<span class="sbl">Achievements<\/span>/.test(gh)&&/css\/update30\.css/.test(gh)&&/Press\+Start\+2P/.test(gh)&&/Update 3\.0/.test(gh));
const sw=src('sw.js');
t('service worker: new cache name and every new file / image is pre-cached',/gold-offline-v3\.0/.test(sw)&&['css/update30.css','js/cos30.js','js/achievements.js','js/addon295.js','js/cos295.js'].every(f=>sw.includes("'"+f+"'"))&&['elite','obsidian','netherite','bedrock'].every(n=>sw.includes("'"+n+".jpg'")));
t('page registered and routed',/Pages\.achievements=/.test(src('js/achievements.js'))&&/href="#achievements"/.test(gh));
t('Mastery collections still mean "everything" (Level 10 includes rank gradients + achievement cosmetics)',/Cos\.rank\|\|\[\]/.test(src('js/addon295.js'))&&Mastery.by.gc.thr[9]===[...COS,...Cos.lim,...Cos.rank,...Cos.ach].filter(c=>c.type==='grad').length&&Mastery.by.tc.thr[9]===[...COS,...Cos.lim,...Cos.rank,...Cos.ach].filter(c=>c.type==='tag').length-1&&Mastery.by.gc.thr[9]>Mastery.by.gc.thr[8]);
t('static checks: no duplicate cosmetic ids across COS / limited / rank / achievement',(()=>{const ids=[...COS,...Cos.lim,...Cos.rank,...Cos.ach].map(c=>c.id);return new Set(ids).size===ids.length})());
t('static checks: every cosmetic id resolves through Cos.by and renders markup',[...COS,...Cos.lim,...Cos.rank,...Cos.ach].every(c=>Cos.by(c.id)===c&&Cos.html(c).length>10));
console.log(`\n${pass} passed, ${fail} failed`);process.exit(fail?1:0);
