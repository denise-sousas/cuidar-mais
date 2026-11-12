// Regras de negócio de cadastro e login.
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const AppError = require('../utils/AppError');
const { validar } = require('../utils/validadores');
const usuarioRepository = require('../repositories/usuarioRepository');
const usuarioService = require('./usuarioService');

// Usado para gastar o mesmo tempo quando o e-mail não existe (evita descobrir e-mails cadastrados).
const HASH_FALSO = bcrypt.hashSync('hash-falso-para-igualar-o-tempo-de-resposta', 10);

const gerarToken = (usuario) =>
  jwt.sign({}, env.jwt.segredo, { subject: String(usuario.id), expiresIn: env.jwt.expiracao });

const apresentar = ({ id, nome, email, perfil }) => ({ id, nome, email, perfil });

async function registrar(corpo) {
  // Administradores NÃO se cadastram sozinhos: são criados por "npm run admin:criar".
  const dados = usuarioService.validarConta(corpo, ['cuidador', 'familiar']);
  const { id, vinculos } = await usuarioService.criarConta(dados);
  const usuario = await usuarioRepository.buscarPorId(id);

  // "vinculosAtivados": autorizações por e-mail que já existiam e foram ativadas agora.
  return { token: gerarToken(usuario), usuario: apresentar(usuario), vinculosAtivados: vinculos };
}

async function login(corpo) {
  const { email, senha } = validar(corpo, {
    email: { rotulo: 'E-mail', tipo: 'email', obrigatorio: true },
    senha: { rotulo: 'Senha', tipo: 'texto', obrigatorio: true, semTrim: true },
  });

  const usuario = await usuarioRepository.buscarPorEmail(email);
  const senhaConfere = await bcrypt.compare(senha, usuario ? usuario.senhaHash : HASH_FALSO);
  if (!usuario || !senhaConfere) throw new AppError(401, 'E-mail ou senha incorretos.');
  if (!usuario.ativo) throw new AppError(403, 'Esta conta está desativada. Procure o administrador.');

  return { token: gerarToken(usuario), usuario: apresentar(usuario) };
}

module.exports = { registrar, login, apresentar };
