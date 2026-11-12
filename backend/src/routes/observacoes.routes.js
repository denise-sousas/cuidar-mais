const router = require('express').Router();
const controller = require('../controllers/observacaoController');
const { exigirCuidador } = require('../middlewares/acessoIdoso');

router.get('/', controller.listar);
router.post('/', exigirCuidador, controller.criar);
router.put('/:id', exigirCuidador, controller.atualizar);
router.delete('/:id', exigirCuidador, controller.excluir);

module.exports = router;
