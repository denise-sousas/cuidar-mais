// Cria (ou promove) um administrador. Uso:
//   npm run admin:criar -- "Nome Completo" email@exemplo.com SenhaForte123 [CPF]
const bcrypt = require('bcryptjs');
const { banco, pool } = require('../src/config/database');
const { cpfValido, formatarCpf } = require('../src/utils/validadores');

async function main() {
  const [nome, email, senha, cpfInformado] = process.argv.slice(2);
  if (!nome || !email || !senha || senha.length < 8) {
    console.log('Uso: npm run admin:criar -- "Nome Completo" email@exemplo.com SenhaComMinimo8 [CPF]');
    process.exit(1);
  }
  if (cpfInformado && !cpfValido(cpfInformado)) {
    console.log('CPF inválido.');
    process.exit(1);
  }
  const cpf = cpfInformado ? formatarCpf(cpfInformado) : null;

  const hash = await bcrypt.hash(senha, 10);
  const [existente] = await banco.consultar('SELECT id FROM usuarios WHERE email = ?', [email.toLowerCase()]);

  if (existente) {
    await banco.consultar("UPDATE usuarios SET perfil = 'administrador', ativo = 1, senha_hash = ? WHERE id = ?", [hash, existente.id]);
    console.log(`Usuário ${email} promovido a administrador (senha atualizada).`);
  } else {
    await banco.consultar(
      "INSERT INTO usuarios (nome, email, cpf, senha_hash, perfil) VALUES (?, ?, ?, ?, 'administrador')",
      [nome, email.toLowerCase(), cpf, hash]
    );
    console.log(`Administrador ${email} criado.`);
  }
  await pool.end();
}

main().catch((erro) => {
  console.error('Falha:', erro.message);
  process.exit(1);
});
