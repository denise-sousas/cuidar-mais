const test = require('node:test');
const assert = require('node:assert/strict');
const { hojeISO, horaAtual, agoraSQL, adicionarDias, minutosDoDia } = require('../src/utils/datas');

test('adicionarDias atravessa mês e ano', () => {
  assert.equal(adicionarDias('2026-10-31', 1), '2026-11-01');
  assert.equal(adicionarDias('2026-12-31', 1), '2027-01-01');
  assert.equal(adicionarDias('2026-03-01', -1), '2026-02-28');
});

test('fuso de São Paulo (UTC-3)', () => {
  const instante = new Date('2026-10-27T01:30:00Z'); // 22:30 do dia 26 em São Paulo
  assert.equal(hojeISO(instante), '2026-10-26');
  assert.equal(horaAtual(instante), '22:30:00');
  assert.equal(agoraSQL(instante), '2026-10-26 22:30:00');
});

test('minutosDoDia', () => {
  assert.equal(minutosDoDia('08:30:00'), 510);
  assert.equal(minutosDoDia('00:00'), 0);
});
