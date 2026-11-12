const router = require('express').Router();
const controller = require('../controllers/authController');
const autenticar = require('../middlewares/autenticar');
const { limitadorLogin } = require('../middlewares/limitadores');

router.post('/registro', limitadorLogin, controller.registrar);
router.post('/login', limitadorLogin, controller.login);
router.get('/me', autenticar, controller.perfil);

module.exports = router;
