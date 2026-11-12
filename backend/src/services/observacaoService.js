// Regras de negócio: observações e ocorrências do dia a dia.
const AppError = require('../utils/AppError');
const { validar } = require('../utils/validadores');
const { lerEnumOpcional } = require('../utils/parametros');
const { agoraSQL } = require('../utils/datas');
const observacaoRepository = require('../repositories/observacaoRepository');

const CATEGORIAS = ['saude', 'comportamento', 'alimentacao', 'sono', 'consulta', 'outro'];

const ESQUEMA = {
  titulo: { rotulo: 'Título', tipo: 'texto', obrigatorio: true, min: 2, max: 100 },
  categoria: { rotulo: 'Categoria', tipo: 'enum', opcoes: CATEGORIAS, padrao: 'outro' },
  texto: { rotulo: 'Observação', tipo: 'texto', obrigatorio: true, max: 2000 },
  dataHora: { rotulo: 'Data e hora', tipo: 'dataHora' },
};

const listar = (idosoId, query) =>
  observacaoRepository.listar(idosoId, lerEnumOpcional(query.categoria, CATEGORIAS, 'categoria'));

async function obter(idosoId, id) {
  const observacao = await observacaoRepository.buscar(idosoId, id);
  if (!observacao) throw new AppError(404, 'Observação não encontrada.');
  return observacao;
}

function preparar(corpo) {
  const dados = validar(corpo, ESQUEMA);
  return { ...dados, dataHora: dados.dataHora || agoraSQL() };
}

async function criar(idosoId, usuario, corpo) {
  const id = await observacaoRepository.criar(idosoId, preparar(corpo), usuario.id);
  return obter(idosoId, id);
}

async function atualizar(idosoId, id, corpo) {
  await obter(idosoId, id);
  await observacaoRepository.atualizar(idosoId, id, preparar(corpo));
  return obter(idosoId, id);
}

async function excluir(idosoId, id) {
  await obter(idosoId, id);
  await observacaoRepository.excluir(idosoId, id);
}

module.exports = { CATEGORIAS, listar, obter, criar, atualizar, excluir };
