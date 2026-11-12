// Tratamento centralizado de erros: toda resposta de erro segue o formato
// { "erro": { "mensagem": "...", "detalhes": { campo: "mensagem" } } }
const AppError = require('../utils/AppError');

function rotaNaoEncontrada(req, res, next) {
  next(new AppError(404, 'Rota não encontrada.'));
}

// eslint-disable-next-line no-unused-vars
function tratadorDeErros(erro, req, res, next) {
  if (erro instanceof AppError) {
    return res.status(erro.status).json({ erro: { mensagem: erro.message, detalhes: erro.detalhes } });
  }
  if (erro.type === 'entity.parse.failed') {
    return res.status(400).json({ erro: { mensagem: 'JSON inválido na requisição.' } });
  }
  if (erro.type === 'entity.too.large') {
    return res.status(413).json({ erro: { mensagem: 'Requisição grande demais.' } });
  }
  if (erro.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ erro: { mensagem: 'Já existe um registro com esses dados.' } });
  }

  console.error('[erro]', erro);
  return res.status(500).json({ erro: { mensagem: 'Erro interno do servidor.' } });
}

module.exports = { rotaNaoEncontrada, tratadorDeErros };
