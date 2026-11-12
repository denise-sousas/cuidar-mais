// Regras de negócio: consultas, exames e compromissos.
const AppError = require('../utils/AppError');
const { validar } = require('../utils/validadores');
const { lerEnumOpcional } = require('../utils/parametros');
const consultaRepository = require('../repositories/consultaRepository');

const ESQUEMA = {
  titulo: { rotulo: 'Título', tipo: 'texto', obrigatorio: true, min: 2, max: 100 },
  local: { rotulo: 'Local', tipo: 'texto', max: 150 },
  data: { rotulo: 'Data', tipo: 'data', obrigatorio: true },
  horario: { rotulo: 'Horário', tipo: 'hora', obrigatorio: true },
  descricao: { rotulo: 'Descrição', tipo: 'texto', max: 2000 },
  realizada: { rotulo: 'Realizada', tipo: 'booleano', padrao: false },
};

const listar = (idosoId, query) =>
  consultaRepository.listar(idosoId, lerEnumOpcional(query.situacao, ['pendentes', 'realizadas'], 'situacao'));

async function obter(idosoId, id) {
  const consulta = await consultaRepository.buscar(idosoId, id);
  if (!consulta) throw new AppError(404, 'Consulta não encontrada.');
  return consulta;
}

async function criar(idosoId, usuario, corpo) {
  const id = await consultaRepository.criar(idosoId, validar(corpo, ESQUEMA), usuario.id);
  return obter(idosoId, id);
}

async function atualizar(idosoId, id, corpo) {
  await obter(idosoId, id);
  await consultaRepository.atualizar(idosoId, id, validar(corpo, ESQUEMA));
  return obter(idosoId, id);
}

async function marcarRealizada(idosoId, id, corpo) {
  await obter(idosoId, id);
  const { realizada } = validar(corpo, { realizada: { rotulo: 'Realizada', tipo: 'booleano', padrao: true } });
  await consultaRepository.definirRealizada(idosoId, id, realizada);
  return obter(idosoId, id);
}

async function excluir(idosoId, id) {
  await obter(idosoId, id);
  await consultaRepository.excluir(idosoId, id);
}

module.exports = { listar, obter, criar, atualizar, marcarRealizada, excluir };
