import { patterns, fullscreenSteps } from './content.js';
import { guides, guideHTML } from './guides.js';
import { renderPattern } from './patterns.js';

const $ = selector => document.querySelector(selector);
const ids = ['preparation', ...patterns.map(p => p.id), 'finish'];
let mode = 'guide', current = 'preparation', labels = true, expanded = false, instructionsVisible = true;
let hideTimer, noticeTimer, frame;
let saved = {};
try { saved = JSON.parse(localStorage.getItem('calibratecolor-v1') || '{}') || {}; } catch { /* Storage is optional. */ }
const reviewed = new Set(Array.isArray(saved.reviewed) ? saved.reviewed.filter(id => patterns.some(p => p.id === id)) : []);
const checks = new Set(Array.isArray(saved.checks) ? saved.checks.filter(i => Number.isInteger(i) && i >= 0 && i < 4) : []);
function save() { try { localStorage.setItem('calibratecolor-v1', JSON.stringify({reviewed: [...reviewed], checks: [...checks]})); } catch { /* Private / restricted browsing still works. */ } }

$('#page').innerHTML = `
  <div class="page-heading"><div><p class="eyebrow" id="page-kicker"></p><h1 id="page-title"></h1><p id="page-subtitle"></p></div><span class="step-count" id="step-count"></span></div>
  <div id="intro"></div>
  <div id="pattern-layout" class="pattern-layout" hidden>
    <div class="pattern-column">
      <section class="stage" id="stage" aria-label="Calibration pattern viewer">
        <canvas id="pattern" role="img"></canvas>
        <aside id="fs-guidance" class="fullscreen-guidance" aria-label="Fullscreen instructions" hidden></aside>
        <button id="fs-instructions" class="fullscreen-instructions-toggle" aria-pressed="true" hidden>Hide instructions <kbd>I</kbd></button>
        <div class="fullscreen-hint" hidden>Move the pointer for controls · H controls · I instructions · ← → switch · Esc exit</div>
        <div class="fullscreen-bar" hidden><button id="fs-prev" aria-label="Previous pattern">←</button><span class="fullscreen-title"></span><button id="fs-next" aria-label="Next pattern">→</button><button id="fs-labels" aria-pressed="true">Labels on</button><button id="hide-controls">Hide controls</button><button id="exit-fullscreen">Exit fullscreen</button></div>
      </section>
      <div class="pattern-toolbar"><div class="toolbar-left"><span class="pill">sRGB · 8-bit</span><button id="labels-button" aria-pressed="true">Labels on</button></div><button id="fullscreen-button">Fullscreen <kbd>F</kbd></button></div>
      <p class="pattern-caption" id="pattern-caption"></p>
      <div class="pattern-meta"><span id="pixel-size"></span><span>Native resolution · 100% browser zoom</span></div>
      <details><summary>Pattern rendering &amp; limitations</summary><p>These are full-range (0–255), 8-bit sRGB patterns. The canvas uses the browser’s backing-pixel resolution. Browser zoom, display scaling, color profiles and your GPU/TV signal path can affect the result. Use SDR mode; this page cannot detect or disable OS HDR, Night Light, True Tone, adaptive brightness or TV processing.</p></details>
    </div>
    <aside class="instruction-panel" id="instructions" aria-label="Pattern instructions"></aside>
  </div>
  <div class="step-navigation" id="step-navigation" hidden><button id="previous">← Previous</button><label class="review-toggle"><input type="checkbox" id="reviewed">I’ve checked this pattern</label><button id="next" class="button-primary">Next step →</button></div>`;

const canvas = $('#pattern'), stage = $('#stage');
const ctx = canvas.getContext('2d', {alpha: false, colorSpace: 'srgb'});
function toast(message) { $('#notice').textContent = message; $('#notice').classList.add('show'); clearTimeout(noticeTimer); noticeTimer = setTimeout(() => $('#notice').classList.remove('show'), 4500); }
function navigate(id, nextMode = mode) { location.hash = `${nextMode}/${id}`; }
function rail() {
  const items = mode === 'guides' ? ['overview', ...guides.map(g => g.id)] : mode === 'guide' ? ids : patterns.map(p => p.id);
  $('#steps').innerHTML = items.map((id, position) => {
    const index = mode === 'guides' ? position : ids.indexOf(id), name = mode === 'guides' ? guides.find(g => g.id === id)?.short || 'All guides' : patterns.find(p => p.id === id)?.title || (id === 'preparation' ? 'Before you begin' : 'Your picture');
    return `<a class="step-link ${current === id ? 'active' : ''}" ${current === id ? 'aria-current="step"' : ''} href="#${mode}/${id}"><span class="step-number">${String(index).padStart(2, '0')}</span><span>${name}</span>${mode !== 'guides' && reviewed.has(id) ? '<span class="step-check" aria-label="Checked">✓</span>' : ''}</a>`;
  }).join('');
  $('#steps').setAttribute('aria-label', mode === 'guides' ? 'Setup guides' : 'Calibration steps');
  $('#rail-caption').textContent = mode === 'guides' ? 'SETUP GUIDES' : mode === 'guide' ? 'YOUR WALKTHROUGH' : 'PATTERN LIBRARY';
  $('#guide-link').toggleAttribute('aria-current', mode === 'guide');
  $('#patterns-link').toggleAttribute('aria-current', mode === 'patterns');
  if (mode === 'guide') $('#guide-link').setAttribute('aria-current', 'page');
  if (mode === 'patterns') $('#patterns-link').setAttribute('aria-current', 'page');
  $('#patterns-link').href = `#patterns/${patterns.some(p => p.id === current) ? current : 'black'}`;
  $('#guide-link').href = `#guide/${mode === 'guides' ? 'preparation' : current}`;
  $('#guides-link').toggleAttribute('aria-current', mode === 'guides');
  if (mode === 'guides') $('#guides-link').setAttribute('aria-current', 'page');
  $('.rail-tip').textContent = mode === 'guides' ? 'Set up the signal, then check the picture.' : 'Adjust your display’s own controls.';
}
function draw() {
  if ($('#pattern-layout').hidden || !ctx) return;
  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(() => {
    const rect = canvas.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    const width = Math.max(1, Math.round(rect.width * dpr)), height = Math.max(1, Math.round(rect.height * dpr));
    canvas.width = width; canvas.height = height;
    renderPattern(ctx, current, width, height, {labels, scale: dpr, suppressFooter: (expanded || document.fullscreenElement === stage) && instructionsVisible && ['black', 'white'].includes(current)});
    $('#pixel-size').textContent = `${width} × ${height} canvas pixels · DPR ${Number(dpr.toFixed(2))}`;
  });
}
function renderPreparation() {
  $('#intro').innerHTML = `<div class="intro-grid">
    <div class="intro-visual" aria-hidden="true"><div class="calibration-symbol">${[8, 24, 48, 80, 112, 148, 184, 220, 248].map(v => `<i style="--shade:rgb(${v},${v},${v})"></i>`).join('')}</div><span class="visual-caption">LESS GUESSWORK. MORE DETAIL.</span></div>
    <section class="setup"><h3>Set yourself up for a good picture.</h3><div class="checklist">
      ${[
        ['Let the display settle', 'Give it about 30 minutes to warm up. Use your usual room lighting and viewing position.'],
        ['Start with a sensible preset', 'Try sRGB on a monitor, or Cinema / Filmmaker on a TV. Turn off dynamic contrast and automatic brightness for these checks.'],
        ['Use an SDR signal', 'Turn off OS HDR and night / blue-light filters. Use the panel’s native resolution and reset browser zoom to 100%.'],
        ['Open the display’s controls', 'Use the monitor buttons or TV remote. This website displays patterns; adjustments happen on your display.'],
      ].map(([title, text], i) => `<label><input type="checkbox" data-check="${i}" ${checks.has(i) ? 'checked' : ''}><span><strong>${title}</strong>${text}</span></label>`).join('')}
    </div></section></div>
    <div class="intro-bottom"><div><h3>Six patterns. At your own pace.</h3><p>Work through shadows, highlights, gamma, grayscale, gradients and sharpness. Go back whenever a setting changes another part of the picture.</p></div><div><h3>Visual adjustment, with honest limits.</h3><p>A useful starting point for everyday SDR viewing. Accurate white balance, brightness measurements and profiles need a colorimeter. <button class="text-button about-shortcut" data-about>How this works ↗</button></p></div></div>
    <div class="intro-actions"><p>No installation. No account. Just your screen.<br><span class="small">Checklist and checked patterns are saved in this browser.</span></p><button class="button-primary" id="start-guide">Start the walkthrough <span aria-hidden="true">→</span></button></div>`;
  $('#start-guide').onclick = () => navigate('black', 'guide');
  $('[data-about]').onclick = () => $('#about-dialog').showModal();
  document.querySelectorAll('[data-check]').forEach(input => input.onchange = () => { const i = Number(input.dataset.check); input.checked ? checks.add(i) : checks.delete(i); save(); });
}
function renderFinish() {
  $('#intro').innerHTML = `<div class="completion"><div class="completion-card"><p class="eyebrow">LOOK AT THE WHOLE PICTURE</p><h2>Now put it to the real-world test.</h2><p>Open a few familiar photographs or SDR videos. Look for natural skin tones, detail in shadows and highlights, and comfortable brightness in your normal room lighting.</p><p>Settings can interact. Recheck black and white levels after changing gamma or the picture preset. Save the settings on the input and picture mode you actually use.</p><div class="review-list">${patterns.map(p => `<a href="#guide/${p.id}">${p.title}<span>${reviewed.has(p.id) ? 'Checked ✓' : 'Revisit →'}</span></a>`).join('')}</div><p class="small" style="margin:20px 0 0">${reviewed.size} of 6 patterns marked checked. This records your walkthrough, not a measured calibration result.</p></div><div class="completion-actions"><button class="button-primary" id="browse-patterns">Explore the patterns →</button><button id="restart">Reset walkthrough</button></div><p class="small" style="margin-top:22px">Your display may keep separate settings for each input, SDR/HDR mode and picture preset.</p></div>`;
  $('#browse-patterns').onclick = () => navigate('black', 'patterns');
  $('#restart').onclick = () => { reviewed.clear(); checks.clear(); save(); navigate('preparation', 'guide'); toast('Walkthrough reset. Display settings are not changed.'); };
}
function renderGuides() {
  document.body.classList.remove('pattern-page');
  document.body.classList.add('reading-page');
  $('#intro').hidden = false;
  $('#pattern-layout').hidden = $('#step-navigation').hidden = true;
  const guide = guides.find(g => g.id === current);
  $('#page-kicker').textContent = guide?.category || 'BEFORE AND BEYOND CALIBRATION';
  $('#page-title').textContent = guide?.title || 'Get the whole setup right.';
  $('#page-subtitle').textContent = guide?.summary || 'Practical guides for the screen, the signal and the room.';
  $('#step-count').textContent = 'SETUP GUIDES';
  document.title = `${guide?.title || 'Setup guides'} — CalibrateColor`;
  $('#intro').innerHTML = guide ? guideHTML(guide) : `<div class="guides-grid">${guides.map((g, i) => `<a class="guide-card" href="#guides/${g.id}"><span class="eyebrow">${String(i + 1).padStart(2, '0')} / ${g.category}</span><h2>${g.title}</h2><p>${g.summary}</p><span class="guide-card-action">Read guide →</span></a>`).join('')}</div><p class="guides-footnote">These guides complement the SDR patterns. HDR setup uses separate, HDR-aware tools.</p>`;
  $('#main').scrollTop = 0;
}
function render() {
  rail();
  if (mode === 'guides') { renderGuides(); return; }
  document.body.classList.remove('reading-page');
  const pattern = patterns.find(p => p.id === current), isPattern = Boolean(pattern);
  document.body.classList.toggle('pattern-page', isPattern);
  document.title = `${pattern?.title || (current === 'finish' ? 'Your picture' : 'A clearer picture.')} — CalibrateColor`;
  $('#intro').hidden = isPattern;
  $('#pattern-layout').hidden = !isPattern;
  $('#step-navigation').hidden = !isPattern;
  $('#page-kicker').textContent = isPattern ? (mode === 'guide' ? 'A BETTER PICTURE, STEP BY STEP' : 'THE PATTERN LIBRARY') : current === 'finish' ? 'WALKTHROUGH COMPLETE' : 'A BETTER PICTURE STARTS HERE';
  $('#page-title').textContent = pattern?.title || (current === 'finish' ? 'Your picture. Refined.' : 'See what your screen can do.');
  $('#page-subtitle').textContent = pattern?.subtitle || (current === 'finish' ? 'A few final checks before you settle in.' : 'A simple, visual guide to a well-adjusted monitor or TV.');
  $('#step-count').textContent = isPattern ? `${String(patterns.indexOf(pattern) + 1).padStart(2, '0')} / 06` : 'SDR / sRGB';
  if (isPattern) {
    stage.dataset.pattern = current;
    stage.classList.toggle('below-rows', ['black', 'white'].includes(current));
    $('#fs-guidance').innerHTML = `<div class="fullscreen-guidance-heading"><strong>${pattern.title}</strong><span>Adjust: ${pattern.control}</span></div><p>${pattern.goal}</p><ol>${fullscreenSteps[current].map(text => `<li>${text}</li>`).join('')}</ol>`;
    $('#instructions').innerHTML = `<p class="eyebrow">WHAT TO LOOK FOR</p><h2>${pattern.title === 'Gamma' ? 'Find the closest blend.' : 'Look closely. Adjust gently.'}</h2><p class="goal">${pattern.goal}</p><p class="adjust-control">Adjust: ${pattern.control}</p><ol>${pattern.steps.map(text => `<li>${text}</li>`).join('')}</ol><p class="note">${pattern.note}</p>`;
    // Technical details live below the viewer, leaving the instructions easy to scan.
    let technical = $('#pattern-technical');
    if (!technical) { technical = document.createElement('details'); technical.id = 'pattern-technical'; $('.pattern-column').append(technical); }
    technical.innerHTML = `<summary>Technical details: ${pattern.title.toLowerCase()}</summary><p>${pattern.technical}</p>`;
    technical.open = false;
    canvas.setAttribute('aria-label', `${pattern.title} calibration pattern. ${pattern.goal}`);
    $('.fullscreen-title').textContent = pattern.title;
    $('#pattern-caption').textContent = `${pattern.look}. Fullscreen gives the clearest view.`;
    $('#reviewed').checked = reviewed.has(current);
    $('#previous').disabled = mode === 'patterns' && current === patterns[0].id;
    $('#next').textContent = current === 'sharpness' && mode === 'guide' ? 'Finish walkthrough →' : 'Next pattern →';
    $('#next').disabled = mode === 'patterns' && current === 'sharpness';
    $('#fs-prev').disabled = current === 'black';
    $('#fs-next').disabled = current === 'sharpness';
    draw();
  } else if (current === 'preparation') renderPreparation();
  else renderFinish();
}
function route() {
  const parts = location.hash.slice(1).split('/');
  const nextMode = parts[0] === 'guides' ? 'guides' : parts[0] === 'patterns' ? 'patterns' : 'guide';
  const nextId = nextMode === 'guides' ? (guides.some(g => g.id === parts[1]) ? parts[1] : 'overview') : ids.includes(parts[1]) && (nextMode !== 'patterns' || patterns.some(p => p.id === parts[1])) ? parts[1] : nextMode === 'guide' ? 'preparation' : 'black';
  if ((expanded || document.fullscreenElement) && !patterns.some(p => p.id === nextId)) exitFullscreen();
  mode = nextMode; current = nextId;
  if (location.hash !== `#${mode}/${current}`) history.replaceState(null, '', `#${mode}/${current}`);
  render();
}
function move(direction, fromFullscreen = false) {
  const list = fromFullscreen || mode === 'patterns' ? patterns.map(p => p.id) : ids;
  const index = list.indexOf(current), next = list[index + direction];
  if (next) navigate(next);
}
function toggleLabels() { labels = !labels; for (const selector of ['#labels-button', '#fs-labels']) { $(selector).textContent = `Labels ${labels ? 'on' : 'off'}`; $(selector).setAttribute('aria-pressed', String(labels)); } draw(); }
function controls(show = true) { stage.classList.toggle('controls-hidden', !show); clearTimeout(hideTimer); }
function scheduleHide() { controls(true); if (document.fullscreenElement === stage || expanded) hideTimer = setTimeout(() => controls(false), 3500); }
function toggleInstructions() {
  instructionsVisible = !instructionsVisible;
  stage.classList.toggle('instructions-hidden', !instructionsVisible);
  $('#fs-instructions').setAttribute('aria-pressed', String(instructionsVisible));
  $('#fs-instructions').innerHTML = `${instructionsVisible ? 'Hide' : 'Show'} instructions <kbd>I</kbd>`;
  draw();
}
function updateFullscreenUI(active) {
  stage.classList.toggle('fullscreen-active', active);
  $('#fs-guidance').hidden = !active;
  if (active) {
    instructionsVisible = true;
    stage.classList.remove('instructions-hidden');
    $('#fs-instructions').setAttribute('aria-pressed', 'true');
    $('#fs-instructions').innerHTML = 'Hide instructions <kbd>I</kbd>';
  }
  $('#fs-instructions').hidden = !active;
  $('.fullscreen-bar').hidden = !active; $('.fullscreen-hint').hidden = !active;
  if (active) { $('#exit-fullscreen').focus({preventScroll: true}); scheduleHide(); }
  else { controls(true); $('#fullscreen-button').focus({preventScroll: true}); }
  draw();
}
async function enterFullscreen() {
  if ($('#pattern-layout').hidden) return;
  if (document.fullscreenElement === stage || expanded) return exitFullscreen();
  if (stage.requestFullscreen) {
    try { await stage.requestFullscreen(); return; } catch { /* Use in-page view when fullscreen is denied. */ }
  }
  expanded = true; stage.classList.add('expanded'); document.body.style.overflow = 'hidden'; updateFullscreenUI(true);
  $('.fullscreen-hint').textContent = 'In-page view · browser chrome remains · H controls · I instructions · Esc exit';
}
function exitFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen().catch(() => toast('Use Esc to leave fullscreen.'));
  if (expanded) { expanded = false; stage.classList.remove('expanded'); document.body.style.overflow = ''; updateFullscreenUI(false); }
}
document.addEventListener('fullscreenchange', () => updateFullscreenUI(document.fullscreenElement === stage));
$('#fullscreen-button').onclick = enterFullscreen;
$('#exit-fullscreen').onclick = exitFullscreen;
$('#fs-instructions').onclick = toggleInstructions;
$('#labels-button').onclick = $('#fs-labels').onclick = toggleLabels;
$('#hide-controls').onclick = () => { canvas.focus({preventScroll: true}); controls(false); };
canvas.tabIndex = -1;
$('#previous').onclick = () => move(-1);
$('#next').onclick = () => { if (mode === 'guide') { reviewed.add(current); save(); } move(1); };
$('#fs-prev').onclick = () => move(-1, true);
$('#fs-next').onclick = () => move(1, true);
$('#reviewed').onchange = event => { event.target.checked ? reviewed.add(current) : reviewed.delete(current); save(); rail(); };
stage.addEventListener('pointermove', event => { if (event.movementX || event.movementY) scheduleHide(); });
stage.addEventListener('pointerdown', event => { if (event.target === canvas && (document.fullscreenElement || expanded)) scheduleHide(); });
stage.addEventListener('focusin', () => controls(true));
stage.addEventListener('pointerenter', () => { if (document.fullscreenElement || expanded) scheduleHide(); });
$('#about-button').onclick = () => $('#about-dialog').showModal();
$('#shortcuts-button').onclick = () => $('#shortcuts-dialog').showModal();
$('.skip').onclick = event => { event.preventDefault(); $('#main').focus(); };
document.querySelectorAll('dialog').forEach(dialog => {
  dialog.querySelector('.dialog-close').onclick = () => dialog.close();
  dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
});
document.addEventListener('keydown', event => {
  if (event.ctrlKey || event.altKey || event.metaKey || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName)) return;
  if ($('dialog[open]')) return;
  const fullscreen = document.fullscreenElement === stage || expanded;
  const key = event.key.toLowerCase();
  if (key === 'tab' && fullscreen) controls(true);
  if (key === 'escape') { exitFullscreen(); return; }
  if (key === '?') { if (!fullscreen) $('#shortcuts-dialog').showModal(); return; }
  if (key === 'f' && patterns.some(p => p.id === current)) { event.preventDefault(); enterFullscreen(); }
  if (key === 'l' && patterns.some(p => p.id === current)) toggleLabels();
  if (key === 'i' && fullscreen) toggleInstructions();
  if (key === 'h' && fullscreen) controls(stage.classList.contains('controls-hidden'));
  if (mode !== 'guides' && (key === 'arrowright' || key === 'arrowleft')) { event.preventDefault(); move(key === 'arrowright' ? 1 : -1, fullscreen); }
});
window.addEventListener('hashchange', route);
window.addEventListener('resize', draw);
new ResizeObserver(draw).observe(stage);
// Moving the window between displays can change DPR without a layout resize.
function watchDPR() { const query = matchMedia(`(resolution: ${devicePixelRatio}dppx)`); query.addEventListener('change', () => { draw(); watchDPR(); }, {once: true}); }
watchDPR();
route();
