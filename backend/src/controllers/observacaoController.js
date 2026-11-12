const asyncHandler = require('../utils/asyncHandler');
const { lerId } = require('../utils/parametros');
const observacaoService = require('../services/observacaoService');

module.exports = {
  listar: asyncHandler(async (req, res) => {
    res.json(await observacaoService.listar(req.idoso.id, req.query));
  }),
  criar: asyncHandler(async (req, res) => {
    res.status(201).json(await observacaoService.criar(req.idoso.id, req.usuario, req.body));
  }),
  atualizar: asyncHandler(async (req, res) => {
    res.json(await observacaoService.atualizar(req.idoso.id, lerId(req.params.id), req.body));
  }),
  excluir: asyncHandler(async (req, res) => {
    await observacaoService.excluir(req.idoso.id, lerId(req.params.id));
    res.status(204).end();
  }),
};
