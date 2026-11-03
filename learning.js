import {noteName} from './music.js';
export const lessons = {
  notes: [
    {id:'notes-white', title:'Les sept notes', notes:[60,64,67,62,65,69,71], tip:'Repérez les groupes de deux touches noires : le Do est juste à leur gauche. Retrouvez chaque note demandée.'},
    {id:'notes-sharp', title:'Découvrir les dièses', notes:[61,63,66,68,70], tip:'Un dièse (♯) monte la note d’un demi-ton : c’est la touche immédiatement à droite, blanche ou noire.'}
  ],
  octaves: [
    {id:'octaves-pairs',title:'Une note, deux octaves',notes:[60,72,62,74,64,76,65,77,67,79],tip:'Une octave sépare deux notes de même nom. Jouez la note grave puis son écho aigu : Do4 puis Do5, Ré4 puis Ré5…'},
    {id:'octaves-find',title:'Grave ou aigu ?',notes:[76,60,79,65,72,62,77,67],tip:'Le nom ne suffit pas : observez aussi le numéro d’octave. La même note une octave plus haut possède une fréquence deux fois plus élevée.'}
  ],
  scales: [
    {id:'scale-c',title:'Do majeur',notes:[60,62,64,65,67,69,71,72],fingers:[1,2,3,1,2,3,4,5],tip:'Aucune touche noire. Main droite : passez doucement le pouce sous le majeur entre Mi et Fa.'},
    {id:'scale-g',title:'Sol majeur',notes:[67,69,71,72,74,76,78,79],fingers:[1,2,3,1,2,3,4,5],tip:'Un dièse : Fa♯. Gardez le poignet souple et cherchez un son régulier.'},
    {id:'scale-f',title:'Fa majeur',notes:[65,67,69,70,72,74,76,77],labels:{70:'Si♭4'},fingers:[1,2,3,4,1,2,3,4],tip:'Un bémol : Si♭, la même touche que La♯. Main droite : passez le pouce après le quatrième doigt.'},
    {id:'scale-am',title:'La mineur naturelle',notes:[69,71,72,74,76,77,79,81],fingers:[1,2,3,1,2,3,4,5],tip:'Les mêmes touches blanches que Do majeur, en commençant sur La. Écoutez sa couleur différente.'}
  ],
  melodies: [
    {id:'song-twinkle',title:'Ah ! vous dirai-je, maman',notes:[60,60,67,67,69,69,67,65,65,64,64,62,62,60],beats:[1,1,1,1,1,1,2,1,1,1,1,1,1,2],tip:'Première phrase traditionnelle. Répétez les notes en les relâchant entre chaque attaque. Les nombres indiquent les temps ; ce mode vérifie les hauteurs, à votre rythme.'},
    {id:'song-joy',title:'Ode à la joie · début',notes:[64,64,65,67,67,65,64,62,60,60,62,64,64,62,62],beats:[1,1,1,1,1,1,1,1,1,1,1,1,1.5,.5,2],tip:'Début du thème de Beethoven. Écoutez la démonstration, puis retrouvez les notes. Ce mode vérifie les hauteurs, pas encore les durées.'}
  ],
  rhythm: [
    {id:'rhythm-quarter',title:'La pulsation · noires',beats:[1,1,1,1,1,1,1,1],tip:'Une noire dure un temps. Après quatre clics de départ, jouez huit Do4, un par temps.'},
    {id:'rhythm-half',title:'Noires et blanches',beats:[1,1,2,1,1,2],tip:'Une blanche dure deux temps. Suivez les attaques : Do, Do, Do tenu deux temps. La durée de maintien n’est pas évaluée.'},
    {id:'rhythm-eighth',title:'Premières croches',beats:[.5,.5,1,.5,.5,1,1,1],tip:'Deux croches partagent un temps : comptez « un et deux ». Écoutez avant de commencer.'}
  ]
};
export function sequenceFor(lesson, direction='up') {
  const notes = lesson.notes || Array(lesson.beats.length).fill(60);
  return direction === 'round' ? [...notes,...notes.slice(0,-1).reverse()] : [...notes];
}
export const labelFor = (lesson,note) => lesson.labels?.[note] || noteName(note);
export function beatOffsets(beats,bpm) {
  let total=0; return beats.map(beat=>{const time=total*60000/bpm;total+=beat;return time;});
}
export function timingResult(actual,expected,bpm) {
  const delta=actual-expected;
  return {ok:Math.abs(delta)<=Math.min(180,60000/bpm*.25),delta};
}
export function readProgress(storage) {
  try { const value=JSON.parse(storage.getItem('piano-studio-progress-v2') || '{}');
    if (!value || typeof value!=='object' || Array.isArray(value)) return {};
    return Object.fromEntries(Object.entries(value).filter(([id,v])=>Object.values(lessons).flat().some(l=>l.id===id) && v && Number.isInteger(v.best) && v.best>=0 && v.best<=100 && Number.isInteger(v.runs) && v.runs>0));
  } catch {return {};}
}
