const router = require('express').Router();
const controller = require('../controllers/adminController');
const autenticar = require('../middlewares/autenticar');
const exigirPerfil = require('../middlewares/exigirPerfil');

router.use(autenticar, exigirPerfil('administrador'));

router.get('/usuarios', controller.listarUsuarios);
router.post('/usuarios', controller.criarUsuario);
router.patch('/usuarios/:id', controller.alterarUsuario);
router.get('/idosos', controller.listarIdosos);
router.get('/estatisticas', controller.estatisticas);

module.exports = router;
