---
layout: default
title: Prosody
section: prosody
---

<section class="hero card">
  <p class="kicker">Greek NLP Tools</p>
  <h1>Prosody Lab</h1>
  <p class="lead">Generate metrical scansion alongside the text, inspect syllable structure, and compare verses against meter templates. You can feed fuller lexical data later.</p>
</section>

<div class="card">
  <h2>1. Input verses</h2>
  <p class="help">Enter one verse per line. Optional: provide a meter template (e.g. dactylic hexameter as <code>– ⏑ ⏑ | – ⏑ ⏑ | – ⏑ ⏑ | – ⏑ ⏑ | – ⏑ ⏑ | – –</code>).</p>
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
      <h3>Template match diagnostics</h3>
      <div id="prosodyDiagnostics"></div>
    </div>
  </div>
</div>
