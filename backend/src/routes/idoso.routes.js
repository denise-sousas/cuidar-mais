const router = require('express').Router();
const idosoController = require('../controllers/idosoController');
const painelController = require('../controllers/painelController');
const conviteController = require('../controllers/conviteController');
const { exigirCuidador } = require('../middlewares/acessoIdoso');

// Dados do idoso e das pessoas vinculadas
router.get('/', idosoController.obter);
router.put('/', exigirCuidador, idosoController.atualizar);
router.delete('/', exigirCuidador, idosoController.excluir);
router.post('/codigo', exigirCuidador, idosoController.novoCodigo);
router.get('/vinculos', exigirCuidador, idosoController.listarVinculos);
router.delete('/vinculos/:usuarioId', idosoController.removerVinculo);
router.get('/convites', exigirCuidador, conviteController.listar);
router.post('/convites', exigirCuidador, conviteController.convidar);
router.delete('/convites/:id', exigirCuidador, conviteController.cancelar);

// Visões de leitura
router.get('/resumo', painelController.resumo);
router.get('/rotina', painelController.rotina);
router.get('/lembretes', painelController.lembretes);
router.get('/historico', painelController.historico);

// Recursos do idoso
router.use('/medicamentos', require('./medicamentos.routes'));
router.use('/cuidados', require('./cuidados.routes'));
router.use('/registros', require('./registros.routes'));
router.use('/consultas', require('./consultas.routes'));
router.use('/observacoes', require('./observacoes.routes'));

module.exports = router;
