(() => {
  const PRESETS = {
    hex: '– ⏑ ⏑ | – ⏑ ⏑ | – ⏑ ⏑ | – ⏑ ⏑ | – ⏑ ⏑ | – –',
    pent: '– ⏑ ⏑ | – ⏑ ⏑ | – || – ⏑ ⏑ | – ⏑ ⏑ | –',
    iamb: '⏑ – | ⏑ – | ⏑ –'
  };

  const el = {
    prosodyPreset: document.getElementById('prosodyPreset'),
    btnApplyPreset: document.getElementById('btnApplyPreset'),
    btnProsodyExport: document.getElementById('btnProsodyExport'),
    prosodyInput: document.getElementById('prosodyInput'),
    prosodyTemplate: document.getElementById('prosodyTemplate'),
    btnRunProsody: document.getElementById('btnRunProsody'),
    btnProsodySample: document.getElementById('btnProsodySample'),
    prosodySummary: document.getElementById('prosodySummary'),
    prosodyAlignment: document.getElementById('prosodyAlignment'),
    prosodyBars: document.getElementById('prosodyBars'),
    prosodyDiagnostics: document.getElementById('prosodyDiagnostics')
  };

  const state = { rows: [] };
  const vowels = /[αεηιουωάέήίόύώϊΐΰϋaeiou]/i;

  const norm = (s) => String(s || '').trim();
  const esc = (x) => String(x ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

  function syllabifyWord(word) {
    const chars = [...word]; const out = []; let cur = '';
    for (let i=0;i<chars.length;i++) {
      cur += chars[i];
      if (vowels.test(chars[i])) {
        const n1=chars[i+1]||'', n2=chars[i+2]||'';
        if (!n1 || vowels.test(n1)) { out.push(cur); cur=''; }
        else if (n2 && vowels.test(n2)) { out.push(cur+n1); cur=''; i+=1; }
      }
    }
    if (cur) out.push(cur);
    return out.filter(Boolean);
  }

  function scanSyllable(syl) {
    const s = syl.toLowerCase();
    if (/[ηω]/.test(s)) return '–';
    if (/(αι|ει|οι|υι|ου|αυ|ευ|ηυ|ωυ)/.test(s)) return '–';
    return '⏑';
  }

  function caesuraIndex(words) {
    if (words.length < 4) return -1;
    return Math.floor(words.length / 2);
  }

  function analyzeLine(line) {
    const words = line.split(/\s+/).filter(Boolean);
    const syllables = words.flatMap(syllabifyWord);
    const pattern = syllables.map(scanSyllable);
    const ci = caesuraIndex(words);
    const withCaesura = words.map((w, i) => i === ci ? `${w} ‖` : w).join(' ');
    return { line, words, syllables, pattern, caesuraAt: ci, caesuraText: withCaesura };
  }

  function parseTemplate(templateText) {
    const raw = templateText.replace(/[^–⏑xX|]/g, '');
    return raw ? raw.split('') : [];
  }

  function comparePattern(pattern, template) {
    if (!template.length) return { score: null, mismatches: [] };
    const n = Math.max(pattern.length, template.length);
    let match = 0; const mismatches = [];
    for (let i=0;i<n;i++) {
      const a = pattern[i] || '∅'; const b = template[i] || '∅';
      const ok = (b==='x'||b==='X'||b==='|') ? true : a===b;
      if (ok) match += 1; else mismatches.push(`${i+1}:${a}≠${b}`);
    }
    return { score: Math.round((match / n) * 100), mismatches };
  }

  function renderSummary(results, totalSyl) {
    const caesuraCoverage = results.length ? Math.round((results.filter(r=>r.caesuraAt>=0).length/results.length)*100) : 0;
    el.prosodySummary.innerHTML = `<div class="analysis-grid">
      <div class="analysis-card"><span class="label">Verses</span><div class="value">${results.length}</div></div>
      <div class="analysis-card"><span class="label">Total syllables</span><div class="value">${totalSyl}</div></div>
      <div class="analysis-card"><span class="label">Avg syllables/verse</span><div class="value">${results.length ? (totalSyl/results.length).toFixed(1) : '0.0'}</div></div>
      <div class="analysis-card"><span class="label">Caesura detected</span><div class="value">${caesuraCoverage}%</div></div>
    </div>`;
  }

  function renderAlignment(results, template) {
    let html = '<table class="mini-table"><thead><tr><th>#</th><th>Text</th><th>Scansion</th><th>Caesura view</th><th>Match</th></tr></thead><tbody>';
    results.forEach((r, i) => {
      const cmp = comparePattern(r.pattern, template);
      html += `<tr><td>${i+1}</td><td>${esc(r.line)}</td><td>${esc(r.pattern.join(' '))}</td><td>${esc(r.caesuraText)}</td><td>${cmp.score == null ? '—' : `${cmp.score}%`}</td></tr>`;
    });
    html += '</tbody></table>';
    el.prosodyAlignment.innerHTML = html;
  }

  function renderBars(results) {
    const max = Math.max(...results.map(r => r.syllables.length), 1);
    let html = '';
    results.forEach((r, i) => {
      const w = Math.max(3, Math.round((r.syllables.length/max)*100));
      html += `<div class="viz-item"><div class="viz-row"><span class="viz-label">Verse ${i+1}</span><div class="viz-bar" style="width:${w}%"></div><span class="viz-value">${r.syllables.length}</span></div></div>`;
    });
    el.prosodyBars.innerHTML = html;
  }

  function renderDiagnostics(results, template) {
    let html = '<table class="mini-table"><thead><tr><th>Verse</th><th>Match</th><th>Mismatches</th><th>Caesura index</th></tr></thead><tbody>';
    results.forEach((r, i) => {
      const cmp = comparePattern(r.pattern, template);
      html += `<tr><td>${i+1}</td><td>${cmp.score == null ? '—' : `${cmp.score}%`}</td><td>${esc(cmp.mismatches.slice(0,7).join(', ') || 'none')}</td><td>${r.caesuraAt >= 0 ? r.caesuraAt + 1 : '—'}</td></tr>`;
    });
    html += '</tbody></table>';
    el.prosodyDiagnostics.innerHTML = html;
  }

  function setupZoom() {
    const targets = [el.prosodySummary, ...document.querySelectorAll('.viz-wrap')].filter(Boolean);
    for (const c of targets) {
      if (c.querySelector(':scope > .zoom-btn')) continue;
      c.classList.add('zoomable');
      const b = document.createElement('button'); b.type='button'; b.className='zoom-btn'; b.textContent='⤢ Full view';
      b.addEventListener('click', ()=>openZoom(c)); c.prepend(b);
    }
  }

  function openZoom(container) {
    let modal = document.getElementById('zoomModal');
    if (!modal) {
      modal = document.createElement('div'); modal.id='zoomModal'; modal.className='zoom-modal';
      modal.innerHTML = `<div class="zoom-backdrop"></div><div class="zoom-dialog"><div class="zoom-head"><strong>Expanded view</strong><button type="button" class="btn btn-warn zoom-close">Close</button></div><div class="zoom-body"></div></div>`;
      document.body.appendChild(modal);
      modal.querySelector('.zoom-backdrop').addEventListener('click', ()=>modal.classList.remove('open'));
      modal.querySelector('.zoom-close').addEventListener('click', ()=>modal.classList.remove('open'));
    }
    const body = modal.querySelector('.zoom-body'); body.innerHTML='';
    const clone = container.cloneNode(true); clone.querySelector('.zoom-btn')?.remove(); body.appendChild(clone);
    modal.classList.add('open');
  }

  function exportCsv() {
    if (!state.rows.length) return;
    const head = ['verse','text','scansion','syllables','caesura_index','match_score'];
    const lines = [head.join(',')];
    for (const r of state.rows) {
      lines.push([r.verse, r.text, r.scansion, r.syllables, r.caesura, r.match].map(v => `"${String(v??'').replace(/"/g,'""')}"`).join(','));
    }
    const blob = new Blob([lines.join('\n')], { type:'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = 'prosody_scansion_report.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  function run() {
    const lines = norm(el.prosodyInput.value).split(/\r?\n/).map(norm).filter(Boolean);
    const template = parseTemplate(norm(el.prosodyTemplate.value));
    const results = lines.map(analyzeLine);
    const totalSyl = results.reduce((a,r)=>a+r.syllables.length,0);

    renderSummary(results,totalSyl);
    renderAlignment(results,template);
    renderBars(results);
    renderDiagnostics(results,template);

    state.rows = results.map((r,i)=> {
      const cmp = comparePattern(r.pattern, template);
      return { verse: i+1, text: r.line, scansion: r.pattern.join(' '), syllables: r.syllables.length, caesura: r.caesuraAt >= 0 ? r.caesuraAt + 1 : '', match: cmp.score ?? '' };
    });

    setupZoom();
  }

  el.btnApplyPreset.addEventListener('click', () => { const v = el.prosodyPreset.value; if (v && PRESETS[v]) el.prosodyTemplate.value = PRESETS[v]; run(); });
  el.btnRunProsody.addEventListener('click', run);
  el.btnProsodySample.addEventListener('click', () => {
    el.prosodyInput.value = `μῆνιν ἄειδε θεὰ Πηληϊάδεω Ἀχιλῆος\nοὐλομένην, ἣ μυρί᾽ Ἀχαιοῖς ἄλγε᾽ ἔθηκε`;
    el.prosodyTemplate.value = PRESETS.hex;
    run();
  });
  el.btnProsodyExport.addEventListener('click', exportCsv);
  run();
})();
