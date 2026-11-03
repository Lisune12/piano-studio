import test from 'node:test';
import assert from 'node:assert/strict';
import {lessons,sequenceFor,beatOffsets,timingResult,readProgress,labelFor} from '../learning.js';
test('gammes et doigtés aller-retour',()=>{for(const l of lessons.scales){const seq=sequenceFor(l,'round');assert.equal(seq.length,15);assert.equal(seq[0],seq.at(-1));assert.equal(l.fingers.length,8);assert.ok(seq.every(n=>n>=60&&n<=83));}assert.equal(labelFor(lessons.scales[2],70),'Si♭4');});
test('durées de mélodie et rythme cohérentes',()=>{for(const l of [...lessons.melodies,...lessons.rhythm]){assert.equal(sequenceFor(l).length,l.beats.length);assert.ok(l.beats.every(b=>b>0));}assert.deepEqual(beatOffsets([1,.5,2],60),[0,1000,1500]);});
test('fenêtre rythmique et erreurs tôt/tard',()=>{assert.equal(timingResult(1100,1000,60).ok,true);assert.equal(timingResult(700,1000,60).ok,false);assert.equal(timingResult(1400,1000,60).ok,false);});
test('sauvegarde absente, invalide et filtrée',()=>{const store=value=>({getItem:()=>value});assert.deepEqual(readProgress(store('oops')),{});assert.deepEqual(readProgress(store('null')),{});assert.deepEqual(readProgress(store('{"scale-c":{"best":90,"runs":1},"bogus":{"best":100,"runs":1}}')),{'scale-c':{best:90,runs:1}});});
