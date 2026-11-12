// Controle de acesso por perfil do usuário (administrador, cuidador, familiar).
const AppError = require('../utils/AppError');

module.exports = (...perfisPermitidos) => (req, res, next) => {
  if (!perfisPermitidos.includes(req.usuario.perfil)) {
    return next(new AppError(403, 'Você não tem permissão para acessar este recurso.'));
  }
  return next();
};
