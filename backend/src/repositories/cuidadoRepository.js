// Acesso ao banco: tabela "cuidados" (itens da rotina diária).
const { banco } = require('../config/database');

module.exports = {
  async listarPorData(idosoId, data, db = banco) {
    return db.consultar(
      `SELECT c.*, u.nome AS concluido_por_nome
         FROM cuidados c
         LEFT JOIN usuarios u ON u.id = c.concluido_por
        WHERE c.idoso_id = ? AND c.data = ?
        ORDER BY c.horario, c.id`,
      [idosoId, data]
    );
  },

  async buscar(idosoId, id, db = banco) {
    const [cuidado] = await db.consultar('SELECT * FROM cuidados WHERE idoso_id = ? AND id = ?', [idosoId, id]);
    return cuidado || null;
  },

  async criar(idosoId, dados, usuarioId, db = banco) {
    const resultado = await db.consultar(
      'INSERT INTO cuidados (idoso_id, titulo, descricao, tipo, data, horario, criado_por) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [idosoId, dados.titulo, dados.descricao, dados.tipo, dados.data, dados.horario, usuarioId]
    );
    return resultado.insertId;
  },

  async atualizar(idosoId, id, dados, db = banco) {
    await db.consultar(
      'UPDATE cuidados SET titulo = ?, descricao = ?, tipo = ?, data = ?, horario = ? WHERE idoso_id = ? AND id = ?',
      [dados.titulo, dados.descricao, dados.tipo, dados.data, dados.horario, idosoId, id]
    );
  },

  async definirConclusao(idosoId, id, { concluido, concluidoEm, usuarioId }, db = banco) {
    await db.consultar(
      'UPDATE cuidados SET concluido = ?, concluido_em = ?, concluido_por = ? WHERE idoso_id = ? AND id = ?',
      [concluido ? 1 : 0, concluido ? concluidoEm : null, concluido ? usuarioId : null, idosoId, id]
    );
  },

  async excluir(idosoId, id, db = banco) {
    await db.consultar('DELETE FROM cuidados WHERE idoso_id = ? AND id = ?', [idosoId, id]);
  },
};
