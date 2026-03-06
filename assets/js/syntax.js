(() => {
  const el = {
    syntaxInput: document.getElementById('syntaxInput'),
    btnBuildSyntax: document.getElementById('btnBuildSyntax'),
    btnSyntaxSample: document.getElementById('btnSyntaxSample'),
    syntaxSummary: document.getElementById('syntaxSummary'),
    syntaxDepSvg: document.getElementById('syntaxDepSvg'),
    syntaxPhrase: document.getElementById('syntaxPhrase'),
    syntaxTable: document.getElementById('syntaxTable')
  };

  const sample = `1\tμῆνιν\tμῆνις\tNOUN\t2\tobj
2\tἄειδε\tἀείδω\tVERB\t0\troot
3\tθεὰ\tθεά\tNOUN\t2\tvocative
4\tΠηληϊάδεω\tΠηληϊάδης\tPROPN\t5\tnmod
5\tἈχιλῆος\tἈχιλλεύς\tPROPN\t3\tappos`;

  function esc(x) { return String(x ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  function parseRows(text) {
    const rows = [];
    for (const line of String(text || '').split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const parts = trimmed.split('\t');
      if (parts.length < 6) continue;
      rows.push({
        id: Number.parseInt(parts[0], 10),
        form: parts[1],
        lemma: parts[2],
        pos: parts[3],
        head: Number.parseInt(parts[4], 10),
        deprel: parts[5]
      });
    }
    return rows.filter(r => Number.isFinite(r.id));
  }

  function renderSummary(rows) {
    const posMap = new Map();
    for (const r of rows) posMap.set(r.pos, (posMap.get(r.pos) || 0) + 1);
    const rootCount = rows.filter(r => r.head === 0).length;
    el.syntaxSummary.innerHTML = `<div class="analysis-grid">
      <div class="analysis-card"><span class="label">Tokens</span><div class="value">${rows.length}</div></div>
      <div class="analysis-card"><span class="label">Roots</span><div class="value">${rootCount}</div></div>
      <div class="analysis-card"><span class="label">POS tags</span><div class="value">${posMap.size}</div></div>
      <div class="analysis-card"><span class="label">Top POS</span><div class="value">${[...posMap.entries()].sort((a,b)=>b[1]-a[1])[0]?.[0] || '—'}</div></div>
    </div>`;
  }

  function renderDepTree(rows) {
    if (!rows.length) { el.syntaxDepSvg.innerHTML = ''; return; }
    const w = 1100, baseY = 390;
    const step = Math.max(70, Math.floor((w - 120) / rows.length));
    const x = new Map(rows.map((r, i) => [r.id, 60 + i * step]));
    let html = `<rect x="0" y="0" width="${w}" height="460" fill="#f8fafc" rx="12"/>`;

    for (const r of rows) {
      const from = x.get(r.head);
      const to = x.get(r.id);
      if (!to) continue;
      if (r.head === 0 || !from) {
        html += `<line x1="${to}" y1="70" x2="${to}" y2="${baseY-32}" stroke="#334155" stroke-dasharray="4 4"/>`;
        html += `<text x="${to+5}" y="65" font-size="11" fill="#334155">ROOT</text>`;
      } else {
        const dist = Math.abs(from - to);
        const h = Math.min(280, 45 + dist * 0.35);
        const mid = (from + to) / 2;
        html += `<path d="M ${from} ${baseY-30} Q ${mid} ${baseY-h} ${to} ${baseY-30}" fill="none" stroke="#4f46e5" stroke-width="2"/>`;
        html += `<text x="${mid-18}" y="${baseY-h-6}" font-size="11" fill="#1e293b">${esc(r.deprel)}</text>`;
      }
    }

    for (const r of rows) {
      const cx = x.get(r.id);
      html += `<circle cx="${cx}" cy="${baseY-30}" r="17" fill="#0ea5e9" opacity=".9"/>`;
      html += `<text x="${cx}" y="${baseY-26}" text-anchor="middle" font-size="11" fill="white">${r.id}</text>`;
      html += `<text x="${cx}" y="${baseY+2}" text-anchor="middle" font-size="14" fill="#0f172a">${esc(r.form)}</text>`;
      html += `<text x="${cx}" y="${baseY+20}" text-anchor="middle" font-size="11" fill="#64748b">${esc(r.pos)}</text>`;
    }

    el.syntaxDepSvg.innerHTML = html;
  }

  function renderPhraseSketch(rows) {
    const root = rows.find(r => r.head === 0) || rows[0];
    const children = new Map();
    for (const r of rows) {
      if (!children.has(r.head)) children.set(r.head, []);
      children.get(r.head).push(r);
    }
    for (const arr of children.values()) arr.sort((a,b)=>a.id-b.id);

    function walk(node, depth = 0) {
      const indent = '  '.repeat(depth);
      const label = `${node.pos}:${node.form}`;
      const kids = children.get(node.id) || [];
      if (!kids.length) return `${indent}(${label})`;
      return `${indent}(${label}\n${kids.map(k => walk(k, depth + 1)).join('\n')}\n${indent})`;
    }

    el.syntaxPhrase.textContent = `(S\n${walk(root, 1)}\n)`;
  }

  function renderTable(rows) {
    let html = '<table class="mini-table"><thead><tr><th>ID</th><th>Form</th><th>Lemma</th><th>POS</th><th>Head</th><th>Deprel</th></tr></thead><tbody>';
    for (const r of rows) html += `<tr><td>${r.id}</td><td>${esc(r.form)}</td><td>${esc(r.lemma)}</td><td>${esc(r.pos)}</td><td>${r.head}</td><td>${esc(r.deprel)}</td></tr>`;
    html += '</tbody></table>';
    el.syntaxTable.innerHTML = html;
  }

  function setupZoom() {
    const targets = [el.syntaxSummary, ...document.querySelectorAll('.viz-wrap')].filter(Boolean);
    for (const c of targets) {
      if (c.querySelector(':scope > .zoom-btn')) continue;
      c.classList.add('zoomable');
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'zoom-btn';
      b.textContent = '⤢ Full view';
      b.addEventListener('click', () => openZoom(c));
      c.prepend(b);
    }
  }

  function openZoom(container) {
    let modal = document.getElementById('zoomModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'zoomModal';
      modal.className = 'zoom-modal';
      modal.innerHTML = `<div class="zoom-backdrop"></div><div class="zoom-dialog"><div class="zoom-head"><strong>Expanded view</strong><button type="button" class="btn btn-warn zoom-close">Close</button></div><div class="zoom-body"></div></div>`;
      document.body.appendChild(modal);
      modal.querySelector('.zoom-backdrop').addEventListener('click', () => modal.classList.remove('open'));
      modal.querySelector('.zoom-close').addEventListener('click', () => modal.classList.remove('open'));
    }
    const body = modal.querySelector('.zoom-body');
    body.innerHTML = '';
    const clone = container.cloneNode(true);
    clone.querySelector('.zoom-btn')?.remove();
    body.appendChild(clone);
    modal.classList.add('open');
  }

  function run() {
    const rows = parseRows(el.syntaxInput.value);
    if (!rows.length) {
      el.syntaxSummary.innerHTML = '<div class="small-muted">No valid rows parsed. Check tab-separated format.</div>';
      el.syntaxDepSvg.innerHTML = '';
      el.syntaxPhrase.textContent = '';
      el.syntaxTable.innerHTML = '';
      return;
    }
    renderSummary(rows);
    renderDepTree(rows);
    renderPhraseSketch(rows);
    renderTable(rows);
    setupZoom();
  }

  el.btnBuildSyntax.addEventListener('click', run);
  el.btnSyntaxSample.addEventListener('click', () => { el.syntaxInput.value = sample; run(); });
  run();
})();
