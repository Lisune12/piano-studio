import {initRecorder,captureOn,captureOff,capturing,stopTake} from './recorder.js?v=5';
import {names, noteName, parseMidi} from './music.js';
import {initStudio, handlePracticeNote, pausePractice} from './studio.js?v=5';
const $ = id => document.getElementById(id);
const keys = new Map();
// Une source par doigt, touche d’ordinateur ou canal MIDI évite qu’un note-off
// éteigne une même note encore tenue par une autre source.
const held = new Map();
let access, selected, audio;
const voices = new Map();
function toneStart(source, note) {
  if (!$('sound').checked) return;
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)();
    audio.resume().catch(() => {});
    const oscillator = audio.createOscillator(), gain = audio.createGain();
    oscillator.type = 'triangle'; oscillator.frequency.value = 440 * 2 ** ((note - 69) / 12);
    gain.gain.value = 0.045; oscillator.connect(gain); gain.connect(audio.destination);
    oscillator.start(); voices.set(source, {oscillator, gain});
  } catch { $('sound').checked = false; $('notes').textContent = 'Son indisponible ; les notes restent détectées.'; }
}
function toneStop(source) {
  const voice = voices.get(source); if (!voice) return;
  voice.gain.gain.setTargetAtTime(0, audio.currentTime, .015);
  voice.oscillator.stop(audio.currentTime + .08); voices.delete(source);
}
function renderHeld() {
  const notes = [...new Set(held.values())].sort((a,b) => a-b);
  for (const [note, key] of keys) { const on = notes.includes(note); key.classList.toggle('active', on); key.setAttribute('aria-pressed', String(on)); }
  $('notes').textContent = notes.length ? notes.map(noteName).join(' · ') : 'À vous de jouer…';
}
function start(source, note) {
  if (held.has(source)) return;
  held.set(source,note); captureOn(source,note); toneStart(source,note); renderHeld();
  if(!source.startsWith('replay:')&&!capturing())handlePracticeNote(note,[...held.values()]);
}
function stop(source) { captureOff(source); held.delete(source); toneStop(source); renderHeld(); }
function clear(prefix = '') { for (const source of [...held.keys()]) if (source.startsWith(prefix)) stop(source); }
// Chaque octave a son propre repère pour rester lisible sur téléphone.
const octaves = new Map();
for (const octave of [4,5]) {
  const block = document.createElement('div'); block.className = 'octave-block';
  const label = document.createElement('p'); label.className = 'octave-label'; label.textContent = `Octave ${octave} · Do${octave} à Si${octave}`;
  const row = document.createElement('div'); row.className = 'octave'; row.setAttribute('role','group'); row.setAttribute('aria-label',`Octave ${octave}`);
  block.append(label,row); $('keyboard').append(block); octaves.set(octave,row);
}
let white = 0;
for (let note = 60; note < 84; note++) {
  const black = names[note % 12].includes('♯'), key = document.createElement('button');
  key.type = 'button'; key.className = 'key' + (black ? ' black' : ''); key.textContent = noteName(note); key.setAttribute('aria-label', `Jouer ${noteName(note)}`); key.setAttribute('aria-pressed','false');
  if (black) key.style.left = `${(white % 7) / 7 * 100}%`; else white++;
  key.onpointerdown = event => { if (event.button !== 0) return; event.preventDefault(); key.focus({preventScroll:true}); key.setPointerCapture(event.pointerId); start(`pointer:${event.pointerId}`,note); };
  key.onpointerup = key.onpointercancel = key.onlostpointercapture = event => stop(`pointer:${event.pointerId}`);
  key.onkeydown = event => { if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); if (!event.repeat) start(`keyboard:${note}`,note); } };
  key.onkeyup = event => { if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); stop(`keyboard:${note}`); } };
  key.onblur = () => stop(`keyboard:${note}`);
  keys.set(note,key); octaves.get(Math.floor(note / 12)-1).append(key);
}
$('sound').onchange = () => { if (!$('sound').checked) for (const source of [...voices.keys()]) toneStop(source); };
window.addEventListener('blur', () => { clear(); pausePractice(); stopTake(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) { clear(); pausePractice(); stopTake(); } });
function selectInput() {
  if (selected) selected.onmidimessage = null;
  clear('midi:'); selected = access.inputs.get($('device').value);
  if (!selected || selected.state !== 'connected') { selected = null; $('midi-status').textContent = 'Aucun clavier connecté · le mode démo reste disponible.'; return; }
  selected.onmidimessage = event => {
    if (document.hidden) return;
    const message = parseMidi(event.data); if (!message) return;
    const source = `midi:${message.channel}:${message.note}`;
    if (message.on) start(source,message.note); else stop(source);
  };
  $('midi-status').textContent = `Connecté · ${selected.name || 'Clavier MIDI'}`;
}
function refreshInputs() {
  const previous = $('device').value;
  const inputs = [...access.inputs.values()].filter(input => input.state === 'connected');
  $('device').replaceChildren(...inputs.map(input => { const option = document.createElement('option'); option.value = input.id; option.textContent = input.name || 'Clavier MIDI'; return option; }));
  $('device').disabled = !inputs.length;
  if (inputs.some(input => input.id === previous)) $('device').value = previous;
  if (!inputs.length) { const option = document.createElement('option'); option.value = ''; option.textContent = 'Aucun périphérique détecté'; $('device').append(option); }
  selectInput();
}
$('device').onchange = selectInput;
$('connect').onclick = async () => {
  if (!window.isSecureContext) { $('midi-status').textContent = 'MIDI nécessite HTTPS (ou localhost). Ouvrez la version HTTPS du site.'; return; }
  if (!navigator.requestMIDIAccess) { $('midi-status').textContent = 'Web MIDI indisponible dans ce navigateur. Essayez Chrome compatible ou utilisez le clavier tactile.'; return; }
  $('connect').disabled = true;
  try {
    // L’autorisation ne se déclenche que lors de cette action explicite, sans SysEx.
    access = await navigator.requestMIDIAccess({sysex:false});
    access.onstatechange = refreshInputs; refreshInputs(); $('connect').textContent = 'Actualiser la connexion MIDI';
  } catch (error) {
    $('midi-status').textContent = error.name === 'NotAllowedError' || error.name === 'SecurityError' ? 'Accès MIDI refusé ou bloqué. Autorisez MIDI dans les paramètres du site puis réessayez. Le mode démo reste disponible.' : 'Connexion MIDI impossible. Vérifiez le navigateur et le câble, puis réessayez.';
  } finally { $('connect').disabled = false; }
};
initStudio(keys, clear);

initRecorder({start,stop,clear,pause:pausePractice});
