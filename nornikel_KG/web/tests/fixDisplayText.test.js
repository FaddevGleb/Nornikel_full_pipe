import test from 'node:test';
import assert from 'node:assert/strict';
import { fixDisplayText } from '../shared/fixDisplayText.js';

test('fixes CP866 box-drawing mojibake from graph JSON', () => {
  const sample =
    '╨Ю╤З╨╕╤Б╤В╨║╨░ ╨╕ ╨║╨╛╨╜╤В╤А╨╛╨╗╤М ╤Б╤В╨╛╤З╨╜╤Л╤Е ╨▓╨╛╨┤ ╨┐╤А╨╡╨┤╨┐╤А╨╕╤П╤В╨╕╨╣ ╤Ж╨▓╨╡╤В╨╜╨╛╨╣ ╨╝╨╡╤В╨░╨╗╨╗╤Г╤А╨│╨╕╨╕';
  const fixed = fixDisplayText(sample);
  assert.match(fixed, /Очистка и контроль сточных вод/);
  assert.match(fixed, /цветной металлургии/);
  assert.doesNotMatch(fixed, /╨/);
});

test('fixes Latin-1 mojibake', () => {
  const sample = Buffer.from('Материал', 'utf8').toString('latin1');
  assert.equal(fixDisplayText(sample), 'Материал');
});

test('leaves valid Cyrillic unchanged', () => {
  const sample = 'Очистка и контроль сточных вод';
  assert.equal(fixDisplayText(sample), sample);
});

test('leaves ASCII unchanged', () => {
  const sample = 'Nickel sulfide flotation';
  assert.equal(fixDisplayText(sample), sample);
});
