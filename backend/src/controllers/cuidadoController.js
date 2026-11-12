const asyncHandler = require('../utils/asyncHandler');
const { lerId } = require('../utils/parametros');
const cuidadoService = require('../services/cuidadoService');

module.exports = {
  listar: asyncHandler(async (req, res) => {
    res.json(await cuidadoService.listar(req.idoso.id, req.query.data));
  }),
  criar: asyncHandler(async (req, res) => {
    res.status(201).json(await cuidadoService.criar(req.idoso.id, req.usuario, req.body));
  }),
  atualizar: asyncHandler(async (req, res) => {
    res.json(await cuidadoService.atualizar(req.idoso.id, lerId(req.params.id), req.body));
  }),
  concluir: asyncHandler(async (req, res) => {
    res.json(await cuidadoService.concluir(req.idoso.id, lerId(req.params.id), req.usuario, req.body));
  }),
  excluir: asyncHandler(async (req, res) => {
    await cuidadoService.excluir(req.idoso.id, lerId(req.params.id));
    res.status(204).end();
  }),
};
