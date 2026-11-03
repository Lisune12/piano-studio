// Capture les notes par source afin de conserver aussi les accords et les durées.
export class NoteRecorder {
  constructor(){this.active=false;this.pending=new Map();this.notes=[];}
  start(now){this.active=true;this.origin=now;this.pending.clear();this.notes=[];}
  on(source,note,now){if(this.active&&!this.pending.has(source))this.pending.set(source,{note,start:Math.max(0,now-this.origin)});}
  off(source,now){const item=this.pending.get(source);if(!item)return;this.pending.delete(source);if(this.notes.length<1000)this.notes.push({...item,duration:Math.max(30,Math.min(180000,now-this.origin)-item.start)});}
  stop(now){for(const source of [...this.pending.keys()])this.off(source,now);this.active=false;return this.notes.sort((a,b)=>a.start-b.start);}
}
export function validTake(value){return Array.isArray(value)&&value.length<=1000&&value.every(n=>Number.isInteger(n.note)&&n.note>=0&&n.note<=127&&Number.isFinite(n.start)&&n.start>=0&&n.start<=180000&&Number.isFinite(n.duration)&&n.duration>=0&&n.duration<=180000&&n.start+n.duration<=180100);}
function vlq(value){let out=[value&127];while(value>>=7)out.unshift((value&127)|128);return out;}
export function midiBytes(notes){
  const events=notes.flatMap(n=>[{time:Math.round(n.start*.96),on:true,note:n.note},{time:Math.round((n.start+n.duration)*.96),on:false,note:n.note}]).sort((a,b)=>a.time-b.time||Number(a.on)-Number(b.on));
  // Format 0, 480 ticks/noire et tempo 120 BPM : 0,96 tick par milliseconde.
  let previous=0;const track=[0,255,81,3,7,161,32];for(const e of events){track.push(...vlq(Math.max(0,e.time-previous)),e.on?144:128,e.note,e.on?80:0);previous=e.time;}track.push(0,255,47,0);
  const length=track.length;return new Uint8Array([77,84,104,100,0,0,0,6,0,0,0,1,1,224,77,84,114,107,(length>>>24)&255,(length>>>16)&255,(length>>>8)&255,length&255,...track]);
}
