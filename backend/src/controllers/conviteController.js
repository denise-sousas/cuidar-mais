const asyncHandler = require('../utils/asyncHandler');
const { lerId } = require('../utils/parametros');
const conviteService = require('../services/conviteService');

module.exports = {
  listar: asyncHandler(async (req, res) => {
    res.json(await conviteService.listar(req.idoso.id));
  }),
  convidar: asyncHandler(async (req, res) => {
    res.status(201).json(await conviteService.convidarFamiliar(req.idoso.id, req.usuario, req.body));
  }),
  cancelar: asyncHandler(async (req, res) => {
    await conviteService.cancelar(req.idoso.id, lerId(req.params.id));
    res.status(204).end();
  }),
};
