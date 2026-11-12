// Regras do perfil Administrador: gerenciar usuários e permissões.
const AppError = require('../utils/AppError');
const { validar } = require('../utils/validadores');
const { lerId } = require('../utils/parametros');
const usuarioRepository = require('../repositories/usuarioRepository');
const idosoRepository = require('../repositories/idosoRepository');
const usuarioService = require('./usuarioService');

const listarUsuarios = (busca) => usuarioRepository.listar(busca ? String(busca).trim() : '');

const estatisticas = () => usuarioRepository.estatisticas();

// Apenas id e nome dos idosos (o administrador não vê dados de saúde).
const listarIdosos = () => idosoRepository.listarResumo();

// Cria conta de Cuidador ou Familiar e, opcionalmente, já vincula a idosos existentes.
async function criarUsuario(corpo) {
  const dados = usuarioService.validarConta(corpo, ['cuidador', 'familiar']);

  const idosoIds = [...new Set((Array.isArray(corpo.idosoIds) ? corpo.idosoIds : []).map(Number))];
  for (const idosoId of idosoIds) {
    // eslint-disable-next-line no-await-in-loop
    if (!Number.isInteger(idosoId) || !(await idosoRepository.buscarPorId(idosoId))) {
      throw new AppError(400, 'Dados inválidos.', { idosoIds: 'Um dos idosos selecionados não existe.' });
    }
  }

  const { id, vinculos } = await usuarioService.criarConta(dados, { idosoIds });
  return { ...(await usuarioRepository.buscarPorId(id)), vinculosCriados: vinculos };
}

async function alterarUsuario(idParametro, corpo, administrador) {
  const id = lerId(idParametro);
  if (id === administrador.id) throw new AppError(400, 'Você não pode alterar a sua própria conta.');

  const usuario = await usuarioRepository.buscarPorId(id);
  if (!usuario) throw new AppError(404, 'Usuário não encontrado.');

  const dados = validar(corpo, {
    perfil: { rotulo: 'Perfil', tipo: 'enum', opcoes: ['administrador', 'cuidador', 'familiar'], padrao: usuario.perfil },
    ativo: { rotulo: 'Situação', tipo: 'booleano', padrao: Boolean(usuario.ativo) },
  });

  if (dados.perfil !== usuario.perfil && (await usuarioRepository.contarVinculos(id)) > 0) {
    throw new AppError(409, 'Este usuário possui vínculos com idosos. Remova os vínculos antes de mudar o perfil.');
  }

  await usuarioRepository.atualizar(id, dados);
  return usuarioRepository.buscarPorId(id);
}

module.exports = { listarUsuarios, estatisticas, listarIdosos, criarUsuario, alterarUsuario };
