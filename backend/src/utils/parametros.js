// Leitura segura de parâmetros de URL (query string e :id).
const AppError = require('./AppError');
const { dataExiste } = require('./validadores');
const { hojeISO } = require('./datas');

function lerId(valor) {
  const id = Number(valor);
  if (!Number.isInteger(id) || id <= 0) throw new AppError(404, 'Registro não encontrado.');
  return id;
}

// Sem valor: usa a data de hoje.
function lerData(valor, nome = 'data') {
  if (valor === undefined || valor === '') return hojeISO();
  if (!dataExiste(String(valor))) throw new AppError(400, `Parâmetro "${nome}" inválido (use AAAA-MM-DD).`);
  return String(valor);
}

function lerDataOpcional(valor, nome) {
  return valor === undefined || valor === '' ? null : lerData(valor, nome);
}

function lerEnumOpcional(valor, opcoes, nome) {
  if (valor === undefined || valor === '' || valor === 'todos' || valor === 'todas') return null;
  if (!opcoes.includes(valor)) throw new AppError(400, `Parâmetro "${nome}" inválido.`);
  return valor;
}

function lerPaginacao(query, tamanhoPadrao = 20, tamanhoMaximo = 500) {
  const pagina = Math.max(1, parseInt(query.pagina, 10) || 1);
  const tamanho = Math.min(tamanhoMaximo, Math.max(1, parseInt(query.tamanho, 10) || tamanhoPadrao));
  return { pagina, tamanho, deslocamento: (pagina - 1) * tamanho };
}

module.exports = { lerId, lerData, lerDataOpcional, lerEnumOpcional, lerPaginacao };
