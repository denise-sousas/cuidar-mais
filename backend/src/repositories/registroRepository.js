// Acesso ao banco: tabela "registros_cuidado" (alimentação, hidratação, higiene...).
const { banco } = require('../config/database');
const { adicionarDias } = require('../utils/datas');

module.exports = {
  async listar(idosoId, { data, tipo }, db = banco) {
    const parametros = [idosoId, `${data} 00:00:00`, `${adicionarDias(data, 1)} 00:00:00`];
    let filtroTipo = '';
    if (tipo) {
      filtroTipo = 'AND r.tipo = ?';
      parametros.push(tipo);
    }
    return db.consultar(
      `SELECT r.*, u.nome AS autor
         FROM registros_cuidado r
         LEFT JOIN usuarios u ON u.id = r.usuario_id
        WHERE r.idoso_id = ? AND r.data_hora >= ? AND r.data_hora < ? ${filtroTipo}
        ORDER BY r.data_hora DESC, r.id DESC`,
      parametros
    );
  },

  async buscar(idosoId, id, db = banco) {
    const [registro] = await db.consultar('SELECT * FROM registros_cuidado WHERE idoso_id = ? AND id = ?', [idosoId, id]);
    return registro || null;
  },

  async criar(idosoId, dados, usuarioId, db = banco) {
    const resultado = await db.consultar(
      'INSERT INTO registros_cuidado (idoso_id, tipo, descricao, quantidade_ml, data_hora, usuario_id) VALUES (?, ?, ?, ?, ?, ?)',
      [idosoId, dados.tipo, dados.descricao, dados.quantidadeMl, dados.dataHora, usuarioId]
    );
    return resultado.insertId;
  },

  async atualizar(idosoId, id, dados, db = banco) {
    await db.consultar(
      'UPDATE registros_cuidado SET tipo = ?, descricao = ?, quantidade_ml = ?, data_hora = ? WHERE idoso_id = ? AND id = ?',
      [dados.tipo, dados.descricao, dados.quantidadeMl, dados.dataHora, idosoId, id]
    );
  },

  async excluir(idosoId, id, db = banco) {
    await db.consultar('DELETE FROM registros_cuidado WHERE idoso_id = ? AND id = ?', [idosoId, id]);
  },

  async resumoDoDia(idosoId, data, db = banco) {
    return db.consultar(
      `SELECT tipo, COUNT(*) AS total, COALESCE(SUM(quantidade_ml), 0) AS ml
         FROM registros_cuidado
        WHERE idoso_id = ? AND data_hora >= ? AND data_hora < ?
        GROUP BY tipo`,
      [idosoId, `${data} 00:00:00`, `${adicionarDias(data, 1)} 00:00:00`]
    );
  },
};
