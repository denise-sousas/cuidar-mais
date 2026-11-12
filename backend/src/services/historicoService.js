// Regras de negócio: consulta ao histórico unificado de cuidados.
const AppError = require('../utils/AppError');
const { lerDataOpcional, lerEnumOpcional, lerPaginacao } = require('../utils/parametros');
const historicoRepository = require('../repositories/historicoRepository');

async function listar(idosoId, query) {
  const de = lerDataOpcional(query.de, 'de');
  const ate = lerDataOpcional(query.ate, 'ate');
  if (de && ate && de > ate) throw new AppError(400, 'A data inicial não pode ser maior que a final.');

  const tipo = lerEnumOpcional(query.tipo, historicoRepository.TIPOS, 'tipo');
  const { pagina, tamanho, deslocamento } = lerPaginacao(query);

  const { total, itens } = await historicoRepository.buscar(idosoId, { tipo, de, ate, limite: tamanho, deslocamento });
  return { itens, total, pagina, tamanho, totalPaginas: Math.max(1, Math.ceil(total / tamanho)) };
}

module.exports = { listar };
