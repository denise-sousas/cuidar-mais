// Criação de contas (usada pelo cadastro público e pelo administrador).
const bcrypt = require('bcryptjs');
const AppError = require('../utils/AppError');
const { validar } = require('../utils/validadores');
const { transacao } = require('../config/database');
const usuarioRepository = require('../repositories/usuarioRepository');
const idosoRepository = require('../repositories/idosoRepository');
const conviteService = require('./conviteService');

// Dados obrigatórios de uma conta: nome completo, CPF, e-mail, senha (mín. 8) e perfil.
function validarConta(corpo, perfisPermitidos) {
  return validar(corpo, {
    nome: { rotulo: 'Nome completo', tipo: 'texto', obrigatorio: true, min: 3, max: 100 },
    cpf: { rotulo: 'CPF', tipo: 'cpf', obrigatorio: true },
    email: { rotulo: 'E-mail', tipo: 'email', obrigatorio: true },
    senha: { rotulo: 'Senha', tipo: 'texto', obrigatorio: true, min: 8, max: 72, semTrim: true },
    perfil: { rotulo: 'Perfil', tipo: 'enum', opcoes: perfisPermitidos, obrigatorio: true },
  });
}

async function criarConta(dados, { idosoIds = [] } = {}) {
  if (await usuarioRepository.buscarPorEmail(dados.email)) {
    throw new AppError(409, 'Este e-mail já está cadastrado.', { email: 'Este e-mail já está cadastrado.' });
  }
  if (await usuarioRepository.buscarPorCpf(dados.cpf)) {
    throw new AppError(409, 'Este CPF já está cadastrado.', { cpf: 'Este CPF já está cadastrado.' });
  }

  const senhaHash = await bcrypt.hash(dados.senha, 10);

  // Conta + vínculos gravados juntos: ou tudo, ou nada.
  return transacao(async (db) => {
    const id = await usuarioRepository.criar({ ...dados, senhaHash }, db);
    let vinculos = 0;
    for (const idosoId of idosoIds) {
      // eslint-disable-next-line no-await-in-loop
      await idosoRepository.criarVinculo(id, idosoId, dados.perfil, db);
      vinculos += 1;
    }
    if (dados.perfil === 'familiar') {
      vinculos += await conviteService.consumirPendentes(id, dados.email, db, idosoIds);
    }
    return { id, vinculos };
  });
}

module.exports = { validarConta, criarConta };
