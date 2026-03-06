(() => {
  const BUNDLED = { "default.csv": "assets/data/default.csv", "default2.csv": "assets/data/default2.csv" };
  const VOWELS = /[αεηιουω]/i;
  const CONSONANTS = /[βγδζθκλμνξπρστφχψ]/i;
  const DIPHTHONGS = new Set(['αι','ει','οι','υι','ου','αυ','ευ','ηυ','ωυ']);
  const LEGAL_ONSETS = new Set(['βλ','βρ','γλ','γν','γρ','δρ','θλ','θρ','κλ','κν','κρ','κτ','μν','πλ','πν','πρ','πτ','σβ','σγ','σθ','σκ','σμ','σπ','στ','σφ','σχ','τρ','φθ','φλ','φρ','χθ','χλ','χρ','στρ','σκρ','σπρ','σπλ']);
  const LEGAL_CODA_CLUSTERS = new Set(['γδ','γμ','γν','γκ','γχ','κτ','κσ','κρ','κλ','κμ','κν','κχ','κφ','κθ','κπ','κβ','κγ','κδ','κζ','μν','μσ','μπ','μφ','μχ','μφθ','μφρ','νδ','νθ','νκ','ντ','νσ','νξ','νχ','νφ','νψ','νζ','νγ','νβ','πρ','πτ','πσ','ρμ','ρν','ρσ','ρτ','ρκ','ρχ','ρθ','ρπ','ρβ','ργ','ρδ','ρζ','ρφ','ρκ','ρξ','ρψ','σθ','σκ','σμ','σπ','στ','σφ','σχ','τμ','τν','τρ','τσ','τθ','τκ','τπ','τφ','τχ','φθ','φρ','χθ','χρ','ψρ']);

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
    phonDiphBars: document.getElementById('phonDiphBars'),
    phonQuantityBars: document.getElementById('phonQuantityBars'),
    phonTable: document.getElementById('phonTable')
  };

  const state = { rows: [], cols: [] };
  const esc = (x) => String(x ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

  function normalizeGreekToken(t) {
    return String(t || '')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/ς/g, 'σ')
      .replace(/[^α-ω]/g, '');
  }

  function isLegalOnset(cluster) {
    if (!cluster) return false;
    if (cluster.length === 1) return CONSONANTS.test(cluster);
    return LEGAL_ONSETS.has(cluster);
  }

  function splitCluster(cluster) {
    if (!cluster) return ['', ''];
    for (let i = 0; i <= cluster.length; i++) {
      const coda = cluster.slice(0, i);
      const onset = cluster.slice(i);
      if (isLegalOnset(onset)) return [coda, onset];
    }
    return [cluster.slice(0, -1), cluster.slice(-1)];
  }

  function syllabify(word) {
    const chars = [...word];
    const out = [];
    let i = 0;
    let carryOnset = '';

    while (i < chars.length) {
      let gathered = '';
      while (i < chars.length && !VOWELS.test(chars[i])) { gathered += chars[i]; i += 1; }
      let onset = carryOnset + gathered;
      carryOnset = '';
      if (i >= chars.length) {
        if (out.length) out[out.length - 1] += onset;
        break;
      }

      let nucleus = chars[i];
      if (i + 1 < chars.length) {
        const pair = (chars[i] + chars[i + 1]).toLowerCase();
        if (DIPHTHONGS.has(pair)) { nucleus = pair; i += 1; }
      }
      i += 1;

      let cluster = '';
      while (i < chars.length && !VOWELS.test(chars[i])) { cluster += chars[i]; i += 1; }
      if (!cluster && i >= chars.length) {
        out.push(onset + nucleus);
        break;
      }
      if (!cluster) {
        out.push(onset + nucleus);
        continue;
      }
      if (i >= chars.length) {
        out.push(onset + nucleus + cluster);
        break;
      }
      const [coda, nextOnset] = splitCluster(cluster);
      out.push(onset + nucleus + coda);
      carryOnset = nextOnset;
    }
    return out.filter(Boolean);
  }

  function splitShape(syl) {
    const chars=[...syl]; let i=0, onset='';
    while (i<chars.length && CONSONANTS.test(chars[i])) { onset += chars[i]; i++; }
    let nucleus='';
    if (i < chars.length) {
      nucleus += chars[i];
      if (i + 1 < chars.length) {
        const pair = (chars[i] + chars[i+1]).toLowerCase();
        if (DIPHTHONGS.has(pair)) { nucleus = pair; i += 1; }
      }
      i += 1;
    }
    const coda = chars.slice(i).join('');
    return { onset, nucleus, coda, shape: `${onset?'C':''}${nucleus?'V':''}${coda?'C':''}` };
  }


  function consonantLength(str) {
    return [...String(str || '')].filter(ch => CONSONANTS.test(ch)).length;
  }

  function toConsonantCluster(str) {
    const clean = [...String(str || '')].filter(ch => CONSONANTS.test(ch)).join('');
    return clean.length >= 2 ? clean : '';
  }

  function isLikelyCodaCluster(cluster) {
    if (!cluster || consonantLength(cluster) < 2) return false;
    if (LEGAL_CODA_CLUSTERS.has(cluster)) return true;
    if (cluster.length === 2 && /[νρλστκπμγδθχφβζξψ]/.test(cluster[0]) && /[σνρλτκπμ]/.test(cluster[1])) return true;
    return false;
  }


  function classifyVowelQuantity(nucleus) {
    const v = String(nucleus || '');
    if (!v) return 'unknown';
    if (DIPHTHONGS.has(v)) return 'long (diphthong)';
    if (v === 'η' || v === 'ω') return 'long';
    if (v === 'ε' || v === 'ο') return 'short';
    if (v === 'αι' || v === 'οι') return 'variable';
    if (v === 'α' || v === 'ι' || v === 'υ') return 'variable';
    return 'unknown';
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
    const phonemes = new Map(), shapes = new Map(), onsets = new Map(), codas = new Map(), diphthongs = new Map(), quantity = new Map();
    const report=[];
    let totalSyl=0;

    for (const r of state.rows) {
      const raw = String(r[col] || '').trim();
      const tok = normalizeGreekToken(raw);
      if (!tok) continue;
      for (const ch of [...tok]) freqMapAdd(phonemes, ch);
      const syls = syllabify(tok);
      totalSyl += syls.length;
      const shapeList=[];
      for (const s of syls) {
        const sp = splitShape(s);
        shapeList.push(sp.shape);
        if (DIPHTHONGS.has(sp.nucleus)) freqMapAdd(diphthongs, sp.nucleus);
        freqMapAdd(quantity, classifyVowelQuantity(sp.nucleus));
        freqMapAdd(shapes, sp.shape);
        const onsetCluster = toConsonantCluster(sp.onset);
        if (onsetCluster && isLegalOnset(onsetCluster)) freqMapAdd(onsets, onsetCluster);
        const codaCluster = toConsonantCluster(sp.coda);
        if (codaCluster && isLikelyCodaCluster(codaCluster)) freqMapAdd(codas, codaCluster);
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
    renderBars(el.phonDiphBars, diphthongs, 12);
    renderBars(el.phonQuantityBars, quantity, 8);

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

  async function fetchBundledCsv(path) {
    const variants = [
      path,
      new URL(path, document.baseURI).toString(),
      path.startsWith('/') ? path : `/${path}`,
      path.startsWith('./') ? path.slice(2) : `./${path}`
    ];
    let lastErr = null;
    for (const candidate of [...new Set(variants)]) {
      try {
        const res = await fetch(candidate, { cache: 'no-store' });
        if (res.ok) return { text: await res.text(), url: candidate };
        lastErr = new Error(`HTTP ${res.status} @ ${candidate}`);
      } catch (err) {
        lastErr = err;
      }
    }
    throw lastErr || new Error(`Could not load bundled csv at ${path}`);
  }

  async function loadBundled(autoRun = false) {
    const path = BUNDLED[el.phonBundledDataset.value];
    if (!path) return;
    try {
      const loaded = await fetchBundledCsv(path);
      parseCsv(loaded.text, loaded.url);
      if (autoRun) setTimeout(() => { if (!el.btnRunPhon.disabled) run(); }, 0);
    } catch (err) {
      el.phonLoadStatus.textContent = `Could not load bundled dataset (${String(err)})`;
    }
  }

  el.phonCsvFile.addEventListener('change',e=>{ const f=e.target.files?.[0]; if(f) f.text().then(t=>parseCsv(t,f.name)); });
  el.btnPhonLoadBundled.addEventListener('click', () => loadBundled(false));
  el.btnRunPhon.addEventListener('click', run);
  loadBundled(true);
})();
