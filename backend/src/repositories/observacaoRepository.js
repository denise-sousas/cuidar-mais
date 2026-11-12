// Acesso ao banco: tabela "observacoes" (observações e ocorrências).
const { banco } = require('../config/database');

module.exports = {
  async listar(idosoId, categoria, db = banco) {
    const parametros = [idosoId];
    let filtro = '';
    if (categoria) {
      filtro = 'AND o.categoria = ?';
      parametros.push(categoria);
    }
    return db.consultar(
      `SELECT o.*, u.nome AS autor
         FROM observacoes o
         LEFT JOIN usuarios u ON u.id = o.usuario_id
        WHERE o.idoso_id = ? ${filtro}
        ORDER BY o.data_hora DESC, o.id DESC
        LIMIT 300`,
      parametros
    );
  },

  async ultimas(idosoId, limite, db = banco) {
    return db.consultar(
      `SELECT o.*, u.nome AS autor
         FROM observacoes o
         LEFT JOIN usuarios u ON u.id = o.usuario_id
        WHERE o.idoso_id = ?
        ORDER BY o.data_hora DESC, o.id DESC
        LIMIT ?`,
      [idosoId, limite]
    );
  },

  async buscar(idosoId, id, db = banco) {
    const [observacao] = await db.consultar('SELECT * FROM observacoes WHERE idoso_id = ? AND id = ?', [idosoId, id]);
    return observacao || null;
  },

  async criar(idosoId, dados, usuarioId, db = banco) {
    const resultado = await db.consultar(
      'INSERT INTO observacoes (idoso_id, titulo, categoria, texto, data_hora, usuario_id) VALUES (?, ?, ?, ?, ?, ?)',
      [idosoId, dados.titulo, dados.categoria, dados.texto, dados.dataHora, usuarioId]
    );
    return resultado.insertId;
  },

  async atualizar(idosoId, id, dados, db = banco) {
    await db.consultar(
      'UPDATE observacoes SET titulo = ?, categoria = ?, texto = ?, data_hora = ? WHERE idoso_id = ? AND id = ?',
      [dados.titulo, dados.categoria, dados.texto, dados.dataHora, idosoId, id]
    );
  },

  async excluir(idosoId, id, db = banco) {
    await db.consultar('DELETE FROM observacoes WHERE idoso_id = ? AND id = ?', [idosoId, id]);
  },
};
