const asyncHandler = require('../utils/asyncHandler');
const adminService = require('../services/adminService');

module.exports = {
  listarUsuarios: asyncHandler(async (req, res) => {
    res.json(await adminService.listarUsuarios(req.query.busca));
  }),
  estatisticas: asyncHandler(async (req, res) => {
    res.json(await adminService.estatisticas());
  }),
  listarIdosos: asyncHandler(async (req, res) => {
    res.json(await adminService.listarIdosos());
  }),
  criarUsuario: asyncHandler(async (req, res) => {
    res.status(201).json(await adminService.criarUsuario(req.body));
  }),
  alterarUsuario: asyncHandler(async (req, res) => {
    res.json(await adminService.alterarUsuario(req.params.id, req.body, req.usuario));
  }),
};
