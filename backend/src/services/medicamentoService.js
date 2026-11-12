// Regras de negócio: medicamentos, horários e registro de doses administradas.
// O Cuidar+ apenas ORGANIZA e REGISTRA; não define nem altera tratamento.
const AppError = require('../utils/AppError');
const { validar, normalizarHorarios, normalizarHora } = require('../utils/validadores');
const { lerData } = require('../utils/parametros');
const { hojeISO, agoraSQL } = require('../utils/datas');
const { transacao } = require('../config/database');
const medicamentoRepository = require('../repositories/medicamentoRepository');

const ESQUEMA = {
  nome: { rotulo: 'Nome do medicamento', tipo: 'texto', obrigatorio: true, min: 2, max: 100 },
  dosagem: { rotulo: 'Dosagem', tipo: 'texto', max: 50 },
  via: { rotulo: 'Via de administração', tipo: 'texto', max: 50 },
  observacoes: { rotulo: 'Observações', tipo: 'texto', max: 1000 },
  ativo: { rotulo: 'Situação', tipo: 'booleano', padrao: true },
};

const listar = (idosoId) => medicamentoRepository.listar(idosoId);

async function obter(idosoId, id) {
  const medicamento = await medicamentoRepository.buscar(idosoId, id);
  if (!medicamento) throw new AppError(404, 'Medicamento não encontrado.');
  return medicamento;
}

async function criar(idosoId, corpo) {
  const dados = validar(corpo, ESQUEMA);
  const horarios = normalizarHorarios(corpo.horarios);

  const id = await transacao(async (db) => {
    const novoId = await medicamentoRepository.criar(idosoId, dados, db);
    await medicamentoRepository.substituirHorarios(novoId, horarios, db);
    return novoId;
  });
  return obter(idosoId, id);
}

async function atualizar(idosoId, id, corpo) {
  await obter(idosoId, id);
  const dados = validar(corpo, ESQUEMA);
  const horarios = normalizarHorarios(corpo.horarios);

  await transacao(async (db) => {
    await medicamentoRepository.atualizar(idosoId, id, dados, db);
    await medicamentoRepository.substituirHorarios(id, horarios, db);
  });
  return obter(idosoId, id);
}

async function excluir(idosoId, id) {
  await obter(idosoId, id);
  await medicamentoRepository.excluir(idosoId, id);
}

async function agenda(idosoId, dataParametro) {
  const data = lerData(dataParametro);
  const linhas = await medicamentoRepository.agendaDoDia(idosoId, data);
  return { data, doses: linhas.map((l) => ({ ...l, administrada: Boolean(l.administracaoId) })) };
}

// Lê e valida { medicamentoId, horario, data } (corpo do POST ou query do DELETE).
async function lerDose(idosoId, origem) {
  const dados = validar(origem, {
    medicamentoId: { rotulo: 'Medicamento', tipo: 'inteiro', obrigatorio: true, min: 1 },
    horario: { rotulo: 'Horário', tipo: 'hora', obrigatorio: true },
  });
  const data = lerData(origem.data);
  if (data > hojeISO()) throw new AppError(400, 'Não é possível registrar doses de dias futuros.');

  if (!(await medicamentoRepository.horarioExiste(idosoId, dados.medicamentoId, dados.horario))) {
    throw new AppError(404, 'Este horário não está cadastrado para o medicamento.');
  }
  return { idosoId, medicamentoId: dados.medicamentoId, horario: normalizarHora(dados.horario), data };
}

async function administrar(idosoId, usuario, corpo) {
  const dose = await lerDose(idosoId, corpo);
  await medicamentoRepository.registrarDose({ ...dose, administradoEm: agoraSQL(), usuarioId: usuario.id });
  return agenda(idosoId, dose.data);
}

async function desfazer(idosoId, query) {
  const dose = await lerDose(idosoId, query);
  await medicamentoRepository.desfazerDose(dose);
  return agenda(idosoId, dose.data);
}

module.exports = { listar, obter, criar, atualizar, excluir, agenda, administrar, desfazer };
