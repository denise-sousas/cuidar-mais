// Regras de negócio: registros avulsos (alimentação, hidratação, higiene, atividade física).
const AppError = require('../utils/AppError');
const { validar } = require('../utils/validadores');
const { lerData, lerEnumOpcional } = require('../utils/parametros');
const { agoraSQL } = require('../utils/datas');
const registroRepository = require('../repositories/registroRepository');

const TIPOS = ['alimentacao', 'hidratacao', 'higiene', 'atividade_fisica', 'outro'];

const ESQUEMA = {
  tipo: { rotulo: 'Tipo', tipo: 'enum', opcoes: TIPOS, obrigatorio: true },
  descricao: { rotulo: 'Descrição', tipo: 'texto', max: 255 },
  quantidadeMl: { rotulo: 'Quantidade', tipo: 'inteiro', min: 1, max: 3000 },
  dataHora: { rotulo: 'Data e hora', tipo: 'dataHora' },
};

function prepararDados(corpo) {
  const dados = validar(corpo, ESQUEMA);
  const erros = {};

  if (dados.tipo === 'hidratacao') {
    if (!dados.quantidadeMl) erros.quantidadeMl = 'Informe a quantidade em ml.';
  } else {
    dados.quantidadeMl = null;
    if (!dados.descricao) erros.descricao = 'Descreva o que foi realizado.';
  }
  if (Object.keys(erros).length > 0) throw new AppError(400, 'Dados inválidos.', erros);

  dados.dataHora = dados.dataHora || agoraSQL();
  // Tolerância de 10 minutos para diferenças de relógio entre aparelhos.
  const limite = `${agoraSQL().slice(0, 16)}:59`;
  if (dados.dataHora > adicionarMinutosTexto(limite, 10)) {
    throw new AppError(400, 'Dados inválidos.', { dataHora: 'O registro não pode estar no futuro.' });
  }
  return dados;
}

// Soma minutos a "AAAA-MM-DD HH:mm:ss" (sem depender do fuso do servidor).
function adicionarMinutosTexto(texto, minutos) {
  const data = new Date(`${texto.replace(' ', 'T')}Z`);
  data.setUTCMinutes(data.getUTCMinutes() + minutos);
  return data.toISOString().slice(0, 19).replace('T', ' ');
}

const listar = (idosoId, query) =>
  registroRepository.listar(idosoId, {
    data: lerData(query.data),
    tipo: lerEnumOpcional(query.tipo, TIPOS, 'tipo'),
  });

async function obter(idosoId, id) {
  const registro = await registroRepository.buscar(idosoId, id);
  if (!registro) throw new AppError(404, 'Registro não encontrado.');
  return registro;
}

async function criar(idosoId, usuario, corpo) {
  const id = await registroRepository.criar(idosoId, prepararDados(corpo), usuario.id);
  return obter(idosoId, id);
}

async function atualizar(idosoId, id, corpo) {
  await obter(idosoId, id);
  await registroRepository.atualizar(idosoId, id, prepararDados(corpo));
  return obter(idosoId, id);
}

async function excluir(idosoId, id) {
  await obter(idosoId, id);
  await registroRepository.excluir(idosoId, id);
}

async function resumo(idosoId, dataParametro) {
  const data = lerData(dataParametro);
  const linhas = await registroRepository.resumoDoDia(idosoId, data);
  const total = (tipo) => Number(linhas.find((l) => l.tipo === tipo)?.total || 0);
  return {
    data,
    aguaMl: Number(linhas.find((l) => l.tipo === 'hidratacao')?.ml || 0),
    hidratacoes: total('hidratacao'),
    refeicoes: total('alimentacao'),
    higiene: total('higiene'),
    atividadesFisicas: total('atividade_fisica'),
  };
}

module.exports = { TIPOS, listar, obter, criar, atualizar, excluir, resumo };
