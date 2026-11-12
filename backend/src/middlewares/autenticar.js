// Exige um token JWT válido no cabeçalho "Authorization: Bearer <token>".
// Também confere no banco se o usuário ainda existe e está ativo.
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const AppError = require('../utils/AppError');
const usuarioRepository = require('../repositories/usuarioRepository');

module.exports = async function autenticar(req, res, next) {
  try {
    const [tipo, token] = (req.headers.authorization || '').split(' ');
    if (tipo !== 'Bearer' || !token) throw new AppError(401, 'Autenticação necessária.');

    let payload;
    try {
      payload = jwt.verify(token, env.jwt.segredo);
    } catch {
      throw new AppError(401, 'Sessão inválida ou expirada. Faça login novamente.');
    }

    const usuario = await usuarioRepository.buscarPorId(payload.sub);
    if (!usuario || !usuario.ativo) throw new AppError(401, 'Usuário não encontrado ou desativado.');

    req.usuario = usuario;
    next();
  } catch (erro) {
    next(erro);
  }
};
