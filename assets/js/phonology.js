(() => {
  const BUNDLED = { "default.csv": "assets/data/default.csv", "default2.csv": "assets/data/default2.csv" };
  const VOWELS = /[αεηιουωάέήίόύώϊΐΰϋ]/i;
  const CONSONANTS = /[βγδζθκλμνξπρστφχψ]/i;

  const el = {
    phonCsvFile: document.getElementById('phonCsvFile'),
    phonBundledDataset: document.getElementById('phonBundledDataset'),
    btnPhonLoadBundled: document.getElementById('btnPhonLoadBundled'),
    phonTokenCol: document.getElementById('phonTokenCol'),
    btnRunPhon: document.getElementById('btnRunPhon'),
    phonLoadStatus: document.getElementById('phonLoadStatus'),
    phonSummary: document.getElementById('phonSummary'),
    phonPhonemeBars: document.getElementById('phonPhonemeBars'),
    phonShapeBars: document.getElementById('phonShapeBars'),
    phonOnsetBars: document.getElementById('phonOnsetBars'),
    phonCodaBars: document.getElementById('phonCodaBars'),
    phonTable: document.getElementById('phonTable')
  };

  const state = { rows: [], cols: [] };
  const esc = (x) => String(x ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

  function cleanToken(t) {
    return String(t||'').toLowerCase().replace(/[^α-ωάέήίόύώϊΐΰϋ]/g,'').replace(/ς/g,'σ');
  }

  function syllabify(word) {
    const chars=[...word]; const out=[]; let cur='';
    for (let i=0;i<chars.length;i++) {
      cur += chars[i];
      if (VOWELS.test(chars[i])) {
        const n1 = chars[i+1]||'', n2 = chars[i+2]||'';
        if (!n1) { out.push(cur); cur=''; }
        else if (VOWELS.test(n1)) { out.push(cur); cur=''; }
        else if (n2 && VOWELS.test(n2)) { out.push(cur+n1); cur=''; i += 1; }
      }
    }
    if (cur) out.push(cur);
    return out.filter(Boolean);
  }

  function splitShape(syl) {
    const chars=[...syl]; let i=0, onset='';
    while (i<chars.length && CONSONANTS.test(chars[i])) { onset += chars[i]; i++; }
    let nucleus='';
    while (i<chars.length && VOWELS.test(chars[i])) { nucleus += chars[i]; i++; }
    const coda = chars.slice(i).join('');
    return { onset, nucleus, coda, shape: `${onset?'C':''}${nucleus?'V':''}${coda?'C':''}` };
  }

  function parseCsv(text, name='uploaded.csv') {
    el.phonLoadStatus.textContent = `Loading ${name}...`;
    Papa.parse(text, { header:true, skipEmptyLines:true, complete: (res) => {
      state.rows = res.data || [];
      state.cols = res.meta?.fields || (state.rows[0] ? Object.keys(state.rows[0]) : []);
      el.phonTokenCol.innerHTML = '';
      for (const c of state.cols) {
        const o = document.createElement('option'); o.value = c; o.textContent = c; el.phonTokenCol.appendChild(o);
      }
      const g = state.cols.find(c=>c.toLowerCase()==='form') || state.cols.find(c=>c.toLowerCase()==='lemma') || state.cols[0] || '';
      if (g) el.phonTokenCol.value = g;
      el.phonTokenCol.disabled = !state.cols.length;
      el.btnRunPhon.disabled = !state.rows.length;
      el.phonLoadStatus.textContent = `Loaded ${name} (${state.rows.length} rows).`;
    }});
  }

  function freqMapAdd(map,k){ if(!k) return; map.set(k,(map.get(k)||0)+1); }

  function renderBars(target, map, top=20) {
    const entries=[...map.entries()].sort((a,b)=>b[1]-a[1]).slice(0,top);
    const max=Math.max(...entries.map(x=>x[1]),1);
    let html='';
    for (const [k,v] of entries) {
      const w=Math.max(3,Math.round((v/max)*100));
      html += `<div class="viz-item"><div class="viz-row"><span class="viz-label">${esc(k)}</span><div class="viz-bar" style="width:${w}%"></div><span class="viz-value">${v}</span></div></div>`;
    }
    target.innerHTML = html || '<div class="small-muted">No data.</div>';
  }

  function run() {
    const col = el.phonTokenCol.value;
    if (!col) return;
    const phonemes = new Map(), shapes = new Map(), onsets = new Map(), codas = new Map();
    const report=[];
    let totalSyl=0;

    for (const r of state.rows) {
      const raw = String(r[col] || '').trim();
      const tok = cleanToken(raw);
      if (!tok) continue;
      for (const ch of [...tok]) freqMapAdd(phonemes, ch);
      const syls = syllabify(tok);
      totalSyl += syls.length;
      const shapeList=[];
      for (const s of syls) {
        const sp = splitShape(s);
        shapeList.push(sp.shape);
        freqMapAdd(shapes, sp.shape);
        if (sp.onset) freqMapAdd(onsets, sp.onset);
        if (sp.coda) freqMapAdd(codas, sp.coda);
      }
      report.push({ token: raw, cleaned: tok, syllables: syls.join(' · '), shapes: shapeList.join(' ') });
    }

    el.phonSummary.innerHTML = `<div class="analysis-grid">
      <div class="analysis-card"><span class="label">Tokens analyzed</span><div class="value">${report.length}</div></div>
      <div class="analysis-card"><span class="label">Syllables</span><div class="value">${totalSyl}</div></div>
      <div class="analysis-card"><span class="label">Avg syllables/token</span><div class="value">${report.length ? (totalSyl/report.length).toFixed(2) : '0.00'}</div></div>
      <div class="analysis-card"><span class="label">Distinct phonemes</span><div class="value">${phonemes.size}</div></div>
    </div>`;

    renderBars(el.phonPhonemeBars, phonemes, 24);
    renderBars(el.phonShapeBars, shapes, 12);
    renderBars(el.phonOnsetBars, onsets, 20);
    renderBars(el.phonCodaBars, codas, 20);

    let html='<table class="mini-table"><thead><tr><th>Token</th><th>Normalized</th><th>Syllables</th><th>Shapes</th></tr></thead><tbody>';
    for (const row of report.slice(0,300)) html += `<tr><td>${esc(row.token)}</td><td>${esc(row.cleaned)}</td><td>${esc(row.syllables)}</td><td>${esc(row.shapes)}</td></tr>`;
    html += '</tbody></table>';
    el.phonTable.innerHTML = html;

    setupZoom();
  }

  function setupZoom() {
    const targets=[el.phonSummary, ...document.querySelectorAll('.viz-wrap')].filter(Boolean);
    for (const c of targets) {
      if (c.querySelector(':scope > .zoom-btn')) continue;
      c.classList.add('zoomable');
      const b=document.createElement('button'); b.type='button'; b.className='zoom-btn'; b.textContent='⤢ Full view';
      b.addEventListener('click',()=>openZoom(c)); c.prepend(b);
    }
  }
  function openZoom(container){
    let modal=document.getElementById('zoomModal');
    if(!modal){
      modal=document.createElement('div'); modal.id='zoomModal'; modal.className='zoom-modal';
      modal.innerHTML=`<div class="zoom-backdrop"></div><div class="zoom-dialog"><div class="zoom-head"><strong>Expanded view</strong><button type="button" class="btn btn-warn zoom-close">Close</button></div><div class="zoom-body"></div></div>`;
      document.body.appendChild(modal);
      modal.querySelector('.zoom-backdrop').addEventListener('click',()=>modal.classList.remove('open'));
      modal.querySelector('.zoom-close').addEventListener('click',()=>modal.classList.remove('open'));
    }
    const body=modal.querySelector('.zoom-body'); body.innerHTML='';
    const clone=container.cloneNode(true); clone.querySelector('.zoom-btn')?.remove(); body.appendChild(clone);
    modal.classList.add('open');
  }

  async function loadBundled() {
    const path = BUNDLED[el.phonBundledDataset.value];
    if (!path) return;
    const url = new URL(path, document.baseURI).toString();
    try { const res = await fetch(url,{cache:'no-store'}); if(!res.ok) throw new Error(`HTTP ${res.status}`); parseCsv(await res.text(), path); }
    catch (err) { el.phonLoadStatus.textContent = `Could not load bundled dataset (${String(err)})`; }
  }

  el.phonCsvFile.addEventListener('change',e=>{ const f=e.target.files?.[0]; if(f) f.text().then(t=>parseCsv(t,f.name)); });
  el.btnPhonLoadBundled.addEventListener('click', loadBundled);
  el.btnRunPhon.addEventListener('click', run);
})();
