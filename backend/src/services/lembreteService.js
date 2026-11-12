// Lembretes: itens de HOJE ainda não concluídos que estão atrasados ou prestes a acontecer.
// O frontend consulta este serviço a cada minuto e avisa o usuário.
const { hojeISO, horaAtual, minutosDoDia } = require('../utils/datas');
const rotinaService = require('./rotinaService');

async function obter(idosoId, query) {
  const antecedencia = Math.min(240, Math.max(0, parseInt(query.antecedencia, 10) || 30));
  const agora = minutosDoDia(horaAtual());
  const rotina = await rotinaService.obter(idosoId, hojeISO());

  const itens = rotina.itens
    .filter((item) => !item.concluido)
    .map((item) => {
      const minutos = minutosDoDia(item.horario) - agora; // negativo = atrasado
      return { ...item, minutos, situacao: minutos < 0 ? 'atrasado' : 'proximo' };
    })
    .filter((item) => item.minutos <= antecedencia);

  return { geradoEm: new Date().toISOString(), antecedencia, itens };
}

module.exports = { obter };
