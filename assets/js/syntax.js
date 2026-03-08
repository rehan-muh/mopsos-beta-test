(() => {
  const el = {
    syntaxInput: document.getElementById('syntaxInput'),
    syntaxSentenceSelect: document.getElementById('syntaxSentenceSelect'),
    syntaxRelFilter: document.getElementById('syntaxRelFilter'),
    syntaxPosFilter: document.getElementById('syntaxPosFilter'),
    syntaxUseDistance: document.getElementById('syntaxUseDistance'),
    btnBuildSyntax: document.getElementById('btnBuildSyntax'),
    btnSyntaxSample: document.getElementById('btnSyntaxSample'),
    btnSyntaxExport: document.getElementById('btnSyntaxExport'),
    syntaxSummary: document.getElementById('syntaxSummary'),
    syntaxDepSvg: document.getElementById('syntaxDepSvg'),
    syntaxPhrase: document.getElementById('syntaxPhrase'),
    syntaxRelationBars: document.getElementById('syntaxRelationBars'),
    syntaxHits: document.getElementById('syntaxHits'),
    syntaxTable: document.getElementById('syntaxTable'),
    syntaxDistanceProfile: document.getElementById('syntaxDistanceProfile')
  };

  const state = { sentences: [], reportRows: [] };
  const sample = el.syntaxInput.value;

  function esc(x) { return String(x ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  function parseInput(text) {
    const blocks = String(text || '').trim().split(/\n\s*\n/).filter(Boolean);
    return blocks.map((b, bi) => {
      const rows = b.split(/\r?\n/).map(line => {
        const p = line.trim().split('\t');
        const totalDistance = Number.parseInt(p[6], 10);
        return {
          sid: bi + 1,
          id: Number.parseInt(p[0], 10),
          form: p[1],
          lemma: p[2],
          pos: p[3],
          head: Number.parseInt(p[4], 10),
          deprel: p[5],
          total_distance: Number.isFinite(totalDistance) ? totalDistance : null
        };
      }).filter(r => Number.isFinite(r.id));

      if (el.syntaxUseDistance?.checked) {
        const byId = new Map(rows.map(r => [r.id, r]));
        for (const r of rows) {
          if (Number.isFinite(r.total_distance) && r.total_distance !== 0) {
            const inferredHead = r.id + r.total_distance;
            if (byId.has(inferredHead)) r.head = inferredHead;
          }
          if (!Number.isFinite(r.head)) r.head = 0;
        }
      }
      return rows;
    }).filter(x => x.length);
  }

  function populateSentenceSelect(sentences) {
    const cur = el.syntaxSentenceSelect.value;
    el.syntaxSentenceSelect.innerHTML = '';
    sentences.forEach((s, i) => {
      const o = document.createElement('option');
      o.value = String(i);
      o.textContent = `Sentence ${i + 1} (${s.length} tokens)`;
      el.syntaxSentenceSelect.appendChild(o);
    });
    if (cur && sentences[cur]) el.syntaxSentenceSelect.value = cur;
  }

  function filteredRows(rows) {
    const rel = el.syntaxRelFilter.value.trim().toLowerCase();
    const pos = el.syntaxPosFilter.value.trim().toLowerCase();
    return rows.filter(r => (!rel || String(r.deprel).toLowerCase().includes(rel)) && (!pos || String(r.pos).toLowerCase().includes(pos)));
  }

  function renderSummary(sentences) {
    const all = sentences.flat();
    const roots = all.filter(x => x.head === 0).length;
    const depTypes = new Set(all.map(x => x.deprel)).size;
    el.syntaxSummary.innerHTML = `<div class="analysis-grid">
      <div class="analysis-card"><span class="label">Sentences</span><div class="value">${sentences.length}</div></div>
      <div class="analysis-card"><span class="label">Tokens</span><div class="value">${all.length}</div></div>
      <div class="analysis-card"><span class="label">Roots</span><div class="value">${roots}</div></div>
      <div class="analysis-card"><span class="label">Relation types</span><div class="value">${depTypes}</div></div>
    </div>`;
  }

  function renderDepTree(rows) {
    const w = 1100, y = 390, step = Math.max(65, Math.floor((w - 120) / Math.max(rows.length, 1)));
    const x = new Map(rows.map((r, i) => [r.id, 60 + i * step]));
    let html = `<rect x="0" y="0" width="${w}" height="460" fill="#f8fafc" rx="12"/>`;
    for (const r of rows) {
      const tx = x.get(r.id), hx = x.get(r.head);
      if (!tx) continue;
      if (!hx || r.head === 0) {
        html += `<line x1="${tx}" y1="70" x2="${tx}" y2="${y-30}" stroke="#64748b" stroke-dasharray="4 4"/>`;
      } else {
        const mid = (tx + hx) / 2, h = Math.min(280, 50 + Math.abs(tx-hx) * .34);
        html += `<path d="M ${hx} ${y-30} Q ${mid} ${y-h} ${tx} ${y-30}" fill="none" stroke="#4f46e5" stroke-width="2"/>`;
        html += `<text x="${mid-20}" y="${y-h-6}" font-size="11" fill="#1e293b">${esc(r.deprel)}</text>`;
      }
    }
    for (const r of rows) {
      const cx = x.get(r.id);
      html += `<circle cx="${cx}" cy="${y-30}" r="17" fill="#0891b2"/>`;
      html += `<text x="${cx}" y="${y-25}" text-anchor="middle" font-size="11" fill="#fff">${r.id}</text>`;
      html += `<text x="${cx}" y="${y+2}" text-anchor="middle" font-size="14" fill="#0f172a">${esc(r.form)}</text>`;
      html += `<text x="${cx}" y="${y+20}" text-anchor="middle" font-size="11" fill="#64748b">${esc(r.pos)}</text>`;
    }
    el.syntaxDepSvg.innerHTML = html;
  }

  function renderPhrase(rows) {
    const child = new Map();
    for (const r of rows) { if (!child.has(r.head)) child.set(r.head, []); child.get(r.head).push(r); }
    for (const v of child.values()) v.sort((a,b)=>a.id-b.id);
    const root = rows.find(r => r.head === 0) || rows[0];
    function walk(n, d=1) {
      const pad = '  '.repeat(d);
      const kids = child.get(n.id) || [];
      if (!kids.length) return `${pad}(${n.pos}:${n.form})`;
      return `${pad}(${n.pos}:${n.form}\n${kids.map(k => walk(k, d+1)).join('\n')}\n${pad})`;
    }
    el.syntaxPhrase.textContent = `(S\n${walk(root)}\n)`;
  }

  function renderRelationBars(sentences) {
    const freq = new Map();
    for (const r of sentences.flat()) freq.set(r.deprel, (freq.get(r.deprel) || 0) + 1);
    const entries = [...freq.entries()].sort((a,b)=>b[1]-a[1]).slice(0, 16);
    const max = Math.max(...entries.map(x=>x[1]),1);
    let html = '';
    for (const [rel, n] of entries) {
      const w = Math.max(3, Math.round((n/max)*100));
      html += `<div class="viz-item"><div class="viz-row"><span class="viz-label">${esc(rel)}</span><div class="viz-bar" style="width:${w}%"></div><span class="viz-value">${n}</span></div></div>`;
    }
    el.syntaxRelationBars.innerHTML = html;
  }

  function renderHits(rows) {
    const verbObjs = rows.filter(r => r.deprel === 'obj');
    const nsubj = rows.filter(r => String(r.deprel).includes('subj'));
    let html = `<table class="mini-table"><thead><tr><th>Construction</th><th>Count</th><th>Examples</th></tr></thead><tbody>`;
    const items = [
      ['Objects', verbObjs, verbObjs.map(r => r.form)],
      ['Subjects', nsubj, nsubj.map(r => r.form)],
      ['Finite verbs', rows.filter(r => /VERB|AUX/.test(r.pos)), rows.filter(r => /VERB|AUX/.test(r.pos)).map(r=>r.form)]
    ];
    for (const [name, arr, ex] of items) html += `<tr><td>${name}</td><td>${arr.length}</td><td>${esc(ex.slice(0,6).join(', '))}</td></tr>`;
    html += `</tbody></table>`;
    el.syntaxHits.innerHTML = html;
  }

  function renderDistanceProfile(sentences) {
    if (!el.syntaxDistanceProfile) return;
    const all = sentences.flat();
    const bucketCount = new Map();
    const categoryCount = new Map();
    for (const r of all) {
      const dist = Number.isFinite(r.total_distance) ? r.total_distance : (Number.isFinite(r.head) ? r.head - r.id : 0);
      const dir = dist < 0 ? 'left dependency' : (dist > 0 ? 'right dependency' : 'root/self');
      const bucket = `${dir} (${dist})`;
      bucketCount.set(bucket, (bucketCount.get(bucket) || 0) + 1);
      const cat = `${r.pos || 'UNK'} + ${r.deprel || 'dep'}`;
      const key = `${bucket}||${cat}`;
      categoryCount.set(key, (categoryCount.get(key) || 0) + 1);
    }

    let html = '<table class="mini-table"><thead><tr><th>Distance bucket</th><th>Count</th><th>Top grammatical categories</th></tr></thead><tbody>';
    for (const [bucket, count] of [...bucketCount.entries()].sort((a,b)=>b[1]-a[1])) {
      const cats = [...categoryCount.entries()].filter(([k])=>k.startsWith(`${bucket}||`)).map(([k,v])=>[k.split('||')[1], v]).sort((a,b)=>b[1]-a[1]).slice(0,4);
      html += `<tr><td>${esc(bucket)}</td><td>${count}</td><td>${cats.map(([k,v])=>`${esc(k)} (${v})`).join(', ') || '—'}</td></tr>`;
    }
    html += '</tbody></table>';
    el.syntaxDistanceProfile.innerHTML = html;
  }

  function renderTable(rows) {
    let html = '<table class="mini-table"><thead><tr><th>ID</th><th>Form</th><th>Lemma</th><th>POS</th><th>Head</th><th>Deprel</th></tr></thead><tbody>';
    for (const r of rows) html += `<tr><td>${r.id}</td><td>${esc(r.form)}</td><td>${esc(r.lemma)}</td><td>${esc(r.pos)}</td><td>${r.head}</td><td>${esc(r.deprel)}</td></tr>`;
    html += '</tbody></table>';
    el.syntaxTable.innerHTML = html;
  }

  function toCsv(rows) {
    const cols = ['sentence','id','form','lemma','pos','head','deprel'];
    return [cols.join(','), ...rows.map(r => [r.sentence,r.id,r.form,r.lemma,r.pos,r.head,r.deprel].map(v => `"${String(v??'').replace(/"/g,'""')}"`).join(','))].join('\n');
  }

  function exportReport() {
    if (!state.reportRows.length) return;
    const blob = new Blob([toCsv(state.reportRows)], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'syntax_report.csv';
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  function setupZoom() {
    const targets = [el.syntaxSummary, ...document.querySelectorAll('.viz-wrap')].filter(Boolean);
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
    state.sentences = parseInput(el.syntaxInput.value);
    if (!state.sentences.length) return;
    populateSentenceSelect(state.sentences);
    const si = Math.min(+el.syntaxSentenceSelect.value || 0, state.sentences.length - 1);
    const selected = filteredRows(state.sentences[si]);

    renderSummary(state.sentences);
    renderDepTree(selected);
    renderPhrase(selected);
    renderRelationBars(state.sentences);
    renderHits(selected);
    renderDistanceProfile(state.sentences);
    renderTable(selected);

    state.reportRows = state.sentences.flatMap((s, idx) => s.map(r => ({ sentence: idx + 1, ...r })));
    setupZoom();
  }

  el.btnBuildSyntax.addEventListener('click', run);
  el.btnSyntaxSample.addEventListener('click', () => { el.syntaxInput.value = sample; run(); });
  el.btnSyntaxExport.addEventListener('click', exportReport);
  el.syntaxSentenceSelect.addEventListener('change', run);
  el.syntaxRelFilter.addEventListener('input', run);
  el.syntaxPosFilter.addEventListener('input', run);
  el.syntaxUseDistance?.addEventListener('change', run);
  run();
})();
