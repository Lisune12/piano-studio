export const names = ['Do','Do♯','Ré','Ré♯','Mi','Fa','Fa♯','Sol','Sol♯','La','La♯','Si'];
export const scale = [60,62,64,65,67,69,71,72];
export const noteName = note => `${names[note % 12]}${Math.floor(note / 12) - 1}`;
// Les messages MIDI transportent le canal dans les quatre bits de poids faible.
export function parseMidi(data) {
  if (!data || data.length < 3) return null;
  const [status, note, velocity] = data;
  if (note > 127 || velocity > 127) return null;
  const command = status & 0xf0;
  if (command !== 0x90 && command !== 0x80) return null;
  return {note, channel: status & 15, on: command === 0x90 && velocity > 0};
}
export function advance(index, note) { return index < scale.length && note === scale[index] ? index + 1 : index; }
