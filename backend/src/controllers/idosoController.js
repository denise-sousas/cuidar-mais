const asyncHandler = require('../utils/asyncHandler');
const { lerId } = require('../utils/parametros');
const idosoService = require('../services/idosoService');

module.exports = {
  listar: asyncHandler(async (req, res) => {
    res.json(await idosoService.listar(req.usuario));
  }),
  criar: asyncHandler(async (req, res) => {
    res.status(201).json(await idosoService.criar(req.usuario, req.body));
  }),
  vincular: asyncHandler(async (req, res) => {
    res.status(201).json(await idosoService.vincular(req.usuario, req.body));
  }),
  obter: asyncHandler(async (req, res) => {
    res.json(await idosoService.obter(req.idoso.id, req.idoso.papel));
  }),
  atualizar: asyncHandler(async (req, res) => {
    res.json(await idosoService.atualizar(req.idoso.id, req.body));
  }),
  excluir: asyncHandler(async (req, res) => {
    await idosoService.excluir(req.idoso.id, req.usuario);
    res.status(204).end();
  }),
  novoCodigo: asyncHandler(async (req, res) => {
    res.json(await idosoService.gerarNovoCodigo(req.idoso.id));
  }),
  listarVinculos: asyncHandler(async (req, res) => {
    res.json(await idosoService.listarVinculos(req.idoso.id));
  }),
  removerVinculo: asyncHandler(async (req, res) => {
    await idosoService.removerVinculo(req.idoso, req.usuario, lerId(req.params.usuarioId));
    res.status(204).end();
  }),
};
