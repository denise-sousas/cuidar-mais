// Autorização de familiares por e-mail.
//  - Se a pessoa já tem conta de Familiar: o vínculo é criado na hora.
//  - Se ainda não tem: o convite fica "pendente" e vira vínculo quando ela
//    criar a conta usando EXATAMENTE o mesmo e-mail.
// O sistema não envia e-mail: o cuidador avisa o familiar para se cadastrar.
const AppError = require('../utils/AppError');
const { validar } = require('../utils/validadores');
const conviteRepository = require('../repositories/conviteRepository');
const usuarioRepository = require('../repositories/usuarioRepository');
const idosoRepository = require('../repositories/idosoRepository');

async function convidarFamiliar(idosoId, usuario, corpo) {
  const { email } = validar(corpo, { email: { rotulo: 'E-mail do familiar', tipo: 'email', obrigatorio: true } });

  const existente = await usuarioRepository.buscarPorEmail(email);
  if (existente) {
    if (existente.perfil !== 'familiar') {
      throw new AppError(409, 'Este e-mail pertence a um usuário que não é Familiar. Cuidadores entram pelo código de vínculo.');
    }
    if (await idosoRepository.buscarVinculo(existente.id, idosoId)) {
      throw new AppError(409, 'Esta pessoa já acompanha o idoso.');
    }
    await idosoRepository.criarVinculo(existente.id, idosoId, 'familiar');
    return { situacao: 'vinculado', email };
  }

  if (await conviteRepository.buscarPorIdosoEmail(idosoId, email)) {
    throw new AppError(409, 'Já existe uma autorização pendente para este e-mail.');
  }
  await conviteRepository.criar(idosoId, email, usuario.id);
  return { situacao: 'pendente', email };
}

const listar = (idosoId) => conviteRepository.listarPorIdoso(idosoId);

async function cancelar(idosoId, conviteId) {
  if (!(await conviteRepository.excluir(idosoId, conviteId))) throw new AppError(404, 'Autorização não encontrada.');
}

// Chamado ao criar uma conta de Familiar: transforma os convites pendentes em vínculos.
async function consumirPendentes(usuarioId, email, db, idososJaVinculados = []) {
  const convites = await conviteRepository.listarPorEmail(email, db);
  let ativados = 0;
  for (const convite of convites) {
    if (!idososJaVinculados.includes(convite.idosoId)) {
      // eslint-disable-next-line no-await-in-loop
      await idosoRepository.criarVinculo(usuarioId, convite.idosoId, 'familiar', db);
      ativados += 1;
    }
  }
  await conviteRepository.excluirPorEmail(email, db);
  return ativados;
}

module.exports = { convidarFamiliar, listar, cancelar, consumirPendentes };
