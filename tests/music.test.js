import test from 'node:test';
import assert from 'node:assert/strict';
import {parseMidi, advance, scale, noteName} from '../music.js';
test('note-on, note-off, vélocité zéro et canaux', () => {
  assert.deepEqual(parseMidi([0x92,60,100]),{note:60,channel:2,on:true});
  assert.equal(parseMidi([0x82,60,64]).on,false);
  assert.equal(parseMidi([0x92,60,0]).on,false);
  assert.equal(parseMidi([0xb0,64,127]),null);
  assert.equal(parseMidi([0x90,60]),null);
});
test('gamme : erreurs sans progression, huit notes puis fin stable', () => {
  assert.equal(advance(0,61),0);
  let position = 0; for (const note of scale) position = advance(position,note);
  assert.equal(position,8); assert.equal(advance(position,60),8);
  assert.equal(noteName(60),'Do4'); assert.equal(noteName(0),'Do-1'); assert.equal(noteName(127),'Sol9');
});
