const asyncHandler = require('../utils/asyncHandler');
const { lerId } = require('../utils/parametros');
const registroService = require('../services/registroService');

module.exports = {
  listar: asyncHandler(async (req, res) => {
    res.json(await registroService.listar(req.idoso.id, req.query));
  }),
  resumo: asyncHandler(async (req, res) => {
    res.json(await registroService.resumo(req.idoso.id, req.query.data));
  }),
  criar: asyncHandler(async (req, res) => {
    res.status(201).json(await registroService.criar(req.idoso.id, req.usuario, req.body));
  }),
  atualizar: asyncHandler(async (req, res) => {
    res.json(await registroService.atualizar(req.idoso.id, lerId(req.params.id), req.body));
  }),
  excluir: asyncHandler(async (req, res) => {
    await registroService.excluir(req.idoso.id, lerId(req.params.id));
    res.status(204).end();
  }),
};
