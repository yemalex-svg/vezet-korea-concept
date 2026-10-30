/* Общие скрипты внутренних страниц «Везёт Корея» */
(function(){
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const V=window.VK;
const toastEl=$('#toast');let tt;
function toast(m){toastEl.textContent=m;toastEl.classList.add('on');clearTimeout(tt);tt=setTimeout(()=>toastEl.classList.remove('on'),2800);}
const RMOT=matchMedia('(prefers-reduced-motion: reduce)').matches;
$$('[data-soon]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();toast(a.dataset.soon);}));

/* reveal on enter */
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}}),{threshold:.12});
$$('.rv').forEach(el=>io.observe(el));

/* nav dropdowns + mobile menu */
$$('.dd-b').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();const d=b.parentElement,on=!d.classList.contains('open');$$('.dd').forEach(x=>x.classList.remove('open'));d.classList.toggle('open',on);}));
document.addEventListener('click',e=>{if(!e.target.closest('.dd'))$$('.dd').forEach(x=>x.classList.remove('open'));});
$('#burger').addEventListener('click',()=>$('#nav').classList.toggle('open'));
$$('.nav .links a').forEach(a=>a.addEventListener('click',()=>$('#nav').classList.remove('open')));

/* «Рассчитать доставку»: калькулятор на этой странице или на странице тарифов */
document.addEventListener('click',e=>{const a=e.target.closest('[data-calc]');if(!a)return;const c=$('#calc');if(!c)return;e.preventDefault();$('#nav').classList.remove('open');c.scrollIntoView({behavior:RMOT?'auto':'smooth'});});

/* tracking in the nav */
const pop=$('#pop');
function trackHTML(k){const d=V.DEMO[k];
  return d?'<b>'+V.STG[d.st]+'</b><div class="bar">'+V.STG.map((s,i)=>'<span class="'+(i<=d.st?'on':'')+'"></span>').join('')+'</div><small>'+k+' · '+d.t+' · '+d.w+'. День '+d.day+' из '+d.tot+'. Получение: '+d.city+'.</small>'
          :'<b>Посылки с таким номером нет</b><small>Номер приходит в сообщении менеджера. Для примера попробуйте VK-20481.</small>';}
$('#trackForm').addEventListener('submit',e=>{e.preventDefault();const k=$('#trackIn').value.trim().toUpperCase().replace(/\s/g,'');pop.innerHTML=trackHTML(k);pop.classList.add('on');});
document.addEventListener('click',e=>{if(!e.target.closest('#trackForm'))pop.classList.remove('on');});

/* FAQ */
$$('.q button').forEach(b=>b.addEventListener('click',()=>b.parentElement.classList.toggle('on')));

/* motion helpers */
function busy(btn,ms){return new Promise(res=>{if(!btn||RMOT){res();return;}
  if(!btn.querySelector('.dots')) btn.insertAdjacentHTML('beforeend','<span class="dots" aria-hidden="true"><i></i><i></i><i></i></span>');
  btn.classList.add('busy'); setTimeout(()=>{btn.classList.remove('busy');res();},ms);});}
function roll(el,text){
  el.classList.add('odo'); el.setAttribute('aria-label',text); el.textContent='';
  const ch=[...text], di=ch.map((c,i)=>/\d/.test(c)?i:-1).filter(i=>i>=0);
  ch.forEach((c,i)=>{
    const col=document.createElement('span'), st=document.createElement('span'); col.className='odo-d'; col.setAttribute('aria-hidden','true'); st.className='odo-s';
    if(!/\d/.test(c)||RMOT){st.innerHTML='<i>'+c+'</i>'; col.appendChild(st); el.appendChild(col); return;}
    const n=di.indexOf(i), d=+c, R=Math.min(1+n,4); let h='';
    for(let r=0;r<R;r++) for(let k=0;k<10;k++) h+='<i>'+k+'</i>';
    for(let k=0;k<=d;k++) h+='<i>'+k+'</i>';
    st.innerHTML=h; col.appendChild(st); el.appendChild(col);
    st.animate([{transform:'translateY(0)',filter:'blur(0)'},{filter:'blur(1.8px)',offset:.35},{filter:'blur(.5px)',offset:.8},{transform:'translateY(-'+(R*10+d)+'em)',filter:'blur(0)'}],
      {duration:700+n*120,easing:'cubic-bezier(.15,.75,.25,1)',fill:'forwards'});
  });
}

/* lead form (CTA card) */
$$('form.lead').forEach(f=>{
  const send=f.querySelector('.send'), done=f.parentElement.querySelector('.done');
  const ok=()=>{const n=f.querySelector('[name=name]'),c=f.querySelector('[name=contact]');return (!n||n.value.trim().length>1)&&c&&c.value.trim().length>2;};
  f.addEventListener('input',()=>send.classList.toggle('ok',ok()));
  f.addEventListener('submit',e=>{e.preventDefault();if(!ok()){toast('Заполните имя и телефон или Telegram');return;}busy(send,900).then(()=>{f.style.display='none';if(done)done.style.display='block';});});
});

/* ---------- tariff cards ---------- */
function card(k){
  const cls=k.s==='img'?'t-img':k.s==='grey'?'t-grey':'t-navy';
  const im=k.img?'<img class="bgi" loading="lazy" alt="" '+(k.img==='plane'?'style="transform:translateX(12%) scale(1.35)" ':'')+'src="'+V.IMG[k.img]+'"><div class="ov"></div>':'';
  const bt=k.pick?'<a class="btn o" href="#calc" data-pick="'+k.pick+'">Посчитать '+k.bn+'</a>':'<a class="btn o" href="#contact">Узнать цену</a>';
  const nm=k.lab.split(' · '), tag=nm[1]?nm[1].charAt(0).toUpperCase()+nm[1].slice(1)+'. ':'';
  return '<article class="tc '+cls+'">'+im+'<div><h3>'+nm[0]+'</h3><p class="tl">'+tag+k.h+'.</p></div><div><div class="spec">'+k.spec.map(x=>'<div><div class="mono">'+x[0]+'</div><b>'+x[1]+'</b></div>').join('')+'</div>'+bt+'</div></article>';
}
function cards(el,code){const list=V.CARDS[code]; el.innerHTML=list.map(card).join(''); el.classList.toggle('odd',list.length%2===1&&list.length>1);}

/* ---------- calculator ---------- */
function initCalc(root,opt){
  opt=opt||{};
  let cc=opt.country||'ru', tk=null, cat=0;
  const q=s=>root.querySelector(s);
  const cCountry=q('.cCountry'), cW=q('.cW'), cTabs=q('.cTabs'), cCat=q('.cCat'), catFld=q('.catFld'), cCity=q('.cCity');
  if(opt.lock) cCountry.closest('.fld').classList.add('lockc');
  cCat.innerHTML=V.CATS.map((x,i)=>'<option value="'+i+'">'+x[0]+' · '+V.usdS(x[1])+' за кг</option>').join('');
  const T=()=>V.C[cc].t.find(x=>x.k===tk)||V.C[cc].t[0];
  const lim=()=>V.C[cc].lim||[0.5,30];
  function drawTabs(){
    const ts=V.C[cc].t; if(!ts.some(x=>x.k===tk)) tk=ts[0].k;
    cTabs.innerHTML=ts.map(t=>'<button type="button" class="tab'+(t.k===tk?' on':'')+'" data-t="'+t.k+'">'+t.name+'</button>').join('');
    catFld.hidden=!T().cat;
    const L=lim(); cW.min=L[0]; cW.max=L[1]; if(+cW.value<L[0]) cW.value=L[0];
    q('.tkMin').textContent=V.fmtKg(L[0]);
  }
  function bars(w){const c=V.C[cc]; if(c.t.length<2) return '';
    const vs=c.t.map(t=>{const m=V.cost(cc,t,w,cat); return {t,m,v:m?+m.main.replace(/[^\d]/g,''):null};}), mx=Math.max(1,...vs.map(x=>x.v||0));
    return '<div class="hw-bars">'+vs.map(x=>'<button type="button" class="hb'+(x.t.k===tk?' on':'')+(x.v==null?' na':'')+'" data-t="'+x.t.k+'" title="'+x.t.name+' · '+V.days(x.t)+'"><span class="hb-v">'+(x.m?x.m.main:'по запросу')+'</span><span class="hb-b" style="--h:'+(x.v?Math.max(.1,x.v/mx).toFixed(3):.1)+'"></span><span class="hb-n">'+x.t.name+'</span></button>').join('')+'</div>';}
  function calc(animate){
    const c=V.C[cc], t=T(), w=parseFloat(cW.value), L=lim();
    q('.wOut').textContent=V.fmtKg(w);
    cW.style.setProperty('--p',((w-L[0])/(L[1]-L[0])*100)+'%');
    q('.rTtl').innerHTML=(t.title||t.name+' в '+c.n)+' <em>Посылка '+V.fmtKg(w)+' обойдётся в</em>';
    const m=V.cost(cc,t,w,cat), sum=q('.rSum');
    if(m){const s=(m.ap?'≈ ':'')+m.main; if(animate) roll(sum,s); else {sum.classList.remove('odo');sum.textContent=s;}
      q('.rMeta').innerHTML='<span>Срок: <b>'+V.days(t)+'</b></span><span>'+m.sub+'</span>'+(t.cat?'<span>Категория: <b>'+V.CATS[cat][0]+'</b>, '+V.usdS(V.CATS[cat][1])+' за кг</span>':'');}
    else{sum.classList.remove('odo');sum.textContent='Цену назовём';
      q('.rMeta').innerHTML='<span>Срок: <b>'+V.days(t)+'</b></span><span>Цену этого тарифа для '+c.g+' назовёт менеджер.</span>';}
    q('.rNote').textContent=c.note||'';
    const b=bars(w); q('.rAllT').textContent=b?'Все тарифы для '+V.fmtKg(w)+':':''; q('.rBars').innerHTML=b;
  }
  function set(code){if(!V.C[code])return;cc=code;cCountry.value=code;if(cCity)cCity.placeholder='Например, '+V.C[code].city;drawTabs();calc(true);if(opt.onCountry)opt.onCountry(code);}
  cCountry.addEventListener('change',()=>set(cCountry.value));
  cW.addEventListener('input',()=>calc(false));
  cW.addEventListener('change',()=>calc(true));
  cCat.addEventListener('change',()=>{cat=+cCat.value;calc(true);});
  cTabs.addEventListener('click',e=>{const b=e.target.closest('.tab');if(!b)return;tk=b.dataset.t;drawTabs();calc(true);});
  q('.rBars').addEventListener('click',e=>{const b=e.target.closest('.hb');if(!b)return;tk=b.dataset.t;drawTabs();calc(true);});
  document.addEventListener('click',e=>{const a=e.target.closest('[data-pick]');if(!a)return;e.preventDefault();if(a.dataset.c&&a.dataset.c!==cc)set(a.dataset.c);tk=a.dataset.pick;drawTabs();calc(true);root.scrollIntoView({behavior:RMOT?'auto':'smooth'});});
  const ask=q('.askForm'); if(ask) ask.addEventListener('submit',e=>{e.preventDefault();const inp=ask.querySelector('input');if(inp.value.trim().length<3){toast('Укажите телефон или ник в Telegram');return;}busy(ask.querySelector('.btn'),800).then(()=>{toast('Готово. Это концепт: после запуска заявка придёт менеджеру в Telegram');inp.value='';});});
  set(cc);
  return {set};
}

/* ---------- glowing pulse lines in the final block (desktop only) ---------- */
const SVGNS='http://www.w3.org/2000/svg';
function pulse(host,build,o){
  o=o||{};
  const svg=document.createElementNS(SVGNS,'svg'), gid='plg'+Math.random().toString(36).slice(2,8);
  svg.setAttribute('class','pl'); svg.setAttribute('aria-hidden','true');
  svg.innerHTML='<defs><radialGradient id="'+gid+'"><stop offset="0" stop-color="#F96C19" stop-opacity=".6"/><stop offset=".3" stop-color="#F96C19" stop-opacity=".22"/><stop offset="1" stop-color="#F96C19" stop-opacity="0"/></radialGradient></defs><path class="pl-base"/><circle class="pl-glow" r="72" fill="url(#'+gid+')" opacity="0"/><path class="pl-dot" opacity="0"/>';
  host.appendChild(svg);
  const base=svg.querySelector('.pl-base'), dot=svg.querySelector('.pl-dot'), glow=svg.querySelector('.pl-glow');
  let len=0, vis=false;
  const draw=()=>{const r=host.getBoundingClientRect(); if(!r.width) return; svg.setAttribute('viewBox','0 0 '+r.width+' '+r.height); const d=build(r.width,r.height,r); svg.style.display=d?'':'none'; if(!d){len=0;return;} base.setAttribute('d',d); dot.setAttribute('d',d); len=dot.getTotalLength();};
  draw(); addEventListener('resize',draw); if(document.fonts) document.fonts.ready.then(draw);
  if(RMOT) return;
  new IntersectionObserver(es=>{vis=es[0].isIntersecting;}).observe(host);
  const D=18, sp=o.speed||.5, pause=o.pause||1400, t0=performance.now()-Math.random()*1500;
  const tick=now=>{ if(vis&&len){const t=(now-t0)%(len/sp+pause), pos=t*sp-D, on=pos<len;
      dot.setAttribute('opacity',on?1:0); glow.setAttribute('opacity',on?1:0);
      if(on){dot.style.strokeDasharray=D+' '+(len+D); dot.style.strokeDashoffset=-pos; const p=dot.getPointAtLength(Math.max(0,Math.min(len,pos+D/2))); glow.setAttribute('cx',p.x); glow.setAttribute('cy',p.y);}}
    requestAnimationFrame(tick);};
  requestAnimationFrame(tick);
}
const rounded=(pts,rad)=>{let d='M'+pts[0][0]+' '+pts[0][1];
  for(let i=1;i<pts.length-1;i++){const a=pts[i-1],c=pts[i],b=pts[i+1],da=Math.hypot(c[0]-a[0],c[1]-a[1]),db=Math.hypot(b[0]-c[0],b[1]-c[1]),q=Math.min(rad,da/2,db/2);
    d+='L'+(c[0]-(c[0]-a[0])/da*q)+' '+(c[1]-(c[1]-a[1])/da*q)+'Q'+c[0]+' '+c[1]+' '+(c[0]+(b[0]-c[0])/db*q)+' '+(c[1]+(b[1]-c[1])/db*q);}
  const z=pts[pts.length-1]; return d+'L'+z[0]+' '+z[1];};
const fin=$('.final');
if(fin){
  const geo=r=>{const nw=[...fin.querySelectorAll('.slogan .nw')].map(e=>e.getBoundingClientRect()), sl={left:Math.min(...nw.map(x=>x.left)),right:Math.max(...nw.map(x=>x.right)),top:Math.min(...nw.map(x=>x.top))}; sl.width=sl.right-sl.left; const bt=fin.querySelector('.cta .btn').getBoundingClientRect(), sv=fin.querySelectorAll(':scope > .edge svg');
    const gl=sv.length?sv[0].getBoundingClientRect().right-r.left:0, gr=sv.length?sv[1].getBoundingClientRect().left-r.left:r.width;
    return {sl:{l:sl.left-r.left,r:sl.right-r.left,t:sl.top-r.top,w:sl.width},bt:{t:bt.top-r.top,b:bt.bottom-r.top},gl,gr};};
  pulse(fin,(w,h,r)=>{if(w<1024) return ''; const g=geo(r), x0=Math.max(g.sl.l+g.sl.w*.22,g.gl+60), yA=Math.max(96,g.sl.t-70), xL=Math.max(40,g.sl.l-110), yB=g.bt.b+80;
    return rounded([[x0,0],[x0,yA],[xL,yA],[xL,yB],[0,yB]],44);},{speed:.42,pause:1600});
  pulse(fin,(w,h,r)=>{if(w<1024) return ''; const g=geo(r), x1=Math.min(g.sl.l+g.sl.w*.78,g.gr-60), yC=Math.max(120,g.sl.t-40), xR=Math.min(w-40,g.sl.r+110), yD=g.bt.t+20;
    return rounded([[x1,0],[x1,yC],[xR,yC],[xR,yD],[w,yD]],44);},{speed:.42,pause:2200});
}

window.VKUI={$,$$,clamp,toast,busy,roll,cards,initCalc,trackHTML};
})();
