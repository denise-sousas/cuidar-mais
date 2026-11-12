const asyncHandler = require('../utils/asyncHandler');
const { lerId } = require('../utils/parametros');
const consultaService = require('../services/consultaService');

module.exports = {
  listar: asyncHandler(async (req, res) => {
    res.json(await consultaService.listar(req.idoso.id, req.query));
  }),
  criar: asyncHandler(async (req, res) => {
    res.status(201).json(await consultaService.criar(req.idoso.id, req.usuario, req.body));
  }),
  atualizar: asyncHandler(async (req, res) => {
    res.json(await consultaService.atualizar(req.idoso.id, lerId(req.params.id), req.body));
  }),
  marcarRealizada: asyncHandler(async (req, res) => {
    res.json(await consultaService.marcarRealizada(req.idoso.id, lerId(req.params.id), req.body));
  }),
  excluir: asyncHandler(async (req, res) => {
    await consultaService.excluir(req.idoso.id, lerId(req.params.id));
    res.status(204).end();
  }),
};
