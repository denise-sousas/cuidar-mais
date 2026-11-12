// Controllers só traduzem HTTP <-> serviços: leem a requisição e devolvem a resposta.
const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/authService');

module.exports = {
  registrar: asyncHandler(async (req, res) => {
    res.status(201).json(await authService.registrar(req.body));
  }),
  login: asyncHandler(async (req, res) => {
    res.json(await authService.login(req.body));
  }),
  perfil: asyncHandler(async (req, res) => {
    res.json({ usuario: authService.apresentar(req.usuario) });
  }),
};
