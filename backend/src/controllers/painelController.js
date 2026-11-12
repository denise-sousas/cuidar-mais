// Endpoints de leitura que combinam várias fontes: rotina, lembretes, histórico e dashboard.
const asyncHandler = require('../utils/asyncHandler');
const rotinaService = require('../services/rotinaService');
const lembreteService = require('../services/lembreteService');
const historicoService = require('../services/historicoService');
const dashboardService = require('../services/dashboardService');

module.exports = {
  rotina: asyncHandler(async (req, res) => {
    res.json(await rotinaService.obter(req.idoso.id, req.query.data));
  }),
  lembretes: asyncHandler(async (req, res) => {
    res.json(await lembreteService.obter(req.idoso.id, req.query));
  }),
  historico: asyncHandler(async (req, res) => {
    res.json(await historicoService.listar(req.idoso.id, req.query));
  }),
  resumo: asyncHandler(async (req, res) => {
    res.json(await dashboardService.obter(req.idoso.id));
  }),
};
