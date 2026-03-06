(() => {
  const HEX_TEMPLATE = '– ⏑ ⏑ | – ⏑ ⏑ | – ⏑ ⏑ | – ⏑ ⏑ | – ⏑ ⏑ | – –';
  const PRESETS = { hex: HEX_TEMPLATE };
  const VOWEL = /[αεηιουω]/i;
  const LONG_VOWELS = /[ηω]/i;
  const DIPHTHONGS = new Set(['αι','ει','οι','υι','ου','αυ','ευ','ηυ','ωυ']);
  const MUTE = /[πβφκγχτδθ]/i;
  const LIQUID = /[λρμν]/i;
  const LEGAL_ONSETS = new Set(['βλ','βρ','γλ','γν','γρ','δρ','θλ','θρ','κλ','κν','κρ','κτ','μν','πλ','πν','πρ','πτ','σβ','σγ','σθ','σκ','σμ','σπ','στ','σφ','σχ','τρ','φθ','φλ','φρ','χθ','χλ','χρ','στρ','σκρ','σπρ','σπλ']);

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
  const norm = (s) => String(s || '').trim();
  const esc = (x) => String(x ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

  function normalizeGreek(text) {
    return String(text || '')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/ς/g,'σ')
      .replace(/[.,;·!?"“”‘’]/g,'')
      .replace(/[^α-ω'᾽\s]/g,'');
  }

  function applyElision(rawWords) {
    const words = rawWords.slice();
    let elisions = 0;
    for (let i = 0; i < words.length - 1; i++) {
      const w = words[i];
      if (/^[αεηιουω]/.test(words[i + 1]) && (/['᾽]$/.test(w) || /[αεο]$/.test(w))) {
        words[i] = w.replace(/['᾽]$/,'').replace(/[αεο]$/,'');
        elisions += 1;
      }
    }
    return { words, elisions };
  }

  function isLegalOnset(cluster) {
    if (!cluster) return false;
    if (cluster.length === 1) return /[βγδζθκλμνξπρστφχψ]/.test(cluster);
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

  function syllabifyWord(word) {
    const chars = [...word];
    const out = [];
    let i = 0;
    let carryOnset = '';

    while (i < chars.length) {
      let gathered = '';
      while (i < chars.length && !VOWEL.test(chars[i])) { gathered += chars[i]; i += 1; }
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
      while (i < chars.length && !VOWEL.test(chars[i])) { cluster += chars[i]; i += 1; }

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

  function quantityByNature(syl) {
    const core = syl.replace(/[^α-ωάέήίόύώϊΐΰϋ]/g,'');
    if (LONG_VOWELS.test(core)) return '–';
    if ([...DIPHTHONGS].some(d => core.includes(d))) return '–';
    return '⏑';
  }

  function quantityByPosition(syl, nextSyl) {
    const coda = (syl.match(/[βγδζθκλμνξπρστυφχψ]+$/i) || [''])[0];
    const onset = (String(nextSyl || '').match(/^[βγδζθκλμνξπρστυφχψ]+/i) || [''])[0];
    const cc = coda + onset;
    if (cc.length >= 2) {
      const first = cc[0], second = cc[1];
      const muteLiquid = MUTE.test(first) && LIQUID.test(second);
      if (!muteLiquid) return '–';
    }
    return null;
  }

  function caesuraIndex(words) { return words.length < 4 ? -1 : Math.floor(words.length / 2); }

  function scanLine(line) {
    const rawWords = normalizeGreek(line).split(/\s+/).filter(Boolean);
    const { words, elisions } = applyElision(rawWords);
    const syllables = words.flatMap(syllabifyWord);

    const pattern = [];
    let correption = 0, resonantLengthening = 0;
    for (let i = 0; i < syllables.length; i++) {
      const s = syllables[i], n = syllables[i+1] || '';
      let q = quantityByNature(s);
      const byPos = quantityByPosition(s, n);
      if (byPos === '–') {
        const end = (s.match(/[βγδζθκλμνξπρστυφχψ]+$/i) || [''])[0];
        if (/[μνρλ]$/.test(end)) resonantLengthening += 1;
        q = '–';
      }
      // epic correption heuristic: long by nature before vowel may scan short
      if (q === '–' && /^[αεηιουωάέήίόύώϊΐΰϋ]/i.test(n)) { q = '⏑'; correption += 1; }
      pattern.push(q);
    }

    const ci = caesuraIndex(words);
    const caesuraText = words.map((w, i) => i === ci ? `${w} ‖` : w).join(' ');
    return { line, words, syllables, pattern, caesuraAt: ci, caesuraText, elisions, correption, resonantLengthening };
  }

  function parseTemplate() {
    const text = norm(el.prosodyTemplate.value) || HEX_TEMPLATE;
    const raw = text.replace(/[^–⏑xX|]/g, '');
    return raw.split('');
  }

  function comparePattern(pattern, template) {
    const n = Math.max(pattern.length, template.length);
    let match = 0; const mismatches = [];
    for (let i = 0; i < n; i++) {
      const a = pattern[i] || '∅', b = template[i] || '∅';
      const ok = b === '|' || b === 'x' || b === 'X' || a === b;
      if (ok) match += 1; else mismatches.push(`${i+1}:${a}≠${b}`);
    }
    return { score: Math.round((match / Math.max(n,1)) * 100), mismatches };
  }

  function renderSummary(results, totalSyl) {
    const avgMatch = results.length ? (results.reduce((a,r)=>a+r.matchScore,0)/results.length).toFixed(1) : '0.0';
    el.prosodySummary.innerHTML = `<div class="analysis-grid">
      <div class="analysis-card"><span class="label">Verses</span><div class="value">${results.length}</div></div>
      <div class="analysis-card"><span class="label">Total syllables</span><div class="value">${totalSyl}</div></div>
      <div class="analysis-card"><span class="label">Avg match vs hexameter</span><div class="value">${avgMatch}%</div></div>
      <div class="analysis-card"><span class="label">Elisions detected</span><div class="value">${results.reduce((a,r)=>a+r.elisions,0)}</div></div>
    </div>`;
  }

  function renderAlignment(results) {
    let html = '<table class="mini-table"><thead><tr><th>#</th><th>Text</th><th>Scansion</th><th>Caesura</th><th>Match</th></tr></thead><tbody>';
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      html += `<tr><td>${i+1}</td><td>${esc(r.line)}</td><td>${esc(r.pattern.join(' '))}</td><td>${esc(r.caesuraText)}</td><td>${r.matchScore}%</td></tr>`;
    }
    html += '</tbody></table>';
    el.prosodyAlignment.innerHTML = html;
  }

  function renderBars(results) {
    const max = Math.max(...results.map(r => r.syllables.length), 1);
    let html = '';
    results.forEach((r, i) => {
      const w = Math.max(3, Math.round((r.syllables.length / max) * 100));
      html += `<div class="viz-item"><div class="viz-row"><span class="viz-label">Verse ${i+1}</span><div class="viz-bar" style="width:${w}%"></div><span class="viz-value">${r.syllables.length}</span></div></div>`;
    });
    el.prosodyBars.innerHTML = html;
  }

  function renderDiagnostics(results) {
    let html = '<table class="mini-table"><thead><tr><th>Verse</th><th>Mismatch</th><th>Elision</th><th>Epic correption</th><th>Resonant length.</th></tr></thead><tbody>';
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      html += `<tr><td>${i+1}</td><td>${esc(r.mismatches.slice(0,8).join(', ') || 'none')}</td><td>${r.elisions}</td><td>${r.correption}</td><td>${r.resonantLengthening}</td></tr>`;
    }
    html += '</tbody></table>';
    el.prosodyDiagnostics.innerHTML = html;
  }

  function exportCsv() {
    if (!state.rows.length) return;
    const head = ['verse','text','scansion','syllables','match_score','elisions','epic_correption','resonant_lengthening'];
    const lines = [head.join(',')];
    for (const r of state.rows) lines.push([r.verse,r.text,r.scansion,r.syllables,r.matchScore,r.elisions,r.correption,r.resonantLengthening].map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(','));
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = 'prosody_hexameter_report.csv';
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
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

  function run() {
    const lines = norm(el.prosodyInput.value).split(/\r?\n/).map(norm).filter(Boolean);
    const template = parseTemplate();
    const scanned = lines.map(scanLine).map((r, idx) => {
      const cmp = comparePattern(r.pattern, template);
      return { verse: idx + 1, text: r.line, scansion: r.pattern.join(' '), syllables: r.syllables.length, matchScore: cmp.score, mismatches: cmp.mismatches, ...r };
    });
    const totalSyl = scanned.reduce((a,r)=>a+r.syllables.length,0);
    state.rows = scanned;
    renderSummary(scanned, totalSyl);
    renderAlignment(scanned);
    renderBars(scanned);
    renderDiagnostics(scanned);
    setupZoom();
  }

  el.btnApplyPreset.addEventListener('click', () => { el.prosodyTemplate.value = PRESETS.hex; run(); });
  el.btnRunProsody.addEventListener('click', run);
  el.btnProsodySample.addEventListener('click', () => { el.prosodyTemplate.value = PRESETS.hex; run(); });
  el.btnProsodyExport.addEventListener('click', exportCsv);
  el.prosodyTemplate.value = PRESETS.hex;
  run();
})();
