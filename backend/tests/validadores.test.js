const test = require('node:test');
const assert = require('node:assert/strict');
const { validar, cpfValido, normalizarHora, normalizarHorarios } = require('../src/utils/validadores');

test('cpfValido aceita CPF válido e rejeita inválidos', () => {
  assert.equal(cpfValido('529.982.247-25'), true);
  assert.equal(cpfValido('52998224725'), true);
  assert.equal(cpfValido('111.111.111-11'), false);
  assert.equal(cpfValido('529.982.247-24'), false);
  assert.equal(cpfValido('123'), false);
});

test('normalizarHora', () => {
  assert.equal(normalizarHora('08:30'), '08:30:00');
  assert.equal(normalizarHora('23:59:10'), '23:59:10');
  assert.equal(normalizarHora('24:00'), null);
  assert.equal(normalizarHora('8:00'), null);
});

test('normalizarHorarios remove repetidos e ordena', () => {
  assert.deepEqual(normalizarHorarios(['20:00', '08:00', '08:00:00']), ['08:00:00', '20:00:00']);
  assert.throws(() => normalizarHorarios([]), /inválidos/);
  assert.throws(() => normalizarHorarios(['xx']), /inválidos/);
});

test('validar limpa e converte campos', () => {
  const dados = validar(
    { nome: '  Maria  ', email: 'MARIA@Email.com', cpf: '52998224725', telefone: '62999998888', idade: '70', ativo: 'true' },
    {
      nome: { rotulo: 'Nome', tipo: 'texto', obrigatorio: true, min: 3 },
      email: { rotulo: 'E-mail', tipo: 'email', obrigatorio: true },
      cpf: { rotulo: 'CPF', tipo: 'cpf' },
      telefone: { rotulo: 'Telefone', tipo: 'telefone' },
      idade: { rotulo: 'Idade', tipo: 'inteiro', min: 0, max: 130 },
      ativo: { rotulo: 'Ativo', tipo: 'booleano' },
      endereco: { rotulo: 'Endereço', tipo: 'texto' },
    }
  );
  assert.deepEqual(dados, {
    nome: 'Maria',
    email: 'maria@email.com',
    cpf: '529.982.247-25',
    telefone: '(62) 99999-8888',
    idade: 70,
    ativo: true,
    endereco: null,
  });
});

test('validar reporta erros por campo', () => {
  try {
    validar({ email: 'x', senha: '123' }, {
      nome: { rotulo: 'Nome', tipo: 'texto', obrigatorio: true },
      email: { rotulo: 'E-mail', tipo: 'email', obrigatorio: true },
      senha: { rotulo: 'Senha', tipo: 'texto', min: 8 },
    });
    assert.fail('deveria lançar erro');
  } catch (erro) {
    assert.equal(erro.status, 400);
    assert.deepEqual(Object.keys(erro.detalhes).sort(), ['email', 'nome', 'senha']);
  }
});

test('validar não apaga senha com espaços quando semTrim', () => {
  const dados = validar({ senha: ' abc12345 ' }, { senha: { rotulo: 'Senha', tipo: 'texto', semTrim: true } });
  assert.equal(dados.senha, ' abc12345 ');
});

test('validar booleano false não é tratado como vazio', () => {
  const dados = validar({ ativo: false }, { ativo: { rotulo: 'Ativo', tipo: 'booleano', obrigatorio: true } });
  assert.equal(dados.ativo, false);
});

test('CPFs usados no seed e na documentação são válidos', () => {
  ['529.982.247-25', '111.444.777-35', '123.456.789-09'].forEach((cpf) => assert.equal(cpfValido(cpf), true));
});
