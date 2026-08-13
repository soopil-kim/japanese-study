/* ===== 독해 지문 공통 렌더러 =====
   페이지에서 준비할 것:
     - window.SHOW_FURI : true(후리가나판) / false(원문판)
     - TEXTS : [{id, title, paras:[ [ [일본어문장, 한국어해석], ... ], ... ]}]
               ※ paras 의 각 원소 = 한 문단, 문단은 [문장, 해석] 쌍의 배열
     - DICT  : {"표기":["읽기","뜻"]}  — 접속어·문법표현은 읽기를 null 로
     - #out 컨테이너, #toggleAll 버튼
   문장마다 「뜻」 버튼이 붙고, 누르면 그 문장 바로 아래에 해석이 펼쳐진다.
*/
(function(){
const SHOW_FURI = !!window.SHOW_FURI;
const esc = s => s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
const KEYS = Object.keys(DICT).sort((a,b)=>b.length-a.length);
const MAXLEN = KEYS.length ? KEYS[0].length : 1;

/* 후리가나를 '한자 부분에만' 얹는다. 예) 来て(きて) → 来 위에 き, 오쿠리가나 て는 그대로. */
const isKana = c => /[ぁ-ゟ゠-ヿー]/.test(c);
function rubyHtml(k,r){
  if(!r) return esc(k);
  const segs=[]; let cur="", curKana=null;
  for(const ch of k){
    const kn=isKana(ch);
    if(curKana===null||kn===curKana){cur+=ch;curKana=kn;}
    else{segs.push({t:cur,kana:curKana});cur=ch;curKana=kn;}
  }
  if(cur)segs.push({t:cur,kana:curKana});
  if(segs.length===1&&!segs[0].kana)
    return `<ruby>${esc(k)}<rt>${esc(r)}</rt></ruby>`;
  let rest=r, out="", ok=true;
  for(let i=0;i<segs.length;i++){
    const s=segs[i];
    if(s.kana){
      if(rest.startsWith(s.t)){ out+=esc(s.t); rest=rest.slice(s.t.length); }
      else { ok=false; break; }
    }else{
      const next=segs[i+1];
      let read;
      if(next&&next.kana){
        const idx=rest.indexOf(next.t);
        if(idx<=0){ ok=false; break; }
        read=rest.slice(0,idx); rest=rest.slice(idx);
      }else{ read=rest; rest=""; }
      out+=`<ruby>${esc(s.t)}<rt>${esc(read)}</rt></ruby>`;
    }
  }
  if(!ok||rest) return `<ruby>${esc(k)}<rt>${esc(r)}</rt></ruby>`;
  return out;
}

/* [19] 같은 빈칸 표시는 사전 매칭에서 빼고 그대로 둔다 */
const BLANK_RE = /^\[\d{1,2}\]/;
function markup(s){
  let out="",i=0;
  while(i<s.length){
    if(s[i]==="["){
      const m=s.slice(i).match(BLANK_RE);
      if(m){ out+=`<span class="blank">${esc(m[0])}</span>`; i+=m[0].length; continue; }
    }
    let hit=null;
    for(let L=Math.min(MAXLEN,s.length-i);L>=1;L--){
      const sub=s.substr(i,L);
      if(Object.prototype.hasOwnProperty.call(DICT,sub)){hit=[sub,DICT[sub]];break;}
    }
    if(hit){
      const [k,[r,m]]=hit;
      const inner=(SHOW_FURI&&r)?rubyHtml(k,r):esc(k);
      const mn=(!SHOW_FURI&&r)?esc(r)+" · "+esc(m):esc(m);
      out+=`<span class="kw${r===null?' conj':''}">${inner}<span class="mn">${mn}</span></span>`;
      i+=k.length;
    }else{ out+=esc(s[i]); i++; }
  }
  return out;
}

const out = document.getElementById("out");
out.innerHTML = TEXTS.map(t=>
  `<div class="lesson"><div class="lh">${esc(t.id)}<small>${esc(t.title)}</small></div>`+
  t.paras.map(sents=>
    `<div class="jp">`+
    sents.map(([jp,ko])=>
      `<span class="sent">${markup(jp)}<button class="tko" type="button" title="이 문장 뜻 보기">뜻</button>`+
      `<span class="ko">${esc(ko)}</span></span>`
    ).join("")+
    `</div>`
  ).join("")+
  `</div>`).join("");

/* 단어 탭 → 읽기·뜻 / 「뜻」 버튼 탭 → 그 문장 해석 */
out.addEventListener("click",e=>{
  const btn=e.target.closest(".tko");
  if(btn){ btn.closest(".sent").classList.toggle("open-ko"); return; }
  const el=e.target.closest(".kw");
  if(el) el.classList.toggle("open");
});

const allBtn=document.getElementById("toggleAll");
if(allBtn) allBtn.onclick=()=>{
  const kws=out.querySelectorAll(".kw");
  const any=[...kws].some(k=>!k.classList.contains("open"));
  kws.forEach(k=>k.classList.toggle("open",any));
};
/* 문장 해석은 그 문장의 「뜻」 버튼을 누를 때만 보인다 — 일괄 펼치기 없음 */
})();
