import {drawScore,measuresFor} from './score.js?v=4';
import {lessons,sequenceFor,labelFor,beatOffsets,timingResult,readProgress,matchRhythmTap,chordMatches} from './learning.js?v=5';
const $=id=>document.getElementById(id);
let keys,clearNotes,mode='notes',lesson,sequence=[],position=0,errors=0,progress={},storage;
let palettes={},routine=-1,scoreOffset=0,rhythmHits=new Set(),rhythmMissed=new Set();
const defaultColors={'scale-c':'#d5e9fc','scale-g':'#d8efdb','scale-f':'#f9dfc8','scale-am':'#e8dcf8'};
let context,timers=[],running=false,listening=false,origin=0,beatTimer,tick=0;
const totalLessons=Object.values(lessons).flat().length;
function sound(note=84,duration=.08,when=0) {
  try {context ||= new (window.AudioContext||window.webkitAudioContext)();context.resume().catch(()=>{});
    const start=context.currentTime+when,osc=context.createOscillator(),gain=context.createGain();
    osc.frequency.value=440*2**((note-69)/12);gain.gain.setValueAtTime(.06,start);gain.gain.exponentialRampToValueAtTime(.001,start+duration);osc.connect(gain);gain.connect(context.destination);osc.start(start);osc.stop(start+duration+.02);
  } catch {$('learn-feedback').textContent='Son indisponible. Les exercices de notes restent accessibles.';}
}
function later(fn,delay){const id=setTimeout(fn,Math.max(0,delay));timers.push(id);}
function stopTimers(){for(const key of keys.values())key.classList.remove('demo');timers.forEach(clearTimeout);timers=[];running=false;listening=false;$('listen').textContent='Écouter';$('rhythm-start').textContent='Commencer le rythme';$('rhythm-pad').disabled=true;}
export function pausePractice(){if(running||listening){stopTimers();$('learn-feedback').textContent='Pause. Relancez l’exercice quand vous êtes prêt.';} stopMetronome();}
function stopMetronome(){clearInterval(beatTimer);beatTimer=null;$('metro').textContent='Démarrer le métronome';$('pulse').textContent='○';}
function bpm(){return Number($('tempo').value);}
function updateSummary(){const count=Object.keys(progress).length;$('saved-count').textContent=`${count} / ${totalLessons} ateliers réussis`; $('overall').value=count;
  const record=progress[lesson.id];$('best').textContent=record?`Meilleur résultat : ${record.best} % · ${record.runs} réussite(s)`:'Votre première réussite vous attend.';}
function record(){const score=Math.max(0,Math.round(100*sequence.length/(sequence.length+errors)));const old=progress[lesson.id];progress[lesson.id]={best:Math.max(old?.best||0,score),runs:(old?.runs||0)+1};
  try {storage.setItem('piano-studio-progress-v2',JSON.stringify(progress));}catch{$('save-status').textContent='Sauvegarde indisponible : les résultats restent disponibles pendant cette visite.';} updateSummary();return score;}
function updateFiche(){
  const isScale=mode==='scales';$('scale-fiche').hidden=!isScale;$('octave-fiche').hidden=mode!=='octaves';$('score-panel').hidden=mode!=='melodies';
  for(const key of keys.values())key.classList.remove('scale-note');
  if(isScale){const color=palettes[lesson.id]||defaultColors[lesson.id];$('scale-fiche').style.setProperty('--fiche-color',color);$('scale-color').value=color;$('fiche-title').textContent=lesson.title;
    $('scale-formula').textContent=lesson.id==='scale-am'?'Mineure naturelle : ton · demi-ton · ton · ton · demi-ton · ton · ton':'Majeure : ton · ton · demi-ton · ton · ton · ton · demi-ton';
    $('scale-signature').textContent=lesson.id==='scale-g'?'Armure : 1 dièse, Fa♯':lesson.id==='scale-f'?'Armure : 1 bémol, Si♭':'Armure : aucune altération';
    $('fiche-notes').replaceChildren(...lesson.notes.map(note=>{const button=document.createElement('button');button.type='button';button.textContent=labelFor(lesson,note);button.onclick=()=>sound(note,.4);button.setAttribute('aria-label',`Écouter ${labelFor(lesson,note)}`);return button;}));
    for(const [note,key] of keys){key.classList.toggle('scale-note',lesson.notes.includes(note));key.style.setProperty('--fiche-color',color);}
  }
}
function render(){
  $('learn-steps').replaceChildren(...sequence.map((note,i)=>{const li=document.createElement('li');li.className=rhythmMissed.has(i)&&mode==='rhythm'?'missed':i<position?'done':i===position?'current':'';
    li.textContent=(mode==='chords'?lesson.chords[i].map(n=>labelFor(lesson,n)).join(' · '):labelFor(lesson,note))+(i<position?(rhythmMissed.has(i)&&mode==='rhythm'?' ↻':' ✓'):'');if(i===position)li.setAttribute('aria-current','step');
    const small=document.createElement('small');small.textContent=mode==='rhythm'||mode==='melodies'?`${lesson.beats[i+scoreOffset]} temps`:mode==='scales'?`doigt ${i<8?fingers()[i]:fingers()[14-i]}`:'';li.append(small);return li;}));
  if(mode==='melodies')drawScore($('score-view'),lesson,position+scoreOffset,$('score-names').checked,scoreOffset,scoreOffset+sequence.length);
  $('learn-progress').max=sequence.length;$('learn-progress').value=position;$('learn-count').textContent=`${position} / ${sequence.length}`;
  for(const [note,key] of keys)key.classList.toggle('target',$('guide').checked&&position<sequence.length&&(mode==='chords'?lesson.chords[position]?.includes(note):note===sequence[position]));
}
function fingers(){return $('hand').value==='left'?[5,4,3,2,1,3,2,1]:lesson.fingers;}
function reset(){if(routine>=0)$('routine-next').hidden=true;stopTimers();stopMetronome();updateFiche();clearNotes();rhythmHits=new Set();rhythmMissed=new Set();position=0;errors=0;scoreOffset=0;sequence=sequenceFor(lesson,mode==='scales'?$('direction').value:'up');if(mode==='melodies'&&$('measure-range').value!=='all'){const bar=measuresFor(lesson.notes,lesson.beats)[Number($('measure-range').value)];scoreOffset=bar[0].index;sequence=bar.map(item=>item.note);}render();
  $('learn-feedback').textContent=mode==='rhythm'?'Écoutez d’abord, puis essayez en mode Découverte. Une erreur ne coupe pas l’exercice.':`À vous : ${labelFor(lesson,sequence[0])}.`;updateSummary();}
function selectLesson(){$('measure-range').value='all';lesson=lessons[mode].find(l=>l.id===$('lesson').value);$('lesson-tip').textContent=mode==='scales'&&$('hand').value==='left'?'Main gauche : commencez avec le petit doigt (5). Suivez les doigtés affichés, avec un poignet souple.':lesson.tip;$('direction-control').hidden=mode!=='scales';$('rhythm-start').hidden=mode!=='rhythm';reset();}
function switchMode(next){stopMetronome();mode=next;$('practice-mode').value=mode;$('rhythm-help').hidden=mode!=='rhythm';for(const button of document.querySelectorAll('[data-mode]'))button.setAttribute('aria-pressed',String(button.dataset.mode===mode));
  $('lesson').replaceChildren(...lessons[mode].map(l=>{const option=document.createElement('option');option.value=l.id;option.textContent=l.title;return option;}));selectLesson();}
export function handlePracticeNote(note,played=[note]){
  if(listening||position>=sequence.length)return;
  if(mode==='rhythm'&&!running)return;
  if(mode==='chords'){if(!chordMatches(played,lesson.chords[position])){$('learn-feedback').textContent='Jouez ensemble : '+lesson.chords[position].map(n=>labelFor(lesson,n)).join(' · ');return;}}
  if(mode!=='chords'&&note!==sequence[position]){errors++;$('learn-feedback').textContent=`Cherchez ${labelFor(lesson,sequence[position])}. Prenez votre temps.`;return;}
  if(mode==='rhythm'&&$('rhythm-level').value==='gentle'){const index=matchRhythmTap(performance.now()-origin,beatOffsets(lesson.beats,bpm()),bpm(),rhythmHits);if(index>=0&&!rhythmMissed.has(index)){rhythmHits.add(index);$('learn-feedback').textContent='Bien placé ! Continuez à suivre la pulsation.';}else{errors++;$('learn-feedback').textContent='Cherchez le prochain clic. L’exercice continue, tranquillement.';}return;}
  if(mode==='rhythm'){
    const expected=origin+beatOffsets(lesson.beats,bpm())[position];const result=timingResult(performance.now(),expected,bpm());
    if(!result.ok){errors++;$('learn-feedback').textContent=result.delta<0?'Un peu tôt : attendez le prochain repère.':'Un peu tard : relancez pour retrouver la pulsation.';return;}
  }
  position++;render();
  if(position===sequence.length){if(routine>=0)$('routine-next').hidden=false;stopTimers();$('learn-feedback').textContent=mode==='melodies'&&$('measure-range').value!=='all'?'Bravo ! Mesure réussie. Répétez-la ou choisissez la partition entière pour valider l’atelier.':`Bravo ! Atelier réussi · ${record()} %. Rejouez pour gagner en aisance. ♡`;}
  else $('learn-feedback').textContent=mode==='rhythm'?'Bien dans le rythme !':`Bien joué ! Maintenant : ${labelFor(lesson,sequence[position])}.`;
}
function listen(){if(listening){stopTimers();return;}reset();stopMetronome();listening=true;$('listen').textContent='Arrêter l’écoute';$('learn-feedback').textContent='Écoutez le modèle ; votre essai commence ensuite.';
  const beats=mode==='rhythm'||mode==='melodies'?lesson.beats.slice(scoreOffset,scoreOffset+sequence.length):sequence.map(()=>1),offsets=beatOffsets(beats,bpm());
  sequence.forEach((note,i)=>later(()=>{for(const n of mode==='chords'?lesson.chords[i]:[note])sound(n,Math.min(.6,beats[i]*60/bpm()*.8));for(const key of keys.values())key.classList.remove('demo');keys.get(note)?.classList.add('demo');},offsets[i]));
  later(()=>{stopTimers();for(const key of keys.values())key.classList.remove('demo');$('learn-feedback').textContent=mode==='rhythm'?'À vous : lancez le rythme.':`À vous : ${labelFor(lesson,sequence[0])}.`;},offsets.at(-1)+beats.at(-1)*60000/bpm());
}
function startRhythm(){if(running){stopTimers();$('learn-feedback').textContent='Rythme arrêté. Vous pouvez recommencer.';return;}reset();stopMetronome();running=true;$('rhythm-pad').disabled=false;$('rhythm-start').textContent='Arrêter le rythme';
  const interval=60000/bpm();origin=performance.now()+4*interval;
  for(let i=0;i<4;i++)later(()=>{sound(i===0?88:84);$('learn-feedback').textContent=`Départ dans ${4-i}…`;},i*interval);
  const offsets=beatOffsets(lesson.beats,bpm());
  if($('rhythm-level').value==='gentle'){
    offsets.forEach((offset,i)=>{later(()=>{sound(84);$('rhythm-cue').textContent=`${i+1} / ${sequence.length} · tapez ou jouez Do4`;$('rhythm-pad').classList.add('beat');later(()=>$('rhythm-pad').classList.remove('beat'),150);},4*interval+offset);
      later(()=>{if(!running)return;if(!rhythmHits.has(i))rhythmMissed.add(i);position=i+1;render();if(position===sequence.length){const hits=rhythmHits.size;errors+=rhythmMissed.size;stopTimers();$('learn-feedback').textContent=hits===sequence.length?`Bravo, toutes les attaques sont placées ! Résultat : ${record()} %.`:`${hits} / ${sequence.length} attaques placées. Essayez un peu plus lentement, sans chercher la perfection. Les repères ↻ indiquent les attaques à retravailler.`;}},4*interval+offset+Math.min(300,interval*.4)+30);});return;
  }
  // Chaque attaque a une fenêtre bornée : aucune réussite n’est attribuée à un clic tardif.
  offsets.forEach((offset,i)=>{later(()=>{sound(84);$('rhythm-cue').textContent=`Jouez Do4 · attaque ${i+1}/${sequence.length}`;},4*interval+offset);
    later(()=>{if(running&&position<=i){stopTimers();$('learn-feedback').textContent='Une attaque a été manquée. Écoutez le modèle et réessayez plus lentement.';}},4*interval+offset+Math.min(180,interval*.25)+35);});
}
export function initStudio(keyMap,clear){keys=keyMap;clearNotes=clear;
  try{storage=window.localStorage;progress=readProgress(storage);try{const saved=JSON.parse(storage.getItem('piano-studio-colors')||'{}');for(const [id,color]of Object.entries(saved||{}))if(defaultColors[id]&&/^#[0-9a-f]{6}$/i.test(color))palettes[id]=color;}catch{}}catch{progress={};}
  const section=document.querySelector('.exercise');section.setAttribute('aria-labelledby','exercise-title');section.innerHTML=`
  <div class="studio-top"><div><p class="eyebrow">VOTRE PARCOURS · UNE PETITE VICTOIRE CHAQUE JOUR</p><h2 id="exercise-title">Apprendre en jouant</h2></div><span class="version">Studio 04</span></div>
  <p>Explorez chaque atelier librement. Commencez lentement, puis cherchez la régularité.</p>
  <div class="routine"><button id="routine-start" class="secondary">✨ J’ai 5 minutes</button><span id="routine-status">Un petit parcours : notes, gamme, puis mélodie.</span><button id="routine-next" class="secondary" hidden>Étape suivante</button></div>
  <div class="mode-menu"><label for="practice-mode">Que voulez-vous travailler ?</label><select id="practice-mode"><optgroup label="Comprendre et apprendre"><option value="notes">🌈 Notes</option><option value="octaves">🎹 Octaves</option><option value="scales">🌿 Gammes</option><option value="chords">🎶 Accords</option></optgroup><optgroup label="Pratiquer en musique"><option value="rhythm">🥁 Rythme</option><option value="melodies">🎼 Partitions</option></optgroup></select></div>
  <article id="rhythm-help" class="rhythm-help" hidden><h3>Le rythme, un petit pas à la fois</h3><ol><li>Écoutez les clics sans jouer.</li><li>Dites « un, deux, trois, quatre » et tapez doucement sur votre cuisse.</li><li>Essayez le bouton ci-dessous, puis une seule touche du piano : Do4.</li></ol><label for="rhythm-level">Votre mode</label><select id="rhythm-level"><option value="gentle">Découverte · continuer après les erreurs</option><option value="challenge">Défi · précision et nouvel essai si un temps est manqué</option></select><button id="rhythm-pad" disabled>Taper la pulsation</button><p class="hint">Démarrez avec « Commencer le rythme ». Le bouton remplace Do4 ; utilisez Espace, Entrée ou votre doigt. Quatre clics vous donnent le départ. Réglez le tempo dans « Tempo et métronome ».</p></article>
  <div class="learn-controls"><div><label for="lesson">Votre atelier</label><select id="lesson"></select></div><div id="direction-control" hidden><label for="direction">Sens de la gamme</label><select id="direction"><option value="up">Montée</option><option value="round">Aller-retour</option></select></div></div>
  <article id="scale-fiche" class="scale-fiche" hidden><div class="fiche-heading"><div><p class="eyebrow">MA FICHE DE GAMME</p><h3 id="fiche-title"></h3></div><label>Ma couleur <input id="scale-color" type="color" value="#d5e9fc"></label></div><p id="scale-signature"></p><div id="fiche-notes"></div><p id="scale-formula" class="hint"></p><label for="hand">Main à travailler</label><select id="hand"><option value="right">Main droite</option><option value="left">Main gauche</option></select><p class="hint">Touchez une note de la fiche pour l’écouter. Les couleurs sont des repères personnels ; elles ne remplacent pas les noms des notes.</p></article>
  <article id="octave-fiche" class="octave-fiche" hidden><h3>Une même famille, deux hauteurs</h3><div class="octave-pair"><button id="octave-low">Écouter Do4 · grave</button><span aria-hidden="true">↗</span><button id="octave-high">Écouter Do5 · aigu</button></div><p>De Do à Do : 12 demi-tons, soit une octave. Le motif des touches se répète. Le chiffre change : Do4 et Do5 ont le même nom, mais pas la même hauteur.</p><p class="hint">Repérez les deux groupes « Octave 4 » et « Octave 5 » sur le clavier ci-dessous, puis jouez les notes demandées.</p></article>
  <section id="score-panel" class="score-panel" aria-labelledby="score-title" hidden><h3 id="score-title">Ma partition guidée</h3><label class="guide"><input id="score-names" type="checkbox" checked> Afficher le nom sous les notes</label><label for="measure-range">Passage à travailler</label><select id="measure-range"><option value="all">Partition entière</option><option value="0">Mesure 1</option><option value="1">Mesure 2</option><option value="2">Mesure 3</option><option value="3">Mesure 4</option></select><div id="score-view" class="score-view"></div><p class="hint">Clé de sol · mesure à 4 temps. La note encadrée vous attend ; les notes réussies deviennent vertes. Jouez à votre rythme : seules les hauteurs dans l’ordre sont évaluées. Choisissez une mesure pour la répéter, puis revenez à la partition entière.</p><p class="hint">Ces deux extraits sont intégrés à l’application. L’import MusicXML/PDF n’est pas encore disponible.</p></section>
  <p id="lesson-tip" class="lesson-tip"></p><label class="guide"><input id="guide" type="checkbox" checked> Montrer la prochaine touche</label>
  <ol id="learn-steps" aria-label="Notes à jouer"></ol><div class="progress-label"><label for="learn-progress">Votre essai</label><span id="learn-count"></span></div><progress id="learn-progress" max="8" value="0"></progress>
  <p id="learn-feedback" role="status" aria-live="polite"></p><p id="rhythm-cue" aria-live="off"></p>
  <div class="practice-actions"><button id="listen" class="secondary">Écouter</button><button id="rhythm-start" class="primary" hidden>Commencer le rythme</button><button id="learn-reset" class="secondary">Recommencer</button></div>
  <details class="tempo-panel"><summary>Tempo et métronome</summary><label for="tempo">Tempo : <output id="tempo-value">60</output> battements / minute</label><input id="tempo" type="range" min="40" max="140" step="5" value="60"><div class="practice-actions"><button id="metro" class="secondary">Démarrer le métronome</button><span id="pulse" aria-hidden="true">○</span></div><p class="hint">Le clic est sonore, même si le son du clavier est coupé. Le rythme évalue les attaques, pas la durée tenue. Le MIDI et le navigateur peuvent ajouter un léger délai.</p></details>
  <div class="saved"><strong id="saved-count"></strong><progress id="overall" max="${totalLessons}" value="0" aria-label="Ateliers réussis"></progress><p id="best"></p><p id="save-status" class="hint">Résultats enregistrés sur ce navigateur uniquement, sans compte ni synchronisation.</p></div>
  <details class="basics"><summary>Les petits repères pour bien commencer</summary><div class="basics-grid"><article><h3>Une pratique douce</h3><p>Asseyez-vous face au clavier, épaules relâchées, poignets souples. Jouez sans forcer et faites une pause si vous ressentez une douleur.</p></article><article><h3>Les doigts</h3><p>1 = pouce · 2 = index · 3 = majeur · 4 = annulaire · 5 = auriculaire. Les doigtés de gamme proposés sont ceux de la main droite.</p></article><article><h3>Le rythme</h3><p>Noire = 1 temps, blanche = 2 temps, croche = ½ temps. La pulsation est votre repère régulier ; les notes se placent autour.</p></article><article><h3>Lire et écouter</h3><p>Do Ré Mi Fa Sol La Si, puis Do à l’octave. ♯ monte d’un demi-ton, ♭ descend d’un demi-ton. Une même touche peut avoir deux noms : La♯ = Si♭.</p></article><article><h3>Votre routine · 10 minutes</h3><p>2 minutes de repérage, 3 de gamme, 2 de rythme, 3 de mélodie. Choisissez un tempo confortable. La régularité compte plus que la vitesse.</p></article></div></details>`;
  document.querySelectorAll('[data-mode]').forEach(button=>button.onclick=()=>{routine=-1;$('routine-next').hidden=true;$('routine-status').textContent='Un petit parcours : notes, gamme, puis mélodie.';switchMode(button.dataset.mode);});$('lesson').onchange=selectLesson;$('direction').onchange=reset;$('guide').onchange=render;$('learn-reset').onclick=reset;$('listen').onclick=listen;$('rhythm-start').onclick=startRhythm;
  $('practice-mode').onchange=()=>{routine=-1;$('routine-next').hidden=true;$('routine-status').textContent='Un petit parcours : notes, gamme, puis mélodie.';switchMode($('practice-mode').value);};$('rhythm-level').onchange=reset;$('rhythm-pad').onclick=()=>handlePracticeNote(60);
  $('tempo').oninput=()=>{$('tempo-value').textContent=$('tempo').value;pausePractice();};
  $('metro').onclick=()=>{if(beatTimer){stopMetronome();return;}stopTimers();tick=0;const click=()=>{sound(tick%4===0?88:84);$('pulse').textContent=`${tick%4+1} ●`;tick++;};click();beatTimer=setInterval(click,60000/bpm());$('metro').textContent='Arrêter le métronome';};
  section.querySelector('.practice-actions').before(document.querySelector('.instrument'));
  $('hand').onchange=()=>{selectLesson();};$('score-names').onchange=render;$('measure-range').onchange=reset;
  $('scale-color').oninput=()=>{palettes[lesson.id]=$('scale-color').value;updateFiche();try{storage.setItem('piano-studio-colors',JSON.stringify(palettes));}catch{$('save-status').textContent='Couleur conservée pendant cette visite uniquement.';}};
  $('octave-low').onclick=()=>sound(60,.6);$('octave-high').onclick=()=>sound(72,.6);
  const routineStep=()=>{const modes=['notes','scales','melodies'];$('routine-next').hidden=true;switchMode(modes[routine]);$('routine-status').textContent=`Étape ${routine+1}/3 · ${['Retrouver les notes','Jouer Do majeur','Lire une petite mélodie'][routine]}. Durée libre, environ 5 minutes en tout.`;};
  $('routine-start').onclick=()=>{routine=0;routineStep();};$('routine-next').onclick=()=>{if(routine<2){routine++;routineStep();}else{routine=-1;$('routine-next').hidden=true;$('routine-status').textContent='Votre petit parcours est terminé. Bravo pour ce moment de piano !';}};
  switchMode('notes');if(!storage)$('save-status').textContent='Sauvegarde indisponible : résultats conservés pendant cette visite.';
}
