const router = require('express').Router();
const controller = require('../controllers/registroController');
const { exigirCuidador } = require('../middlewares/acessoIdoso');

router.get('/', controller.listar);
router.get('/resumo', controller.resumo);
router.post('/', exigirCuidador, controller.criar);
router.put('/:id', exigirCuidador, controller.atualizar);
router.delete('/:id', exigirCuidador, controller.excluir);

module.exports = router;
