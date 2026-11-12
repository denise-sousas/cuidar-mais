const asyncHandler = require('../utils/asyncHandler');
const { lerId } = require('../utils/parametros');
const medicamentoService = require('../services/medicamentoService');

module.exports = {
  listar: asyncHandler(async (req, res) => {
    res.json(await medicamentoService.listar(req.idoso.id));
  }),
  obter: asyncHandler(async (req, res) => {
    res.json(await medicamentoService.obter(req.idoso.id, lerId(req.params.id)));
  }),
  criar: asyncHandler(async (req, res) => {
    res.status(201).json(await medicamentoService.criar(req.idoso.id, req.body));
  }),
  atualizar: asyncHandler(async (req, res) => {
    res.json(await medicamentoService.atualizar(req.idoso.id, lerId(req.params.id), req.body));
  }),
  excluir: asyncHandler(async (req, res) => {
    await medicamentoService.excluir(req.idoso.id, lerId(req.params.id));
    res.status(204).end();
  }),
  agenda: asyncHandler(async (req, res) => {
    res.json(await medicamentoService.agenda(req.idoso.id, req.query.data));
  }),
  administrar: asyncHandler(async (req, res) => {
    res.status(201).json(await medicamentoService.administrar(req.idoso.id, req.usuario, req.body));
  }),
  desfazer: asyncHandler(async (req, res) => {
    res.json(await medicamentoService.desfazer(req.idoso.id, req.query));
  }),
};
