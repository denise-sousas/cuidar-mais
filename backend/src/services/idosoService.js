// Regras de negócio: cadastro do idoso e vínculo de cuidadores/familiares.
const crypto = require('crypto');
const AppError = require('../utils/AppError');
const { validar } = require('../utils/validadores');
const { transacao } = require('../config/database');
const idosoRepository = require('../repositories/idosoRepository');

const ESQUEMA = {
  nome: { rotulo: 'Nome', tipo: 'texto', obrigatorio: true, min: 3, max: 100 },
  dataNascimento: { rotulo: 'Data de nascimento', tipo: 'data', obrigatorio: true, naoFutura: true },
  cpf: { rotulo: 'CPF', tipo: 'cpf' },
  telefone: { rotulo: 'Telefone', tipo: 'telefone' },
  endereco: { rotulo: 'Endereço', tipo: 'texto', max: 255 },
  observacoes: { rotulo: 'Observações', tipo: 'texto', max: 2000 },
};

const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sem letras/números parecidos (0/O, 1/I)

async function gerarCodigoUnico() {
  for (let tentativa = 0; tentativa < 10; tentativa += 1) {
    let sufixo = '';
    for (let i = 0; i < 6; i += 1) sufixo += ALFABETO[crypto.randomInt(ALFABETO.length)];
    const codigo = `CUIDAR-${sufixo}`;
    if (!(await idosoRepository.buscarPorCodigo(codigo))) return codigo;
  }
  throw new AppError(500, 'Não foi possível gerar o código de vínculo. Tente novamente.');
}

// Familiares não veem o código de vínculo (só quem cuida pode convidar pessoas).
function apresentar(idoso, papel) {
  const { codigoVinculo, ...dados } = idoso;
  return papel === 'cuidador' ? { ...dados, codigoVinculo, papel } : { ...dados, papel };
}

async function garantirCpfLivre(cpf, idosoIdAtual) {
  if (!cpf) return;
  const existente = await idosoRepository.buscarPorCpf(cpf);
  if (existente && existente.id !== idosoIdAtual) {
    throw new AppError(409, 'Já existe um idoso cadastrado com este CPF.', { cpf: 'CPF já cadastrado.' });
  }
}

async function listar(usuario) {
  const idosos = await idosoRepository.listarDoUsuario(usuario.id);
  return idosos.map(({ papel, ...idoso }) => apresentar(idoso, papel));
}

async function obter(idosoId, papel) {
  const idoso = await idosoRepository.buscarPorId(idosoId);
  if (!idoso) throw new AppError(404, 'Idoso não encontrado.');
  return apresentar(idoso, papel);
}

async function criar(usuario, corpo) {
  const dados = validar(corpo, ESQUEMA);
  await garantirCpfLivre(dados.cpf, null);
  const codigoVinculo = await gerarCodigoUnico();

  // Transação: o idoso e o vínculo do cuidador criador são gravados juntos.
  const id = await transacao(async (db) => {
    const novoId = await idosoRepository.criar({ ...dados, codigoVinculo, criadoPor: usuario.id }, db);
    await idosoRepository.criarVinculo(usuario.id, novoId, 'cuidador', db);
    return novoId;
  });

  return obter(id, 'cuidador');
}

async function atualizar(idosoId, corpo) {
  const dados = validar(corpo, ESQUEMA);
  await garantirCpfLivre(dados.cpf, idosoId);
  await idosoRepository.atualizar(idosoId, dados);
  return obter(idosoId, 'cuidador');
}

async function excluir(idosoId, usuario) {
  const idoso = await idosoRepository.buscarPorId(idosoId);
  if (!idoso) throw new AppError(404, 'Idoso não encontrado.');
  if (idoso.criadoPor !== usuario.id) {
    throw new AppError(403, 'Somente quem cadastrou o idoso pode excluí-lo.');
  }
  await idosoRepository.excluir(idosoId); // as FKs com ON DELETE CASCADE apagam os registros ligados
}

async function gerarNovoCodigo(idosoId) {
  const codigo = await gerarCodigoUnico();
  await idosoRepository.atualizarCodigo(idosoId, codigo);
  return { codigoVinculo: codigo };
}

// Cuidador ou familiar entra no acompanhamento de um idoso usando o código.
async function vincular(usuario, corpo) {
  const { codigo } = validar(corpo, { codigo: { rotulo: 'Código', tipo: 'texto', obrigatorio: true, max: 20 } });
  const idoso = await idosoRepository.buscarPorCodigo(codigo.toUpperCase());
  if (!idoso) throw new AppError(404, 'Código de vínculo inválido.', { codigo: 'Código de vínculo inválido.' });

  if (await idosoRepository.buscarVinculo(usuario.id, idoso.id)) {
    throw new AppError(409, 'Você já está vinculado a este idoso.');
  }

  await idosoRepository.criarVinculo(usuario.id, idoso.id, usuario.perfil);
  return obter(idoso.id, usuario.perfil);
}

const listarVinculos = (idosoId) => idosoRepository.listarVinculos(idosoId);

// Cuidador remove qualquer pessoa; qualquer pessoa pode sair por conta própria.
async function removerVinculo(idoso, usuario, usuarioAlvoId) {
  const proprioUsuario = usuarioAlvoId === usuario.id;
  if (!proprioUsuario && idoso.papel !== 'cuidador') {
    throw new AppError(403, 'Apenas cuidadores podem remover outras pessoas.');
  }

  const vinculo = await idosoRepository.buscarVinculo(usuarioAlvoId, idoso.id);
  if (!vinculo) throw new AppError(404, 'Vínculo não encontrado.');

  if (vinculo.papel === 'cuidador' && (await idosoRepository.contarCuidadores(idoso.id)) <= 1) {
    throw new AppError(409, 'O idoso precisa ter ao menos um cuidador vinculado.');
  }
  await idosoRepository.removerVinculo(usuarioAlvoId, idoso.id);
}

module.exports = { listar, obter, criar, atualizar, excluir, gerarNovoCodigo, vincular, listarVinculos, removerVinculo };
