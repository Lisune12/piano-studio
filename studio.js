import {lessons,sequenceFor,labelFor,beatOffsets,timingResult,readProgress} from './learning.js';
const $=id=>document.getElementById(id);
let keys,clearNotes,mode='notes',lesson,sequence=[],position=0,errors=0,progress={},storage;
let context,timers=[],running=false,listening=false,origin=0,beatTimer,tick=0;
const totalLessons=Object.values(lessons).flat().length;
function sound(note=84,duration=.08,when=0) {
  try {context ||= new (window.AudioContext||window.webkitAudioContext)();context.resume().catch(()=>{});
    const start=context.currentTime+when,osc=context.createOscillator(),gain=context.createGain();
    osc.frequency.value=440*2**((note-69)/12);gain.gain.setValueAtTime(.06,start);gain.gain.exponentialRampToValueAtTime(.001,start+duration);osc.connect(gain);gain.connect(context.destination);osc.start(start);osc.stop(start+duration+.02);
  } catch {$('learn-feedback').textContent='Son indisponible. Les exercices de notes restent accessibles.';}
}
function later(fn,delay){const id=setTimeout(fn,Math.max(0,delay));timers.push(id);}
function stopTimers(){for(const key of keys.values())key.classList.remove('demo');timers.forEach(clearTimeout);timers=[];running=false;listening=false;$('listen').textContent='Écouter';$('rhythm-start').textContent='Commencer le rythme';}
export function pausePractice(){if(running||listening){stopTimers();$('learn-feedback').textContent='Pause. Relancez l’exercice quand vous êtes prêt.';} stopMetronome();}
function stopMetronome(){clearInterval(beatTimer);beatTimer=null;$('metro').textContent='Démarrer le métronome';$('pulse').textContent='○';}
function bpm(){return Number($('tempo').value);}
function updateSummary(){const count=Object.keys(progress).length;$('saved-count').textContent=`${count} / ${totalLessons} ateliers réussis`; $('overall').value=count;
  const record=progress[lesson.id];$('best').textContent=record?`Meilleur résultat : ${record.best} % · ${record.runs} réussite(s)`:'Votre première réussite vous attend.';}
function record(){const score=Math.max(0,Math.round(100*sequence.length/(sequence.length+errors)));const old=progress[lesson.id];progress[lesson.id]={best:Math.max(old?.best||0,score),runs:(old?.runs||0)+1};
  try {storage.setItem('piano-studio-progress-v2',JSON.stringify(progress));}catch{$('save-status').textContent='Sauvegarde indisponible : les résultats restent disponibles pendant cette visite.';} updateSummary();return score;}
function render(){
  $('learn-steps').replaceChildren(...sequence.map((note,i)=>{const li=document.createElement('li');li.className=i<position?'done':i===position?'current':'';
    li.textContent=labelFor(lesson,note)+(i<position?' ✓':'');if(i===position)li.setAttribute('aria-current','step');
    const small=document.createElement('small');small.textContent=mode==='rhythm'||mode==='melodies'?`${lesson.beats[i]} temps`:mode==='scales'?`doigt ${i<8?lesson.fingers[i]:lesson.fingers[14-i]}`:'';li.append(small);return li;}));
  $('learn-progress').max=sequence.length;$('learn-progress').value=position;$('learn-count').textContent=`${position} / ${sequence.length}`;
  for(const [note,key] of keys)key.classList.toggle('target',$('guide').checked&&position<sequence.length&&note===sequence[position]);
}
function reset(){stopTimers();clearNotes();position=0;errors=0;sequence=sequenceFor(lesson,mode==='scales'?$('direction').value:'up');render();
  $('learn-feedback').textContent=mode==='rhythm'?'Écoutez le modèle, puis lancez les quatre temps de départ.':`À vous : ${labelFor(lesson,sequence[0])}.`;updateSummary();}
function selectLesson(){lesson=lessons[mode].find(l=>l.id===$('lesson').value);$('lesson-tip').textContent=lesson.tip;$('direction-control').hidden=mode!=='scales';$('rhythm-start').hidden=mode!=='rhythm';reset();}
function switchMode(next){stopMetronome();mode=next;for(const button of document.querySelectorAll('[data-mode]'))button.setAttribute('aria-pressed',String(button.dataset.mode===mode));
  $('lesson').replaceChildren(...lessons[mode].map(l=>{const option=document.createElement('option');option.value=l.id;option.textContent=l.title;return option;}));selectLesson();}
export function handlePracticeNote(note){
  if(listening||position>=sequence.length)return;
  if(mode==='rhythm'&&!running)return;
  if(note!==sequence[position]){errors++;$('learn-feedback').textContent=`Cherchez ${labelFor(lesson,sequence[position])}. Prenez votre temps.`;return;}
  if(mode==='rhythm'){
    const expected=origin+beatOffsets(lesson.beats,bpm())[position];const result=timingResult(performance.now(),expected,bpm());
    if(!result.ok){errors++;$('learn-feedback').textContent=result.delta<0?'Un peu tôt : attendez le prochain repère.':'Un peu tard : relancez pour retrouver la pulsation.';return;}
  }
  position++;render();
  if(position===sequence.length){stopTimers();$('learn-feedback').textContent=`Bravo ! Atelier réussi · ${record()} %. Rejouez pour gagner en aisance. ♡`;}
  else $('learn-feedback').textContent=mode==='rhythm'?'Bien dans le rythme !':`Bien joué ! Maintenant : ${labelFor(lesson,sequence[position])}.`;
}
function listen(){if(listening){stopTimers();return;}reset();stopMetronome();listening=true;$('listen').textContent='Arrêter l’écoute';$('learn-feedback').textContent='Écoutez le modèle ; votre essai commence ensuite.';
  const beats=mode==='rhythm'||mode==='melodies'?lesson.beats:sequence.map(()=>1),offsets=beatOffsets(beats,bpm());
  sequence.forEach((note,i)=>later(()=>{sound(note,Math.min(.6,beats[i]*60/bpm()*.8));for(const key of keys.values())key.classList.remove('demo');keys.get(note)?.classList.add('demo');},offsets[i]));
  later(()=>{stopTimers();for(const key of keys.values())key.classList.remove('demo');$('learn-feedback').textContent=mode==='rhythm'?'À vous : lancez le rythme.':`À vous : ${labelFor(lesson,sequence[0])}.`;},offsets.at(-1)+beats.at(-1)*60000/bpm());
}
function startRhythm(){if(running){stopTimers();$('learn-feedback').textContent='Rythme arrêté. Vous pouvez recommencer.';return;}reset();stopMetronome();running=true;$('rhythm-start').textContent='Arrêter le rythme';
  const interval=60000/bpm();origin=performance.now()+4*interval;
  for(let i=0;i<4;i++)later(()=>{sound(i===0?88:84);$('learn-feedback').textContent=`Départ dans ${4-i}…`;},i*interval);
  const offsets=beatOffsets(lesson.beats,bpm());
  // Chaque attaque a une fenêtre bornée : aucune réussite n’est attribuée à un clic tardif.
  offsets.forEach((offset,i)=>{later(()=>{sound(84);$('rhythm-cue').textContent=`Jouez Do4 · attaque ${i+1}/${sequence.length}`;},4*interval+offset);
    later(()=>{if(running&&position<=i){stopTimers();$('learn-feedback').textContent='Une attaque a été manquée. Écoutez le modèle et réessayez plus lentement.';}},4*interval+offset+Math.min(180,interval*.25)+35);});
}
export function initStudio(keyMap,clear){keys=keyMap;clearNotes=clear;
  try{storage=window.localStorage;progress=readProgress(storage);}catch{progress={};}
  const section=document.querySelector('.exercise');section.setAttribute('aria-labelledby','exercise-title');section.innerHTML=`
  <div class="studio-top"><div><p class="eyebrow">VOTRE PARCOURS · UNE PETITE VICTOIRE CHAQUE JOUR</p><h2 id="exercise-title">Apprendre en jouant</h2></div><span class="version">Studio 02</span></div>
  <p>Explorez chaque atelier librement. Commencez lentement, puis cherchez la régularité.</p>
  <nav class="practice-nav" aria-label="Ateliers"><button data-mode="notes" aria-pressed="true">🌈 Notes</button><button data-mode="scales" aria-pressed="false">🌿 Gammes</button><button data-mode="rhythm" aria-pressed="false">🥁 Rythme</button><button data-mode="melodies" aria-pressed="false">🎵 Mélodies</button></nav>
  <div class="learn-controls"><div><label for="lesson">Votre atelier</label><select id="lesson"></select></div><div id="direction-control" hidden><label for="direction">Sens de la gamme</label><select id="direction"><option value="up">Montée</option><option value="round">Aller-retour</option></select></div></div>
  <p id="lesson-tip" class="lesson-tip"></p><label class="guide"><input id="guide" type="checkbox" checked> Montrer la prochaine touche</label>
  <ol id="learn-steps" aria-label="Notes à jouer"></ol><div class="progress-label"><label for="learn-progress">Votre essai</label><span id="learn-count"></span></div><progress id="learn-progress" max="8" value="0"></progress>
  <p id="learn-feedback" role="status" aria-live="polite"></p><p id="rhythm-cue" aria-live="off"></p>
  <div class="practice-actions"><button id="listen" class="secondary">Écouter</button><button id="rhythm-start" class="primary" hidden>Commencer le rythme</button><button id="learn-reset" class="secondary">Recommencer</button></div>
  <details class="tempo-panel"><summary>Tempo et métronome</summary><label for="tempo">Tempo : <output id="tempo-value">70</output> battements / minute</label><input id="tempo" type="range" min="40" max="140" step="5" value="70"><div class="practice-actions"><button id="metro" class="secondary">Démarrer le métronome</button><span id="pulse" aria-hidden="true">○</span></div><p class="hint">Le clic est sonore, même si le son du clavier est coupé. Le rythme évalue les attaques, pas la durée tenue. Le MIDI et le navigateur peuvent ajouter un léger délai.</p></details>
  <div class="saved"><strong id="saved-count"></strong><progress id="overall" max="${totalLessons}" value="0" aria-label="Ateliers réussis"></progress><p id="best"></p><p id="save-status" class="hint">Résultats enregistrés sur ce navigateur uniquement, sans compte ni synchronisation.</p></div>
  <details class="basics"><summary>Les petits repères pour bien commencer</summary><div class="basics-grid"><article><h3>Une pratique douce</h3><p>Asseyez-vous face au clavier, épaules relâchées, poignets souples. Jouez sans forcer et faites une pause si vous ressentez une douleur.</p></article><article><h3>Les doigts</h3><p>1 = pouce · 2 = index · 3 = majeur · 4 = annulaire · 5 = auriculaire. Les doigtés de gamme proposés sont ceux de la main droite.</p></article><article><h3>Le rythme</h3><p>Noire = 1 temps, blanche = 2 temps, croche = ½ temps. La pulsation est votre repère régulier ; les notes se placent autour.</p></article><article><h3>Lire et écouter</h3><p>Do Ré Mi Fa Sol La Si, puis Do à l’octave. ♯ monte d’un demi-ton, ♭ descend d’un demi-ton. Une même touche peut avoir deux noms : La♯ = Si♭.</p></article><article><h3>Votre routine · 10 minutes</h3><p>2 minutes de repérage, 3 de gamme, 2 de rythme, 3 de mélodie. Choisissez un tempo confortable. La régularité compte plus que la vitesse.</p></article></div></details>`;
  document.querySelectorAll('[data-mode]').forEach(button=>button.onclick=()=>switchMode(button.dataset.mode));$('lesson').onchange=selectLesson;$('direction').onchange=reset;$('guide').onchange=render;$('learn-reset').onclick=reset;$('listen').onclick=listen;$('rhythm-start').onclick=startRhythm;
  $('tempo').oninput=()=>{$('tempo-value').textContent=$('tempo').value;pausePractice();};
  $('metro').onclick=()=>{if(beatTimer){stopMetronome();return;}stopTimers();tick=0;const click=()=>{sound(tick%4===0?88:84);$('pulse').textContent=`${tick%4+1} ●`;tick++;};click();beatTimer=setInterval(click,60000/bpm());$('metro').textContent='Arrêter le métronome';};
  section.querySelector('.practice-actions').before(document.querySelector('.instrument'));
  switchMode('notes');if(!storage)$('save-status').textContent='Sauvegarde indisponible : résultats conservés pendant cette visite.';
}
