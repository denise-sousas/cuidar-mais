// Mapa geral da API: tudo fica sob /api/v1
const router = require('express').Router();

router.get('/saude', (req, res) => res.json({ status: 'ok', hora: new Date().toISOString() }));

router.use('/auth', require('./auth.routes'));
router.use('/admin', require('./admin.routes'));
router.use('/idosos', require('./idosos.routes'));

module.exports = router;
