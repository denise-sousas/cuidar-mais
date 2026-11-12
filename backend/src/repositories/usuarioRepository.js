// Acesso ao banco: tabela "usuarios". Só SQL, nenhuma regra de negócio.
const { banco } = require('../config/database');

const CAMPOS_PUBLICOS = 'id, nome, email, cpf, perfil, ativo, criado_em';

module.exports = {
  async buscarPorEmail(email, db = banco) {
    const [usuario] = await db.consultar('SELECT * FROM usuarios WHERE email = ?', [email]);
    return usuario || null;
  },

  async buscarPorId(id, db = banco) {
    const [usuario] = await db.consultar(`SELECT ${CAMPOS_PUBLICOS} FROM usuarios WHERE id = ?`, [id]);
    return usuario || null;
  },

  async buscarPorCpf(cpf, db = banco) {
    const [usuario] = await db.consultar('SELECT id FROM usuarios WHERE cpf = ?', [cpf]);
    return usuario || null;
  },

  async criar({ nome, email, cpf, senhaHash, perfil }, db = banco) {
    const resultado = await db.consultar(
      'INSERT INTO usuarios (nome, email, cpf, senha_hash, perfil) VALUES (?, ?, ?, ?, ?)',
      [nome, email, cpf || null, senhaHash, perfil]
    );
    return resultado.insertId;
  },

  async listar(busca, db = banco) {
    const filtro = busca ? 'WHERE nome LIKE ? OR email LIKE ? OR cpf LIKE ?' : '';
    const parametros = busca ? [`%${busca}%`, `%${busca}%`, `%${busca}%`] : [];
    return db.consultar(`SELECT ${CAMPOS_PUBLICOS} FROM usuarios ${filtro} ORDER BY nome LIMIT 200`, parametros);
  },

  async atualizar(id, { perfil, ativo }, db = banco) {
    await db.consultar('UPDATE usuarios SET perfil = ?, ativo = ? WHERE id = ?', [perfil, ativo ? 1 : 0, id]);
  },

  async contarVinculos(usuarioId, db = banco) {
    const [linha] = await db.consultar('SELECT COUNT(*) AS total FROM vinculos WHERE usuario_id = ?', [usuarioId]);
    return linha.total;
  },

  async estatisticas(db = banco) {
    const [usuarios] = await db.consultar(
      `SELECT COUNT(*) AS total,
              COALESCE(SUM(perfil = 'cuidador'), 0) AS cuidadores,
              COALESCE(SUM(perfil = 'familiar'), 0) AS familiares,
              COALESCE(SUM(perfil = 'administrador'), 0) AS administradores,
              COALESCE(SUM(ativo = 0), 0) AS inativos
         FROM usuarios`
    );
    const [idosos] = await db.consultar('SELECT COUNT(*) AS total FROM idosos');
    return {
      usuarios: Number(usuarios.total),
      cuidadores: Number(usuarios.cuidadores),
      familiares: Number(usuarios.familiares),
      administradores: Number(usuarios.administradores),
      inativos: Number(usuarios.inativos),
      idosos: Number(idosos.total),
    };
  },
};
