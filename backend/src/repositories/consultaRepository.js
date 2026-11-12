// Acesso ao banco: tabela "consultas" (consultas, exames e compromissos).
const { banco } = require('../config/database');

module.exports = {
  async listar(idosoId, situacao, db = banco) {
    let filtro = '';
    if (situacao === 'pendentes') filtro = 'AND realizada = 0';
    if (situacao === 'realizadas') filtro = 'AND realizada = 1';
    const ordem = situacao === 'realizadas' ? 'DESC' : 'ASC';
    return db.consultar(
      `SELECT * FROM consultas WHERE idoso_id = ? ${filtro} ORDER BY data ${ordem}, horario ${ordem}, id`,
      [idosoId]
    );
  },

  async listarPorData(idosoId, data, db = banco) {
    return db.consultar('SELECT * FROM consultas WHERE idoso_id = ? AND data = ? ORDER BY horario', [idosoId, data]);
  },

  async proxima(idosoId, hoje, db = banco) {
    const [consulta] = await db.consultar(
      'SELECT * FROM consultas WHERE idoso_id = ? AND realizada = 0 AND data >= ? ORDER BY data, horario LIMIT 1',
      [idosoId, hoje]
    );
    return consulta || null;
  },

  async buscar(idosoId, id, db = banco) {
    const [consulta] = await db.consultar('SELECT * FROM consultas WHERE idoso_id = ? AND id = ?', [idosoId, id]);
    return consulta || null;
  },

  async criar(idosoId, dados, usuarioId, db = banco) {
    const resultado = await db.consultar(
      'INSERT INTO consultas (idoso_id, titulo, local, data, horario, descricao, realizada, criado_por) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [idosoId, dados.titulo, dados.local, dados.data, dados.horario, dados.descricao, dados.realizada ? 1 : 0, usuarioId]
    );
    return resultado.insertId;
  },

  async atualizar(idosoId, id, dados, db = banco) {
    await db.consultar(
      'UPDATE consultas SET titulo = ?, local = ?, data = ?, horario = ?, descricao = ?, realizada = ? WHERE idoso_id = ? AND id = ?',
      [dados.titulo, dados.local, dados.data, dados.horario, dados.descricao, dados.realizada ? 1 : 0, idosoId, id]
    );
  },

  async definirRealizada(idosoId, id, realizada, db = banco) {
    await db.consultar('UPDATE consultas SET realizada = ? WHERE idoso_id = ? AND id = ?', [realizada ? 1 : 0, idosoId, id]);
  },

  async excluir(idosoId, id, db = banco) {
    await db.consultar('DELETE FROM consultas WHERE idoso_id = ? AND id = ?', [idosoId, id]);
  },
};
