const router = require('express').Router();
const controller = require('../controllers/medicamentoController');
const { exigirCuidador } = require('../middlewares/acessoIdoso');

router.get('/', controller.listar);
router.get('/agenda', controller.agenda);
router.post('/doses', exigirCuidador, controller.administrar);
router.delete('/doses', exigirCuidador, controller.desfazer);
router.post('/', exigirCuidador, controller.criar);
router.get('/:id', controller.obter);
router.put('/:id', exigirCuidador, controller.atualizar);
router.delete('/:id', exigirCuidador, controller.excluir);

module.exports = router;
