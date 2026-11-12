const router = require('express').Router();
const controller = require('../controllers/idosoController');
const autenticar = require('../middlewares/autenticar');
const exigirPerfil = require('../middlewares/exigirPerfil');
const { carregarVinculo } = require('../middlewares/acessoIdoso');
const { limitadorVinculo } = require('../middlewares/limitadores');

router.use(autenticar, exigirPerfil('cuidador', 'familiar'));

router.get('/', controller.listar);
router.post('/', exigirPerfil('cuidador'), controller.criar);
router.post('/vincular', limitadorVinculo, controller.vincular);

// A partir daqui o usuário precisa estar vinculado ao idoso da URL.
router.use('/:idosoId', carregarVinculo, require('./idoso.routes'));

module.exports = router;
