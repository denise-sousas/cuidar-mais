// Popula o banco com dados de DEMONSTRAÇÃO (somente desenvolvimento).
// Uso: npm run db:seed
// Contas criadas (senha: Cuidar@123):
//   admin@cuidar.local | cuidadora@cuidar.local | familiar@cuidar.local
const bcrypt = require('bcryptjs');
const env = require('../src/config/env');
const { banco, pool } = require('../src/config/database');
const { hojeISO, adicionarDias } = require('../src/utils/datas');

const SENHA = 'Cuidar@123';

async function criarUsuario(nome, email, perfil, hash, cpf) {
  const [existente] = await banco.consultar('SELECT id FROM usuarios WHERE email = ?', [email]);
  if (existente) return existente.id;
  const r = await banco.consultar('INSERT INTO usuarios (nome, email, cpf, senha_hash, perfil) VALUES (?, ?, ?, ?, ?)', [nome, email, cpf, hash, perfil]);
  return r.insertId;
}

async function main() {
  if (env.ambiente === 'production') {
    console.error('O seed é apenas para desenvolvimento. Abortado.');
    process.exit(1);
  }

  const hash = await bcrypt.hash(SENHA, 10);
  await criarUsuario('Coordenação Cuidar+', 'admin@cuidar.local', 'administrador', hash, '529.982.247-25');
  const cuidadoraId = await criarUsuario('Denise Martins', 'cuidadora@cuidar.local', 'cuidador', hash, '111.444.777-35');
  const familiarId = await criarUsuario('Larissa Martins', 'familiar@cuidar.local', 'familiar', hash, '123.456.789-09');

  const [jaExiste] = await banco.consultar("SELECT id FROM idosos WHERE codigo_vinculo = 'CUIDAR-DEMO23'");
  if (jaExiste) {
    console.log('Dados de demonstração já existem.');
    await pool.end();
    return;
  }

  const idoso = await banco.consultar(
    `INSERT INTO idosos (nome, data_nascimento, telefone, endereco, observacoes, codigo_vinculo, criado_por)
     VALUES ('Maria Aparecida da Silva', '1946-05-12', '(62) 99999-0000', 'Rua das Flores, 100 - Anápolis/GO',
             'Hipertensa. Prefere refeições leves à noite.', 'CUIDAR-DEMO23', ?)`,
    [cuidadoraId]
  );
  const idosoId = idoso.insertId;
  await banco.consultar('INSERT INTO vinculos (usuario_id, idoso_id, papel) VALUES (?, ?, ?), (?, ?, ?)', [
    cuidadoraId, idosoId, 'cuidador', familiarId, idosoId, 'familiar',
  ]);

  const med = await banco.consultar("INSERT INTO medicamentos (idoso_id, nome, dosagem, via) VALUES (?, 'Losartana', '50 mg', 'Oral')", [idosoId]);
  await banco.consultar("INSERT INTO horarios_medicamento (medicamento_id, horario) VALUES (?, '08:00:00'), (?, '20:00:00')", [med.insertId, med.insertId]);

  const hoje = hojeISO();
  await banco.consultar(
    `INSERT INTO cuidados (idoso_id, titulo, descricao, tipo, data, horario, criado_por) VALUES
       (?, 'Café da manhã', 'Fruta e pão integral', 'alimentacao', ?, '07:30:00', ?),
       (?, 'Caminhada leve', '20 minutos no quintal', 'atividade_fisica', ?, '16:00:00', ?),
       (?, 'Banho', 'Com auxílio', 'higiene', ?, '10:00:00', ?)`,
    [idosoId, hoje, cuidadoraId, idosoId, hoje, cuidadoraId, idosoId, hoje, cuidadoraId]
  );
  await banco.consultar(
    "INSERT INTO consultas (idoso_id, titulo, local, data, horario, criado_por) VALUES (?, 'Cardiologista', 'Clínica Coração - Anápolis', ?, '14:30:00', ?)",
    [idosoId, adicionarDias(hoje, 3), cuidadoraId]
  );
  await banco.consultar(
    "INSERT INTO observacoes (idoso_id, titulo, categoria, texto, data_hora, usuario_id) VALUES (?, 'Dormiu bem', 'sono', 'Dormiu a noite toda, sem despertares.', NOW(), ?)",
    [idosoId, cuidadoraId]
  );

  // Autorização pendente: quem se cadastrar como Familiar com este e-mail ganha acesso ao idoso.
  await banco.consultar("INSERT INTO convites_familiares (idoso_id, email, criado_por) VALUES (?, 'neto@cuidar.local', ?)", [idosoId, cuidadoraId]);

  console.log('Dados de demonstração criados.');
  console.log('Autorização pendente de exemplo: cadastre um Familiar com o e-mail neto@cuidar.local');
  console.log('Logins (senha: Cuidar@123): admin@cuidar.local | cuidadora@cuidar.local | familiar@cuidar.local');
  console.log('Código de vínculo do idoso demo: CUIDAR-DEMO23');
  await pool.end();
}

main().catch((erro) => {
  console.error('Falha no seed:', erro.message);
  process.exit(1);
});
