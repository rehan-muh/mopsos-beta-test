---
layout: default
title: Prosody
section: prosody
---

<section class="hero card">
  <p class="kicker">Greek NLP Tools</p>
  <h1>Prosody Lab</h1>
  <p class="lead">Generate metrical scansion alongside text, compare against templates, inspect caesura behavior, and export verse-level diagnostics for research notebooks.</p>
</section>

<div class="card">
  <h2>1. Input verses</h2>
  <p class="help">Enter one verse per line. You can use a custom template or quick presets for common meters.</p>
  <div class="grid-3">
    <div class="field">
      <label for="prosodyPreset"><strong>Meter preset</strong></label>
      <select id="prosodyPreset">
        <option value="">Custom / none</option>
        <option value="hex">Dactylic hexameter</option>
        <option value="pent">Elegiac pentameter (approx.)</option>
        <option value="iamb">Iambic trimeter (approx.)</option>
      </select>
    </div>
    <div class="field startup-actions">
      <button id="btnApplyPreset" class="btn">Apply preset</button>
    </div>
    <div class="field startup-actions">
      <button id="btnProsodyExport" class="btn">Export scansion report (CSV)</button>
    </div>
  </div>
  <div class="grid-2">
    <div class="field">
      <label for="prosodyInput"><strong>Verse text</strong></label>
      <textarea id="prosodyInput" class="big-textarea">μῆνιν ἄειδε θεὰ Πηληϊάδεω Ἀχιλῆος
οὐλομένην, ἣ μυρί᾽ Ἀχαιοῖς ἄλγε᾽ ἔθηκε</textarea>
    </div>
    <div class="field">
      <label for="prosodyTemplate"><strong>Meter template (optional)</strong></label>
      <textarea id="prosodyTemplate" class="big-textarea">– ⏑ ⏑ | – ⏑ ⏑ | – ⏑ ⏑ | – ⏑ ⏑ | – ⏑ ⏑ | – –</textarea>
    </div>
  </div>
  <div class="btn-row">
    <button id="btnRunProsody" class="btn btn-primary">Run scansion</button>
    <button id="btnProsodySample" class="btn">Load sample</button>
  </div>
</div>

<div class="card">
  <h2>2. Scansion + text</h2>
  <div id="prosodySummary" class="analysis-wrap"></div>
  <div class="viz-wrap">
    <h3>Verse alignment (text + scansion)</h3>
    <div id="prosodyAlignment"></div>
  </div>
  <div class="grid-2">
    <div class="viz-wrap">
      <h3>Syllable profile</h3>
      <div id="prosodyBars"></div>
    </div>
    <div class="viz-wrap">
      <h3>Template + caesura diagnostics</h3>
      <div id="prosodyDiagnostics"></div>
    </div>
  </div>
</div>
