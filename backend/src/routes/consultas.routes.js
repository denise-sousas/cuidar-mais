const router = require('express').Router();
const controller = require('../controllers/consultaController');
const { exigirCuidador } = require('../middlewares/acessoIdoso');

router.get('/', controller.listar);
router.post('/', exigirCuidador, controller.criar);
router.put('/:id', exigirCuidador, controller.atualizar);
router.patch('/:id/realizada', exigirCuidador, controller.marcarRealizada);
router.delete('/:id', exigirCuidador, controller.excluir);

module.exports = router;
