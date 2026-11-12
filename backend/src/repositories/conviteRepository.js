// Acesso ao banco: tabela "convites_familiares" (autorização por e-mail).
const { banco } = require('../config/database');

module.exports = {
  async listarPorIdoso(idosoId, db = banco) {
    return db.consultar(
      `SELECT c.id, c.email, c.criado_em, u.nome AS criado_por_nome
         FROM convites_familiares c
         LEFT JOIN usuarios u ON u.id = c.criado_por
        WHERE c.idoso_id = ?
        ORDER BY c.criado_em DESC`,
      [idosoId]
    );
  },

  async listarPorEmail(email, db = banco) {
    return db.consultar('SELECT id, idoso_id FROM convites_familiares WHERE email = ?', [email]);
  },

  async buscarPorIdosoEmail(idosoId, email, db = banco) {
    const [convite] = await db.consultar('SELECT id FROM convites_familiares WHERE idoso_id = ? AND email = ?', [idosoId, email]);
    return convite || null;
  },

  async criar(idosoId, email, criadoPor, db = banco) {
    await db.consultar('INSERT INTO convites_familiares (idoso_id, email, criado_por) VALUES (?, ?, ?)', [idosoId, email, criadoPor]);
  },

  async excluir(idosoId, id, db = banco) {
    const resultado = await db.consultar('DELETE FROM convites_familiares WHERE idoso_id = ? AND id = ?', [idosoId, id]);
    return resultado.affectedRows;
  },

  async excluirPorEmail(email, db = banco) {
    await db.consultar('DELETE FROM convites_familiares WHERE email = ?', [email]);
  },
};
