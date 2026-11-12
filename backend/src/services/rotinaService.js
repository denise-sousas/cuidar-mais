// "Rotina do dia": junta cuidados, doses de medicamento e consultas em uma
// única linha do tempo ordenada por horário.
const { lerData } = require('../utils/parametros');
const cuidadoRepository = require('../repositories/cuidadoRepository');
const medicamentoRepository = require('../repositories/medicamentoRepository');
const consultaRepository = require('../repositories/consultaRepository');

async function obter(idosoId, dataParametro) {
  const data = lerData(dataParametro);
  const [cuidados, doses, consultas] = await Promise.all([
    cuidadoRepository.listarPorData(idosoId, data),
    medicamentoRepository.agendaDoDia(idosoId, data),
    consultaRepository.listarPorData(idosoId, data),
  ]);

  const itens = [
    ...cuidados.map((c) => ({
      tipoItem: 'cuidado',
      chave: `cuidado-${c.id}`,
      id: c.id,
      titulo: c.titulo,
      detalhes: c.descricao || '',
      subtipo: c.tipo,
      horario: c.horario,
      concluido: Boolean(c.concluido),
      concluidoEm: c.concluidoEm,
      concluidoPor: c.concluidoPorNome,
    })),
    ...doses.map((d) => ({
      tipoItem: 'medicamento',
      chave: `medicamento-${d.medicamentoId}-${d.horario}`,
      medicamentoId: d.medicamentoId,
      titulo: d.nome,
      detalhes: [d.dosagem, d.via].filter(Boolean).join(' - '),
      subtipo: 'medicamento',
      horario: d.horario,
      concluido: Boolean(d.administracaoId),
      concluidoEm: d.administradoEm,
      concluidoPor: d.administradoPor,
    })),
    ...consultas.map((c) => ({
      tipoItem: 'consulta',
      chave: `consulta-${c.id}`,
      id: c.id,
      titulo: c.titulo,
      detalhes: c.local || '',
      subtipo: 'consulta',
      horario: c.horario,
      concluido: Boolean(c.realizada),
      concluidoEm: null,
      concluidoPor: null,
    })),
  ].sort((a, b) => a.horario.localeCompare(b.horario) || a.titulo.localeCompare(b.titulo));

  const concluidos = itens.filter((i) => i.concluido).length;
  return { data, itens, resumo: { total: itens.length, concluidos, pendentes: itens.length - concluidos } };
}

module.exports = { obter };
