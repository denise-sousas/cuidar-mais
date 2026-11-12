// Resumo exibido na tela inicial (dashboard).
const { hojeISO } = require('../utils/datas');
const rotinaService = require('./rotinaService');
const registroService = require('./registroService');
const consultaRepository = require('../repositories/consultaRepository');
const observacaoRepository = require('../repositories/observacaoRepository');

async function obter(idosoId) {
  const hoje = hojeISO();
  const [rotina, registros, proximaConsulta, ultimasObservacoes] = await Promise.all([
    rotinaService.obter(idosoId, hoje),
    registroService.resumo(idosoId, hoje),
    consultaRepository.proxima(idosoId, hoje),
    observacaoRepository.ultimas(idosoId, 3),
  ]);

  const contar = (tipoItem) => {
    const itens = rotina.itens.filter((i) => i.tipoItem === tipoItem);
    return { total: itens.length, concluidos: itens.filter((i) => i.concluido).length };
  };
  const cuidados = contar('cuidado');
  const medicamentos = contar('medicamento');

  // O progresso do dia considera cuidados + doses (consultas aparecem à parte).
  const total = cuidados.total + medicamentos.total;
  const feitos = cuidados.concluidos + medicamentos.concluidos;

  return {
    data: hoje,
    cuidados,
    medicamentos,
    progresso: { total, concluidos: feitos, percentual: total ? Math.round((feitos / total) * 100) : 0 },
    registros,
    proximaConsulta,
    pendentes: rotina.itens.filter((i) => !i.concluido).slice(0, 6),
    ultimasObservacoes,
  };
}

module.exports = { obter };
