// Limites de requisições para reduzir tentativas de força bruta.
const rateLimit = require('express-rate-limit');

const criar = (janelaMinutos, limite, mensagem) =>
  rateLimit({
    windowMs: janelaMinutos * 60 * 1000,
    limit: limite,
    standardHeaders: true,
    legacyHeaders: false,
    message: { erro: { mensagem } },
  });

module.exports = {
  limitadorGeral: criar(15, 1000, 'Muitas requisições. Tente novamente em alguns minutos.'),
  limitadorLogin: criar(15, 10, 'Muitas tentativas de acesso. Aguarde 15 minutos e tente novamente.'),
  limitadorVinculo: criar(15, 20, 'Muitas tentativas de vínculo. Aguarde alguns minutos.'),
};
