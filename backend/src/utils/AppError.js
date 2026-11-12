// Erro "esperado" da aplicação (validação, permissão, não encontrado...).
// O middleware de erros converte isto em uma resposta HTTP com o status certo.
class AppError extends Error {
  constructor(status, mensagem, detalhes) {
    super(mensagem);
    this.status = status;
    this.detalhes = detalhes;
  }
}

module.exports = AppError;
