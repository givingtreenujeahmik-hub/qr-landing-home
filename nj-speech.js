/* Sentence playback, followed by a complete, continuously readable paragraph. */
(function () {
  'use strict';
  let active=null;
  const reduced=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const locales={ko:'ko',en:'en',cn:'zh-CN',jp:'ja'};

  function segments(text,locale){
    if(typeof Intl.Segmenter==='function'){
      return Array.from(new Intl.Segmenter(locales[locale]||locale||'ko',{granularity:'sentence'}).segment(text),s=>({start:s.index,end:s.index+s.segment.length}));
    }
    // Older browsers: keep decimal numbers intact; split CJK punctuation without spaces.
    const parts=[];let start=0;
    for(let i=0;i<text.length;i++){
      if(!/[.!?。！？]/.test(text[i]))continue;
      if(text[i]==='.' && /\d/.test(text[i-1]||'') && /\d/.test(text[i+1]||''))continue;
      let end=i+1;while(end<text.length && /[.!?。！？"'”’」』）)]/.test(text[end]))end++;
      if(/[.!?]/.test(text[i]) && end<text.length && !/\s/.test(text[end]))continue;
      parts.push({start,end});start=end;i=end-1;
    }
    if(start<text.length)parts.push({start,end:text.length});
    return parts;
  }

  function sentences(fragments,locale){
    const out=[];
    for(const html of fragments){
      const source=document.createElement('div');source.innerHTML=html;
      source.querySelectorAll('br').forEach(br=>br.replaceWith(document.createTextNode(' ')));
      // A secondary note is still spoken content, not a permanently muted label.
      source.querySelectorAll('.sub').forEach(note=>note.replaceWith(document.createTextNode(' '),...Array.from(note.childNodes),document.createTextNode(' ')));
      source.querySelectorAll('.w').forEach(word=>word.replaceWith(...Array.from(word.childNodes)));
      source.normalize();
      const walker=document.createTreeWalker(source,NodeFilter.SHOW_TEXT),nodes=[];
      let node,offset=0;
      while((node=walker.nextNode())){nodes.push({node,start:offset,end:offset+node.length});offset+=node.length;}
      const text=source.textContent;
      for(const part of segments(text,locale)){
        let start=part.start,end=part.end;
        while(start<end && /\s/.test(text[start]))start++;
        while(end>start && /\s/.test(text[end-1]))end--;
        if(start===end)continue;
        const first=nodes.find(n=>n.end>start),last=nodes.find(n=>n.end>=end);
        const range=document.createRange();range.setStart(first.node,start-first.start);range.setEnd(last.node,end-last.start);
        let fragment=range.cloneContents();
        let ancestor=range.commonAncestorContainer;
        if(ancestor.nodeType===Node.TEXT_NODE)ancestor=ancestor.parentNode;
        // cloneContents omits a shared <b>/<em> ancestor when a whole sentence is inside it.
        while(ancestor && ancestor!==source){
          const parent=ancestor.cloneNode(false);parent.appendChild(fragment);fragment=parent;ancestor=ancestor.parentNode;
        }
        const copy=document.createElement('span');copy.appendChild(fragment);
        out.push({html:copy.innerHTML,text:text.slice(start,end)});
      }
    }
    return out;
  }

  function duration(text,locale){
    const count=Array.from(text.replace(/\s+/g,'')).length;
    return Math.max(950,Math.min(4200,450+count*(locale==='en'?23:40)));
  }

  function play(container,fragments,options={}){
    cancel();
    const parts=sentences(fragments,options.locale);
    const answer=document.createElement('p');answer.className='speech-answer is-speaking';
    container.appendChild(answer);
    container.setAttribute('aria-busy','true');
    let timer=0,advance=null,closed=false,resolve;
    const promise=new Promise(r=>{resolve=r;});
    const scroll=()=>container.scrollTo({top:container.scrollHeight,behavior:reduced()?'auto':'smooth'});
    const settle=complete=>{
      if(closed)return;closed=true;clearTimeout(timer);
      if(complete){
        answer.className='speech-answer is-complete';
        answer.innerHTML=parts.map(p=>p.html).join(' ');
        if(!reduced() && typeof answer.animate==='function')answer.animate([{opacity:.7},{opacity:1}],{duration:160,easing:'ease-out'});
        // Return to the start of the full paragraph; long answers remain scrollable.
        container.scrollTo({top:0,behavior:'auto'});
      }
      container.setAttribute('aria-busy','false');
      if(active===run)active=null;
      if(advance){const next=advance;advance=null;next();}
      resolve(complete);
    };
    const run={finish:()=>settle(true),cancel:()=>settle(false)};
    active=run;
    if(reduced()||!parts.length){settle(true);return promise;}
    (async()=>{
      try{
        for(let i=0;i<parts.length;i++){
          if(closed)return;
          answer.querySelectorAll('.is-current').forEach(el=>{el.classList.remove('is-current');el.removeAttribute('aria-current');});
          const sentence=document.createElement('span');sentence.className='speech-sentence is-current';sentence.setAttribute('aria-current','true');
          sentence.innerHTML=parts[i].html;answer.appendChild(sentence);scroll();
          await new Promise(next=>{advance=next;timer=setTimeout(()=>{advance=null;next();},duration(parts[i].text,options.locale));});
        }
      }finally{
        // Completion never depends on animationend, word counts or a last-child selector.
        if(!closed)settle(true);
      }
    })();
    return promise;
  }
  function cancel(){if(active)active.cancel();}
  function finish(){if(active)active.finish();}
  // A suspended tab must not return with only half its answer visible.
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)finish();});
  window.addEventListener('pageshow',e=>{if(e.persisted)finish();});
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',e=>{if(e.matches)finish();});
  window.NJSpeech={play,cancel,finish,sentences};
})();
