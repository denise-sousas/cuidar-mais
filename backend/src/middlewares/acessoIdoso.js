// Garante que o usuário logado está vinculado ao idoso da URL (/idosos/:idosoId/...).
// Se estiver, disponibiliza req.idoso = { id, papel } para os controllers.
const AppError = require('../utils/AppError');
const idosoRepository = require('../repositories/idosoRepository');

async function carregarVinculo(req, res, next) {
  try {
    const idosoId = Number(req.params.idosoId);
    if (!Number.isInteger(idosoId) || idosoId <= 0) throw new AppError(404, 'Idoso não encontrado.');

    const vinculo = await idosoRepository.buscarVinculo(req.usuario.id, idosoId);
    // Mesma resposta para "não existe" e "não é seu": não revela quais idosos existem.
    if (!vinculo) throw new AppError(404, 'Idoso não encontrado.');

    req.idoso = { id: idosoId, papel: vinculo.papel };
    next();
  } catch (erro) {
    next(erro);
  }
}

// Familiares só consultam. Rotas que alteram dados exigem papel de cuidador.
function exigirCuidador(req, res, next) {
  if (req.idoso.papel !== 'cuidador') {
    return next(new AppError(403, 'Apenas cuidadores podem realizar esta ação.'));
  }
  return next();
}

module.exports = { carregarVinculo, exigirCuidador };
