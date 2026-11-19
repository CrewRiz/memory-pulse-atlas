// Runs inside the existing viewer closure. Graph calculations live in explore.js.
export const EXPLORE_CSS = String.raw`
.explore-launch{position:absolute;top:14px;left:14px;z-index:4;box-shadow:var(--shadow);background:var(--panel)}
.explore-launch[aria-pressed=true]{border-color:var(--blue);color:var(--blue)}
.region-dot{width:7px;height:7px;border-radius:50%;background:var(--region-color);flex-shrink:0}
.region-nav .item .t{font-size:12px;text-transform:capitalize}
.l3.region{pointer-events:auto;cursor:pointer;border:1px solid var(--region-color);border-radius:8px;padding:5px 9px;background:var(--panel);font-size:12px;text-transform:capitalize;box-shadow:var(--shadow)}
.l3.region:focus{outline:2px solid var(--blue)}
.l3.region span{display:block;font-size:10px;color:var(--ink-3);text-transform:none}
.source-nav{margin:20px 0;padding-bottom:14px;border-bottom:1px solid var(--rule)}
.rail-heading{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-3);margin:0 8px 8px}
.source-nav .item{display:flex;gap:12px;align-items:center;padding:8px}
.source-nav .item .t{flex:1}
.source-nav .item .m{margin:0;font-size:11px}
.source-nav .item[aria-pressed=true]{background:var(--blue-wash);color:var(--blue)}
.bar h1{letter-spacing:-.02em}
.panel .explore-bar{position:sticky;top:-16px;background:var(--panel);z-index:2;padding:10px 0;margin-top:-10px}
.panel .empty{padding:8px 2px}
.panel .empty h2{font-weight:550;font-size:23px}
.stage .legend{opacity:.65;font-size:11px;max-width:210px;pointer-events:none}
.stage .legend:hover{opacity:1}
.bar .seg{flex-shrink:0}
@media(max-width:1450px){.bar .count{display:none}.bar .integrity{font-size:11px;gap:8px}}
@media(max-width:650px){.bar{gap:6px;padding:0 8px}.bar h1{max-width:74px;font-size:13px}.bar .seg button{padding:6px 8px}.bar .iconbtn{width:30px;height:30px}}
.explore-intro{font-size:13px;color:var(--ink-2);margin:0 0 14px}
.explore-section{margin:16px 0;padding-top:14px;border-top:1px solid var(--rule)}
.explore-section h3{margin:0 0 8px}
.explore-form{display:grid;gap:9px}
.explore-form label{display:grid;gap:4px;font-size:12px;color:var(--ink-2)}
.explore-form input,.explore-form select,.explore-form textarea{width:100%;min-width:0;border:1px solid var(--rule-strong);border-radius:7px;background:var(--raise);color:var(--ink);padding:8px;font:inherit}
.explore-form input[type=range]{padding:0}
.explore-form textarea{min-height:80px;resize:vertical}
.explore-form .dates{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.explore-counts{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:14px 0}
.explore-counts div{border:1px solid var(--rule);border-radius:9px;padding:10px 8px;color:var(--ink-2);font-size:12px}
.explore-counts b{display:block;font-size:23px;color:var(--ink);font-weight:550}
.evidence-step{border-left:2px solid var(--rule-strong);padding:0 0 10px 12px;margin-left:5px}
.evidence-step.active{border-color:var(--blue)}
.evidence-step .item{padding-left:0}
.evidence-step blockquote,.bridge-card blockquote{margin:8px 0;font-size:13px;white-space:pre-wrap;overflow-wrap:anywhere;color:var(--ink-2)}
.explore-kicker{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--blue);margin-bottom:8px}
.explore-bar{display:flex;justify-content:space-between;gap:8px;margin-bottom:16px}
.explore-bar button{font-size:12px}
.bridge-card{border:1px solid var(--rule);padding:12px;border-radius:9px;margin:10px 0;background:var(--raise)}
.bridge-card .citation{font-size:12px;color:var(--ink-3);overflow-wrap:anywhere}
.source-excerpt{white-space:pre-wrap;overflow-wrap:anywhere;font-size:12px;line-height:1.6;background:var(--raise);padding:12px;border-radius:8px}
.tour-caption{position:absolute;bottom:20px;left:16px;right:64px;z-index:3;max-width:560px;padding:12px 16px;background:var(--panel);border:1px solid var(--rule-strong);border-radius:10px;box-shadow:var(--shadow)}
.tour-caption[hidden]{display:none}
.tour-caption p{margin:3px 0 8px;font-size:13px}
.tour-caption .actions{margin:0}
body.presenting{grid-template-columns:minmax(0,1fr);grid-template-areas:"bar" "stage" "time"}
body.presenting .rail,body.presenting .panel{display:none}
body.presenting .legend{display:none}
.bar .presentation-exit{display:none}
body.presenting .presentation-exit{display:inline-flex}
@media(min-width:1500px){.panel:has(.bridge-pair){width:560px;margin-left:-180px;z-index:5;box-shadow:var(--shadow)}.bridge-pair{display:grid;grid-template-columns:1fr 1fr;gap:10px}}
@media(prefers-reduced-motion:reduce){.evidence-step{transition:none}}
`;

export const EXPLORE_UI = String.raw`
var explorer = createExplorer();
var ex = { mode: null, root: -1, trace: null, focus: null, edgeSet: null, question: '', answer: null, pair: null, diff: null, tour: [], stop: 0, source: null, error: '', shell: 1, cut: 1 };
var lastVisit = null;
try { lastVisit = JSON.parse(store.get('visit') || 'null'); } catch (e) {}
function exButton(label, action) { return '<button class="btn" data-ex="' + action + '">' + label + '</button>'; }
function exHeading(title, subtitle) { return '<div class="explore-bar">' + exButton('Explore', 'home') + exButton('Close', 'close') + '</div><div class="explore-kicker">Memory atlas</div><h2>' + esc(title) + '</h2><p class="explore-intro">' + esc(subtitle) + '</p>'; }
function exDate(t) { return unit === 'day' ? new Date(t * 86400000).toISOString().slice(0, 10) : String(t); }
function exTime(s) { return unit === 'day' ? Math.floor(Date.parse(s) / 86400000) : Number(s); }
function exReveal() { document.body.classList.remove('rail-open', 'presenting'); if (window.innerWidth <= 980) document.body.classList.add('panel-open'); }
function exClear() { ex.mode = null; ex.trace = null; ex.focus = null; ex.edgeSet = null; ex.diff = null; ex.pair = null; pairFocus = null; signals = []; $('tour-caption').hidden = true; $('explore-launch').setAttribute('aria-pressed', 'false'); if(ex.pendingUpdate){var pending=ex.pendingUpdate;ex.pendingUpdate=null;queueMicrotask(function(){swap(pending[0],pending[1]);});} }
function exOpen(mode) { stopPlay(); ex.mode = mode; ex.error = ''; if (growth) endGrowth(); exReveal(); $('explore-launch').setAttribute('aria-pressed', 'true'); renderPanel(); $('panel').scrollTop = 0; kick(); }
function exFocus(ids) { ex.focus = {}; ids.forEach(function(j) { if (shown(j)) ex.focus[j] = 1; }); kick(); }
function exTrace(root) {
  exClear(); ex.root = root; ex.trace = explorer.trace(A, root, T); ex.edgeSet = {};
  ex.trace.edges.forEach(function(k) { var l = A.links[k]; ex.edgeSet[l.a + ':' + l.b + ':' + l.type] = 1; });
  exFocus(ex.trace.steps.map(function(s) { return s.node; }).concat(ex.trace.corrections));
  exOpen('trace');
  if (view === 'map' || view === 'river') { if (local) setLocal(false); fitTo(Object.keys(ex.focus).map(Number), 90); }
  exPulseTrace();
}
function exPulseTrace() {
  if (!ex.trace || reduceMotion) return;
  signals = []; var now = performance.now();
  ex.trace.steps.forEach(function(s) { fire[s.node] = 1; });
  E.forEach(function(e) { if (ex.edgeSet[e.a + ':' + e.b + ':' + e.type]) signals.push({ e: e, from: e.a, to: e.b, t0: now, dur: 2200, s: 1, evidence: true }); });
  kick();
}
function exTracePanel() {
  var r = ex.trace;
  var h = exHeading('Trace evidence', 'Recorded predecessors and explicit references. A recorded chain shows provenance, not proof of a claim.');
  if (!shown(ex.root)) return h + '<p>This note is later than the selected time. Move the timeline forward to trace it.</p>';
  h += '<div class="box"><b>' + esc(notes[ex.root].title) + '</b><p class="hint">' + Math.max(0, r.steps.length - 1) + ' supporting notes, ' + r.corrections.length + ' correction notes</p></div>';
  h += '<div class="actions">' + exButton('Replay path', 'replay') + exButton('Copy context', 'brief') + '</div>';
  if (r.steps.length < 2) h += '<p class="hint">No earlier evidence is recorded for this note. Related notes are available in its normal detail view.</p>';
  h += r.steps.map(function(s, k) { var n = notes[s.node]; return '<div class="evidence-step' + (sel === s.node ? ' active' : '') + '"><span class="hint">' + (s.node === ex.root ? 'Selected conclusion' : 'Recorded evidence') + ' / ' + esc(explorer.citation(A, n)) + '</span><button class="item" data-trace-step="' + s.node + '"><span class="t">' + esc(n.title) + '</span></button><blockquote>' + esc(clip(n.text, 420)) + '</blockquote></div>'; }).join('');
  if (r.corrections.length) h += '<h3>Corrections affecting this path</h3>' + r.corrections.map(function(j) { return noteButton(j, '<span class="red">Read the replacement before using this path</span>'); }).join('');
  return h;
}
function exHome() {
  var h = exHeading('Explore your memory', 'Follow evidence, revisit a decision, or see what changed. Every result stays connected to its source.');
  h += '<form class="explore-form" id="ask-form"><label for="ask-q">Ask the memory<input id="ask-q" placeholder="What do we know about pricing?" value="' + esc(ex.question) + '"></label><button class="btn" type="submit">Find evidence</button><p class="hint">Local passage search. Results quote your notes; no generated answer or upload.</p></form>';
  h += '<section class="explore-section"><h3>Travel through time</h3><form class="explore-form" id="compare-form"><div class="dates"><label>From<input id="compare-from" type="' + (unit === 'day' ? 'date' : 'number') + '" value="' + exDate(Math.max(tmin, T - (unit === 'day' ? 7 : 20))) + '"></label><label>To<input id="compare-to" type="' + (unit === 'day' ? 'date' : 'number') + '" value="' + exDate(T) + '"></label></div><button class="btn" type="submit">Compare moments</button></form><p class="hint">Compares available note dates. Edited documents retain their current text.</p></section>';
  h += '<section class="explore-section"><h3>Pick up where you left off</h3><div class="actions">' + exButton(lastVisit ? 'Since your last visit' : 'Tour recent memories', 'tour') + exButton('Explore bridges', 'bridges') + '</div></section>';
  h += '<section class="explore-section"><h3>Saved views</h3><form class="explore-form" id="save-form"><label>Name this view<input id="save-name" maxlength="80" placeholder="My research overview" required></label><button class="btn" type="submit">Save view</button></form><div id="saved-views">' + exSavedHTML() + '</div></section>';
  h += '<section class="explore-section"><h3>3D appearance</h3><div class="explore-form"><label>Brain shell<input id="shell-opacity" type="range" min="0" max="1" step="0.05" value="' + ex.shell + '"></label><label>Cutaway<input id="shell-cut" type="range" min="-1.2" max="1.2" step="0.05" value="' + ex.cut + '"></label></div><div class="actions">' + exButton('Presentation mode', 'present') + '</div></section>';
  return h;
}
function exSaved() { try { var a = JSON.parse(store.get('views') || '[]'); return Array.isArray(a) ? a : []; } catch(e) { return []; } }
function exSavedHTML() { return exSaved().map(function(s,k) { return '<div class="actions"><button class="btn" data-saved="' + k + '">' + esc(s.name) + '</button><button class="btn" data-forget="' + k + '" aria-label="Remove saved view ' + esc(s.name) + '">Remove</button></div>'; }).join(''); }
function exCompare(from, to) {
  if (!Number.isFinite(from) || !Number.isFinite(to)) { ex.error = 'Choose two valid dates or row numbers.'; renderPanel(); return; }
  exClear(); ex.diff = explorer.compare(A, Math.max(tmin, Math.min(tmax, from)), Math.max(tmin, Math.min(tmax, to)));
  setT(ex.diff.to); exFocus(ex.diff.added.concat(ex.diff.affected)); exOpen('compare');
  ex.diff.added.forEach(function(j) { fire[j] = reduceMotion ? 0 : 1; }); kick();
}
function exBridge(a,b) { exClear(); ex.pair = [a,b]; pairFocus = [a,b]; exFocus([a,b]); exOpen('bridge'); if (r3d && view === '3d') r3d.flyTo(a); }
function exTour() {
  exClear(); setT(tmax); ex.tour = explorer.tour(A, lastVisit); ex.stop = 0; exOpen('tour');
  if (ex.tour.length) exTourStop(0);
}
function exTourStop(k) {
  ex.stop = Math.max(0, Math.min(ex.tour.length - 1, k));
  var s = ex.tour[ex.stop]; if (!s) return;
  select(s.node, { explore: true }); exFocus([s.node]); renderPanel();
  var c = $('tour-caption'); c.hidden = false;
  c.innerHTML = '<span class="explore-kicker">' + (ex.stop + 1) + ' of ' + ex.tour.length + ' / ' + esc(s.reason) + '</span><p>' + esc(clip(notes[s.node].title, 110)) + '</p><div class="actions">' + (ex.stop ? exButton('Previous', 'tour-prev') : '') + (ex.stop < ex.tour.length - 1 ? exButton('Next', 'tour-next') : exButton('Finish tour', 'tour-finish')) + '</div>';
}
function exRender() {
  if (!ex || !ex.mode) return false;
  var h = '', ids = [], mode = ex.mode;
  if (mode === 'home') h = exHome();
  else if (mode === 'trace') h = exTracePanel();
  else if (mode === 'ask') {
    h = exHeading('Evidence for your question', ex.question) + '<p>' + esc(ex.answer.summary) + '</p><p class="hint">Matching passages, with corrections first. These excerpts are not a synthesized answer.</p>';
    h += ex.answer.hits.map(function(r) { return '<div class="bridge-card"><div class="citation">' + esc(r.citation) + '</div>' + noteButton(r.node) + (r.withdrawn ? '<p class="red">Contains a withdrawn value</p>' : '') + '<blockquote>' + esc(r.excerpt) + '</blockquote><button class="btn" data-trace="' + r.node + '">Trace evidence</button></div>'; }).join('');
    if (ex.answer.hits.length) h += exButton('Copy context', 'brief');
  } else if (mode === 'compare') {
    var d = ex.diff;
    h = exHeading('What changed', exDate(d.from) + ' to ' + exDate(d.to));
    h += '<div class="explore-counts"><div><b>' + d.added.length + '</b>new notes</div><div><b>' + d.corrections.length + '</b>corrections</div><div><b>' + d.affected.length + '</b>affected notes</div></div><p class="hint">New notes are highlighted in blue. Corrections remain red. The map keeps its positions.</p>';
    h += '<div class="actions">' + exButton('Show before', 'before') + exButton('Show after', 'after') + exButton('Copy context', 'brief') + '</div>';
    h += '<h3>Corrections in this interval</h3>' + (d.corrections.map(function(j){return noteButton(j);}).join('') || '<p class="hint">No corrections recorded.</p>');
    h += '<h3>Newly affected notes</h3>' + (d.affected.slice(0,30).map(function(j){return noteButton(j);}).join('') || '<p class="hint">No newly withdrawn values found.</p>');
    h += '<h3>New notes</h3>' + (d.added.slice(-30).reverse().map(function(j){return noteButton(j);}).join('') || '<p class="hint">No new notes in this interval.</p>');
    if(d.added.length > 30) h += '<p class="hint">Showing the latest 30. Copy context includes the full interval.</p>';
  } else if (mode === 'bridges') {
    h = exHeading('Between memories', 'Inspect a connection and compare the source passages. Suggested relationships are not recorded evidence.');
    var bridges = (A.across || []).filter(function(p){return shown(p[0]) && shown(p[1]);}).slice().sort(function(a,b){return b[2]-a[2];});
    h += bridges.slice(0,40).map(function(p) { return '<div class="bridge-card"><span class="citation">' + esc(srcName(notes[p[0]])) + ' / ' + esc(srcName(notes[p[1]])) + '</span><button class="item" data-bridge="' + p[0] + ',' + p[1] + '"><span class="t">' + esc(notes[p[0]].title) + '</span><span class="t">' + esc(notes[p[1]].title) + '</span></button></div>'; }).join('') || '<p>No connections between sources at this time.</p>';
  } else if (mode === 'bridge') {
    var b = explorer.bridge(A, ex.pair[0], ex.pair[1], T);
    h = exHeading('Connection under the lens', b ? (b.kind === 'recorded' ? 'Recorded ' + b.type + ' relationship' : 'Suggested by similar content. No evidence link is recorded.') : 'This pair is outside the selected time.');
    if (b) {
      h += '<div class="box">Shared words: ' + esc(b.shared.join(', ') || 'No exact shared topic words') + (b.score ? '<p class="hint">Match strength: ' + b.score.toFixed(1) + ' times the unrelated baseline. This is not a probability.</p>' : '') + '</div><div class="bridge-pair">';
      [b.left,b.right].forEach(function(n,k){h += '<article class="bridge-card"><span class="citation">' + esc(k ? b.rightCitation : b.leftCitation) + '</span><h3>' + esc(n.title) + '</h3><blockquote>' + esc(n.text) + '</blockquote><button class="btn" data-go="' + ex.pair[k] + '">Open note</button></article>';}); h += '</div>';
    }
  } else if (mode === 'tour') {
    h = exHeading(lastVisit ? 'Since your last visit' : 'Recent memories', ex.tour.length ? 'A short tour of new and changed notes. Advance at your own pace.' : 'No new or changed notes since your last visit.');
    if(ex.tour.length) { var s = ex.tour[ex.stop], n = notes[s.node]; h += '<span class="hint">' + (ex.stop+1) + ' of ' + ex.tour.length + ' / ' + esc(s.reason) + '</span><h3>' + esc(n.title) + '</h3><p class="hint">' + esc(explorer.citation(A,n)) + '</p><div class="body">' + renderBody(n) + '</div><button class="btn" data-trace="' + s.node + '">Trace evidence</button>'; }
    h += '<div class="actions">' + exButton('Mark as seen', 'tour-finish') + '</div>';
  } else if (mode === 'region') {
    h=exRegionPanel();
  } else if (mode === 'source') {
    h = exHeading('Source note', ex.source ? ex.source.path + ' / ' + ex.source.id : 'Reading the connected source');
    if(ex.source) h += '<h3>' + esc(ex.source.title) + '</h3><pre class="source-excerpt">' + esc(ex.source.text) + '</pre>';
  } else if (mode === 'correct') {
    h = exHeading('Append a correction', 'The existing note stays intact. A new correction records the withdrawn value, replacement, and reason.');
    h += '<div class="box">' + esc(notes[sel].title) + '</div><form id="correct-form" class="explore-form"><label>Withdrawn value<input id="correct-old" minlength="2" required></label><label>Replacement<input id="correct-new" minlength="2" required></label><label>Why it changed<textarea id="correct-reason" required></textarea></label><button class="btn" type="submit">Append correction</button><p id="correct-status" role="status"></p></form>';
  }
  if(ex.error) h += '<p class="box red" role="alert">' + esc(ex.error) + '</p>';
  $('panel').innerHTML = h;
  if(mode === 'home') {
    $('ask-form').onsubmit = function(e){e.preventDefault(); ex.question = $('ask-q').value; ex.answer = explorer.ask(A, ex.question, T); ex.trace = null; ex.edgeSet = null; exFocus(ex.answer.hits.map(function(h){return h.node;})); exOpen('ask');};
    $('compare-form').onsubmit = function(e){e.preventDefault(); exCompare(exTime($('compare-from').value), exTime($('compare-to').value));};
    $('save-form').onsubmit = function(e){e.preventDefault();var views = exSaved(), name = $('save-name').value.trim(); if(!name) return; views.unshift({name:name, state:explorer.saveView(A,{selected:sel,time:T,view:view,query:$('q').value,layers:Object.assign({},layers),cam:Object.assign({},cam),view3:r3d ? r3d.getView() : null})});store.set('views',JSON.stringify(views.slice(0,20)));$('saved-views').innerHTML=exSavedHTML();$('save-name').value='';};
    $('shell-opacity').oninput = function(){ex.shell=+this.value;if(view!=='3d')setView('3d');kick();};
    $('shell-cut').oninput = function(){ex.cut=+this.value;if(view!=='3d')setView('3d');kick();};
  }
  if(mode === 'correct') $('correct-form').onsubmit = exCorrect;
  return true;
}
function exRegion(id) {
  var r=((A.knowledge||{}).regions||[]).find(function(r){return r.id===id;});if(!r)return;
  exClear();ex.region=id;ex.neighborhood=null;sourceFocus=-1;topicFocus=-1;sel=-1;exFocus(r.members);exOpen('region');
  if(view==='3d' && r3d)r3d.focusGroup(r.members.filter(shown));else if(view!=='list')fitTo(r.members.filter(shown),90);
  renderRail();renderList();document.body.classList.remove('rail-open');
}
function exNeighborhood(id){
  var n=(A.knowledge.neighborhoods||[]).find(function(n){return n.id===id;});if(!n)return;
  ex.region=n.region;ex.neighborhood=id;exFocus(n.members);exOpen('region');
  if(view==='3d' && r3d)r3d.focusGroup(n.members.filter(shown));else if(view!=='list')fitTo(n.members.filter(shown),90);renderList();
}
function exRegionPanel(){
  var r=A.knowledge.regions.find(function(r){return r.id===ex.region;});if(!r)return exHome();
  var hood=(A.knowledge.neighborhoods||[]).find(function(n){return n.id===ex.neighborhood;});
  var ids=(hood||r).members.filter(shown), sources=new Set(ids.map(function(i){return notes[i].src;}));
  var warnings=new Set(A.flags.filter(function(f){return flagOn(f)&&ids.includes(f.note);}).map(function(f){return f.note;}));
  var h=exHeading((hood||r).label,'A content neighborhood, discovered from your memories across sources. These are knowledge regions, not anatomical functions.');
  h+='<div class="explore-counts"><div><b>'+ids.length+'</b>memories</div><div><b>'+sources.size+'</b>sources</div><div><b>'+warnings.size+'</b>need attention</div></div>';
  if(hood)h+='<button class="btn" data-region="'+esc(r.id)+'">Back to region</button>';
  h+='<h3>Neighborhoods</h3>'+(A.knowledge.neighborhoods||[]).filter(function(n){return n.region===r.id && n.members.some(shown);}).map(function(n){return '<button class="item" data-neighborhood="'+esc(n.id)+'"><span class="t">'+esc(n.label)+'</span><span class="m">'+n.members.filter(shown).length+' memories</span></button>';}).join('');
  h+='<h3>Recent memories</h3>'+ids.slice().sort(function(i,j){return notes[j].time-notes[i].time;}).slice(0,8).map(function(i){return noteButton(i,esc(srcName(notes[i])));}).join('');
  return h;
}
function exContext() {
  if(ex.trace) return ex.trace.steps.map(function(s){return s.node;}).concat(ex.trace.corrections);
  if(ex.mode==='ask') return ex.answer.hits.map(function(h){return h.node;});
  if(ex.diff) return ex.diff.added.concat(ex.diff.affected);
  return sel >= 0 ? [sel] : [];
}
function exSource() {
  var n = notes[sel], src = SRC[n.src]; ex.source = null; exOpen('source');
  if(!A.live || !src || !src.id) { ex.source={title:n.title,text:n.text,path:src ? src.path : A.source.name,id:n.id}; renderPanel(); return; }
  fetch('/api/note?source='+encodeURIComponent(src.id)+'&note='+encodeURIComponent(n.id)).then(function(r){if(!r.ok)throw Error('The source could not be read.');return r.json();}).then(function(s){if(ex.mode!=='source')return;ex.source=s;renderPanel();}).catch(function(e){if(ex.mode==='source'){ex.error=e.message;renderPanel();}});
}
function exCorrect(e) {
  e.preventDefault(); var form=e.target, btn=form.querySelector('button'), n=notes[sel], src=SRC[n.src];
  var payload={source:src.id,note:n.id,expected:n.text,withdrawn:$('correct-old').value,replacement:$('correct-new').value,reason:$('correct-reason').value};
  btn.disabled=true; $('correct-status').textContent='Appending correction';
  fetch('/api/correct',{method:'POST',headers:{'content-type':'application/json','x-atlas':'1'},body:JSON.stringify(payload)}).then(function(r){return r.json().then(function(d){if(!r.ok)throw Error(d.error || 'Correction could not be saved');return d;});}).then(function(d){exClear();ex.notice=d.written?'Correction appended at t'+d.row:'This correction is already recorded.';renderPanel();}).catch(function(err){if($('correct-status'))$('correct-status').textContent=err.message;btn.disabled=false;});
}
document.addEventListener('click',function(e){
  var b=e.target.closest('[data-ex],[data-trace],[data-trace-step],[data-bridge],[data-saved],[data-forget]');if(!b)return;
  if(b.hasAttribute('data-trace')){exTrace(+b.getAttribute('data-trace'));return;}
  if(b.hasAttribute('data-trace-step')){select(+b.getAttribute('data-trace-step'),{explore:true});return;}
  if(b.hasAttribute('data-bridge')){var p=b.getAttribute('data-bridge').split(',').map(Number);exBridge(p[0],p[1]);return;}
  if(b.hasAttribute('data-forget')){var vv=exSaved();vv.splice(+b.getAttribute('data-forget'),1);store.set('views',JSON.stringify(vv));$('saved-views').innerHTML=exSavedHTML();return;}
  if(b.hasAttribute('data-saved')){var saved=exSaved()[+b.getAttribute('data-saved')];if(!saved)return;var s=explorer.restoreView(A,saved.state);exClear();setT(s.time);Object.keys(layers).forEach(function(k){if(s.layers && typeof s.layers[k]==='boolean')layers[k]=s.layers[k];$('l-'+k).checked=layers[k];});setView(s.view);$('q').value=s.query || '';runSearch();select(s.selected);if(s.cam)cam=s.cam;if(r3d && s.view3)r3d.setView(s.view3);kick();return;}
  var action=b.getAttribute('data-ex');
  if(action==='home'){exClear();exOpen('home');}
  if(action==='close'){exClear();renderPanel();kick();}
  if(action==='trace' && sel>=0)exTrace(sel);
  if(action==='replay')exPulseTrace();
  if(action==='brief')copyText(explorer.brief(A,exContext(),T),b);
  if(action==='source')exSource();
  if(action==='correct')exOpen('correct');
  if(action==='bridges'){exClear();exOpen('bridges');}
  if(action==='tour')exTour();
  if(action==='tour-prev')exTourStop(ex.stop-1);
  if(action==='tour-next')exTourStop(ex.stop+1);
  if(action==='tour-finish'){lastVisit=explorer.snapshot(A);store.set('visit',JSON.stringify(lastVisit));exClear();exOpen('home');}
  if(action==='before' && ex.diff){setT(ex.diff.from);exFocus(ex.diff.affected);}
  if(action==='after' && ex.diff){setT(ex.diff.to);exFocus(ex.diff.added.concat(ex.diff.affected));}
  if(action==='present'){document.body.classList.add('presenting');resize();}
  if(action==='exit-present'){document.body.classList.remove('presenting');resize();}
});
window.addEventListener('pagehide',function(){store.set('visit',JSON.stringify(explorer.snapshot(A)));});
`;
